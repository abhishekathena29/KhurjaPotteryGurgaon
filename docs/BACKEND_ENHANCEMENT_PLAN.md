# Potters Central Backend and Admin Enhancement Plan

## 1. Goal

Deliver the requested catalogue, inventory, pricing, order, seller, request-tracking, search, and bulk-management capabilities as one coherent commerce system. The implementation must preserve existing products and orders, prevent overselling and duplicate SKUs, keep financial data auditable, and avoid placing business-critical rules only in the React client.

## 2. Current-state findings

The application is currently a React/Vite client using Firebase Authentication and direct Firestore reads/writes. There is no trusted server-side commerce layer yet.

Important current behaviours:

- Any signed-in Firebase user passes the admin route guard; no admin role is checked.
- Products and orders are written directly from the browser.
- Checkout trusts product prices and totals stored in the browser cart.
- Order creation does not check or decrement stock.
- SKU is optional. When absent, the storefront creates a display-only fallback from the Firestore document ID; that fallback is not stored or uniqueness-enforced.
- Product colour and size are single strings, so a listing cannot safely represent separately selectable or stocked variants.
- Product price is treated as the selling price and the displayed MRP is derived by increasing it according to the discount percentage.
- The admin product upload code uses a hard-coded Cloudinary demo URL and preset, even though an environment-based upload helper exists elsewhere.
- Product search navigates to a `search` query parameter, but the product listing does not consume it.
- “Best Sellers” currently means discounted products, not products with the most sales.
- Product request submission only logs to the browser console; it is not persisted or shown to admins.
- Fulfilment status and payment status are not separate. Cancellation has no required reason, stock reversal, refund handling, notification, or audit entry.
- Seller contact details are duplicated into product records. There is no seller payable ledger or settlement process.
- Admin product and order views load entire collections and mostly filter in memory, without pagination or Firestore indexes.

These limitations mean inventory, SKU, payment, cancellation, and settlement changes cannot be implemented safely as isolated form fields.

## 3. Target architecture

Keep the existing React/Vite storefront and Firebase platform, and add a trusted Firebase backend:

- **Firebase Authentication:** customer identities and admin identities.
- **Custom claims:** `admin: true` and, if a seller portal is later added, `sellerId`.
- **Cloud Functions (TypeScript):** privileged product mutations, SKU allocation, checkout, stock reservations, order transitions, cancellation, payment webhooks, seller ledger creation, notifications, and bulk jobs.
- **Firestore:** transactional commerce data, audit records, job state, and denormalized read models.
- **Firebase Storage:** authenticated product image uploads with Storage rules, metadata, and lifecycle cleanup. Existing external image URLs remain valid during migration.
- **App Check:** reduce abusive calls from unauthorized clients.
- **Notification adapter:** provider-neutral interface for email, SMS, and/or WhatsApp. Templates and channel settings live in secured configuration rather than UI constants.
- **Payment adapter:** provider-neutral online payment flow. A payment gateway must be selected before COD is restricted because orders below the COD threshold need a supported prepaid method.

The React app should call typed backend services for all privileged or transactional mutations. Public catalogue reads may continue through Firestore under restrictive rules, or move behind read endpoints later without changing the UI service interface.

## 4. Canonical data model

### 4.1 Public products: `products/{productId}`

```text
name
slug
description
categoryId
categoryName                 // read-model snapshot
status                       // draft | active | archived
mrp                          // integer minor currency units, e.g. paise
discountPercent              // integer 0..100
salePrice                    // server-derived and stored for query/display
currency                     // INR
images[]                     // { id, storagePath, url, alt, sortOrder, colorId? }
variantSummary[]             // public variant data only
availableQuantity            // sum of available active variants
stockStatus                  // in_stock | low_stock | out_of_stock
merchandising                // manual bestseller/featured controls
salesMetrics                 // safe aggregate counts/scores
search                       // normalized name/category/tags/tokens
createdAt, updatedAt
createdBy, updatedBy
schemaVersion
```

Money must be stored as integer minor units. UI formatting converts paise to rupees. This eliminates floating-point rounding errors.

### 4.2 Sellable variants: `products/{productId}/variants/{variantId}`

```text
sku                          // required, normalized, immutable by default
color                        // { id, name, hex? }
size                         // optional
attributes                   // extension point for future material/capacity/etc.
status                       // active | inactive
onHandQuantity
reservedQuantity
availableQuantity            // onHand - reserved, maintained server-side
lowStockThreshold
priceOverride?               // optional; otherwise product salePrice
imageIds[]                   // optional colour-specific image selection
createdAt, updatedAt
```

Use variants even when a product has only one colour. A single-colour product receives one default variant. This keeps SKU, stock, cart selection, and order tracking consistent and allows multiple colours or colour-size combinations without another migration.

### 4.3 Private commercial data: `productCommercials/{productId}`

```text
sellerId
sellerPayoutType             // fixed | percentage
sellerPayoutValue
unitCost?                    // optional internal landed cost
packagingCost?
taxClass?
notes?
updatedAt, updatedBy
```

This collection is admin/backend-only so seller payout and cost information are never exposed with public product reads.

### 4.4 SKU registry: `skus/{normalizedSku}`

```text
productId
variantId
displaySku
createdAt
```

Using the normalized SKU as the document ID makes uniqueness an atomic create condition instead of an unsafe “query then insert” check.

### 4.5 Counters: `counters/productSku`

```text
nextNumber
prefix                       // configurable, e.g. PC
padding                      // configurable
```

The backend allocates the next value in a Firestore transaction and claims it in the SKU registry in the same operation. Admins can normally leave SKU blank and receive an automatic value; any permitted manual SKU is still mandatory after normalization and must atomically claim the registry record.

For products with variants, allocate one SKU per sellable variant. A product-level reference code may also be stored for admin grouping, but orders must track the variant SKU actually purchased.

### 4.6 Orders: `orders/{orderId}`

```text
orderNumber                  // human-readable, backend-generated
userId, userEmail
items[]                      // immutable purchase snapshot
  productId, variantId, sku
  name, selectedColor, selectedSize
  sellerId, sellerName
  quantity, mrp, discountPercent, unitSalePrice
  sellerPayoutPerUnit
subtotal, deliveryFee, discountTotal, taxTotal, grandTotal
currency
addressSnapshot
payment                      // method, status, gateway ids, paidAt, amountPaid
fulfilmentStatus             // pending | confirmed | packed | shipped | delivered | cancelled
cancellation                 // reasonCode, customerMessage, internalNote, cancelledBy, cancelledAt
inventoryState               // reserved | committed | released
createdAt, updatedAt
version
```

Payment status is independent of fulfilment status:

- `pending`, `authorized`, `paid`, `failed`, `refunded`, `partially_refunded`, or `not_required`.
- COD begins as `pending` and is marked `paid` when cash is received, with actor and timestamp recorded.
- Gateway payments become `paid` only from a verified backend webhook, never from a browser redirect alone.

### 4.7 Order history: `orders/{orderId}/events/{eventId}`

Append-only events record status transitions, payment changes, cancellations, stock changes, notifications, and admin actions. Each event includes actor, previous value, new value, timestamp, and an idempotency key where relevant.

### 4.8 Inventory ledger: `inventoryMovements/{movementId}`

```text
productId, variantId, sku
type                         // opening, sale, cancellation, return, adjustment, reservation, release
quantityDelta
orderId?
reason
actorId
createdAt
idempotencyKey
```

The ledger provides reconciliation and makes manual quantity edits auditable. Admin “set quantity” operations are stored as the calculated delta plus a required reason.

### 4.9 Sellers, ledger, and settlements

Extend `sellers/{sellerId}` with payout preferences, tax/business details as required, notification channels, and status.

```text
sellerLedger/{entryId}
  sellerId, orderId, orderItemKey
  type                       // earning | reversal | adjustment | payout
  amount, currency
  availableAt
  status                     // pending | payable | included_in_settlement | paid | reversed
  settlementId?
  createdAt

settlements/{settlementId}
  sellerId
  periodStart, periodEnd
  entryIds
  grossEarnings, deductions, adjustments, netPayable
  status                     // draft | approved | processing | paid | failed
  payoutReference?
  paidAt?
  statementUrl?
```

Ledger earnings are created idempotently from paid/delivered order items according to the agreed business rule. Cancellation, refund, or return produces reversal entries instead of altering historical earnings. A scheduled job prepares seller statements; an admin approves and records payout details. Sellers receive itemized statements and status updates through their configured channels.

### 4.10 Product requests: `productRequests/{requestId}`

Persist every current request form field plus `userId?`, contact details, status, assignment, admin notes, attachments/reference links, timestamps, and history.

Suggested workflow: `new -> reviewing -> quoted -> accepted -> in_progress -> fulfilled`, with `rejected` and `cancelled` terminal states. The admin tab supports search, filters, detail view, assignment, notes, and customer updates.

### 4.11 Bulk jobs: `bulkJobs/{jobId}`

Store selection criteria or explicit product IDs, operation, validated payload, preview counts, status, progress, per-item errors, actor, and timestamps. The backend processes large selections in safe chunks and can resume without reapplying successful items.

## 5. Business rules and end-to-end workflows

### 5.1 Product creation and colour variants

1. Admin starts a draft and uploads product-level or colour-specific images.
2. Admin adds one or more variants. Each must have a colour; size remains optional.
3. The UI prevents duplicate attribute combinations such as two `Blue / Large` variants.
4. SKU is auto-allocated by default. If manual SKU entry is enabled for admins, the backend normalizes and atomically reserves it.
5. Quantity is entered per variant, not only at product level.
6. Backend validates category, money, discount, seller, image ownership, variants, SKU claims, and role.
7. Backend derives sale price, aggregate availability, and stock status.
8. Product becomes publicly visible only when it is active, has at least one active variant, valid pricing, and at least one valid image according to the chosen publication rule.

The storefront product page displays colour choices, changes images/availability for the selected colour, and adds `productId + variantId` to the cart. Cart identity must use the variant ID so two colours of the same product are separate lines.

### 5.2 Inventory and checkout

Never trust cart price, stock, seller, discount, or total from local storage.

1. Client sends variant IDs, quantities, address, and payment method to `createCheckout`.
2. Backend reloads current products/variants and rejects inactive, missing, or insufficient-stock lines.
3. Backend recomputes every price and total.
4. A Firestore transaction reserves stock by increasing `reservedQuantity`; `availableQuantity` immediately falls, so concurrent customers cannot oversell.
5. Backend creates an order and an expiring reservation using an idempotency key.
6. For prepaid orders, backend creates a gateway payment session. Verified webhook success converts the reservation to committed stock. Failure or timeout releases it.
7. For COD orders, the accepted order keeps/commits the reservation according to the chosen fulfilment policy; either way the quantity is unavailable to other shoppers immediately.
8. Cancellation before shipment releases/restores stock once. Idempotency prevents webhook retries or repeated clicks from double-changing quantity.

The storefront must disable add-to-cart and checkout for zero availability, cap quantity controls at available quantity, label zero as “Out of stock”, and revalidate at checkout because availability may change after a cart was created.

Low-stock thresholds and alerts are configurable per variant, with an admin filter for low/out-of-stock products.

### 5.3 Pricing, discount, and margin

Admin enters:

- MRP/base price.
- Discount percentage or, if later required, a fixed discount mode.
- Seller payout terms and optional internal cost data in the private commercial record.

Backend computes:

```text
discountAmount = round(mrp * discountPercent / 100)
salePrice      = mrp - discountAmount
grossMargin    = salePrice - sellerPayout - variableCosts
marginPercent  = grossMargin / salePrice * 100
```

The form shows a live preview of MRP, discount amount, selling price, seller payout, estimated costs, gross margin, and margin percentage before save. The backend repeats the calculation and stores authoritative values.

MRP and final sale price should follow an explicit rounding policy configured once for the business. If “charm pricing” or nearest ₹5/₹10 rounding is desired, expose it as a named pricing rule and preview it; do not silently round in individual components.

Orders snapshot all price components so later catalogue edits do not alter historical orders or seller dues.

### 5.4 COD eligibility

Add secured commerce configuration:

```text
cod.enabled
cod.minimumOrderAmount
cod.allowedPincodes?         // optional
cod.maximumOrderAmount?      // optional
deliveryFee
reservationTtlMinutes
```

Both frontend and backend evaluate eligibility, but the backend is authoritative. COD is offered only when enabled and the server-calculated eligible amount is at least ₹1,500 (stored as configuration, not embedded in components). If a discount or cart change drops the amount below the threshold, COD is removed and the customer must choose prepaid payment.

Before enabling this rule in production, implement and test at least one online payment method; otherwise customers below the threshold cannot complete checkout.

### 5.5 Order state, paid state, and cancellation

The admin order list shows separate fulfilment and payment badges, and filters for both. Allowed status transitions are enforced on the backend; for example, delivered orders cannot simply return to pending.

Cancellation flow:

1. Admin chooses a required standardized reason code.
2. Admin enters or confirms a required customer-facing explanation. An optional internal note remains private.
3. UI previews the message and any inventory/refund effect.
4. Backend transaction verifies the order is cancellable, marks it cancelled, releases eligible inventory, creates refund work if prepaid, reverses seller ledger entries if needed, and appends an event.
5. Notification job sends the order number, reason, refund/payment information, and support contact to the customer.
6. Delivery cancellation failures or notification failures are visible and retryable; they do not roll back the canonical cancellation.

“Paid” changes require a dedicated permission and audit record. Online payments can only be marked paid by a verified payment webhook. COD can be manually recorded as paid with amount, date, collector, and optional reference.

### 5.6 Seller updates and amounts due

Each order item snapshots `sellerId`, SKU, quantity, and payout amount. The seller ledger is therefore deterministic even when one order contains items from multiple sellers.

Admin seller detail page includes:

- pending earnings, payable balance, paid total, and reversals;
- order/SKU-level ledger entries;
- date and status filters;
- settlement creation and approval;
- exportable statement;
- payout reference and proof fields;
- notification delivery history.

Notifications can be triggered on new seller order, cancellation, delivery, settlement approved, and settlement paid. Start with admin-controlled email/WhatsApp delivery; a seller login/portal can be added later using the same ledger and permissions without redesigning accounting.

### 5.7 Best sellers

Replace the current “has a discount” proxy with order-derived metrics.

Maintain paid, non-cancelled quantity and revenue aggregates per product. A scheduled backend job computes a configurable rolling score, for example over 30 or 90 days. The catalogue supports three merchandising modes:

- `auto`: eligible when the computed rank meets configured rules;
- `force_on`: admin explicitly marks it a best seller;
- `force_off`: admin excludes it.

Keep `featured` as a separate manual concept so homepage promotion and best-selling performance are not conflated. The UI displays whether a badge is automatic or manually overridden, along with the metric used.

### 5.8 Product request tracking

Replace the current console-only form action with a backend submission endpoint that validates fields, rate-limits abuse, records the request, and sends customer/admin acknowledgements. Add a “Requests” admin tab with list, search, filters, complete submitted details, status, owner, notes, and history.

If reference images are needed, use the same secure upload pattern in a separate request folder with stricter file limits and access rules.

### 5.9 Storefront search

Immediate correct behaviour for the current catalogue size:

- Read the `search` query parameter using React Router.
- Normalize case, whitespace, punctuation, and common Unicode forms.
- Match name, SKU, category, description, colours, sizes, and configured tags.
- Combine search with existing category/colour/size/price filters and sorting.
- Keep the query in the URL, show the search term and result count, and provide a clear-search state.

To avoid coupling the UI to the current all-products fetch, put searching behind a catalogue search service. If catalogue size later makes client search unsuitable, sync the same public fields to a dedicated full-text search provider through backend triggers and swap the service implementation without changing pages.

### 5.10 Admin search, sort, filter, and pagination

Move products to a table/list view suited to operations, retaining cards only as an optional view. Provide:

- search by product name, exact/prefix SKU, seller, and category;
- filters for active/draft/archived, category, seller, best-seller mode, in/low/out of stock, discount range, price range, and created/updated date;
- sort by newest, updated, name, MRP, sale price, discount, available stock, and sales;
- cursor-based pagination and page size;
- URL-persisted filter state;
- visible result count and selected count.

Use server-side Firestore queries and documented composite indexes where possible. For broad multi-field text search, reuse the catalogue/admin search service. Do not fetch the full collection for every view refresh.

### 5.11 Bulk product updates

Support selecting rows, the current page, or all results matching the active filters. Initial whitelisted actions:

- set/increase/decrease/clear discount;
- change status or category;
- set best-seller override;
- assign seller/commercial terms with explicit confirmation;
- adjust inventory by delta with a required reason;
- update low-stock threshold.

Bulk workflow:

1. Admin selects an action and scope.
2. Backend validates a dry run and returns affected count, excluded count, and representative before/after values.
3. UI requires confirmation, with extra confirmation for price, seller, or inventory changes.
4. Backend creates a resumable bulk job, processes records in bounded chunks, recalculates derived fields, and writes audit events.
5. UI shows progress and item-level errors and allows retrying only failed items.

Never loop client-side over unrestricted product updates; it is fragile, bypasses centralized validation, and cannot provide reliable audit/retry semantics.

## 6. Image upload repair and migration

Use Firebase Storage because it is already initialized and integrates with Firebase Auth and Security Rules.

Implementation requirements:

- Admin role required to upload product media.
- Paths such as `products/{productId}/{imageId}/original.ext`; request attachments use a separate root.
- Validate MIME type, extension, actual file signature where backend processing is used, file size, image dimensions, and maximum count.
- Resumable upload with per-file progress, retry, clear error messages, and cancellation.
- Store structured image metadata, not only anonymous URL strings.
- Preserve display order and alt text; optionally associate an image with a colour variant.
- Create product draft ID before upload, then clean orphaned draft uploads on expiry.
- Delete media only after verifying it is no longer referenced.
- Optionally generate optimized thumbnail/card/detail sizes through a Storage-triggered function.
- Keep existing Cloudinary/external URLs readable. A separate migration job may copy them later; migration is not required to make old products work.

If Cloudinary is retained instead, use authenticated/signed server-generated upload parameters and the existing environment configuration. Do not keep the demo cloud name/preset or expose a privileged secret in Vite variables.

## 7. Security and authorization foundation

This work should begin before new admin mutations are enabled.

- Assign admin access through Firebase custom claims using a controlled script/process.
- Change `ProtectedRoute` to require the admin claim, but treat it as UX only; backend and Firestore/Storage rules remain authoritative.
- Public users can read only active public product/category fields.
- Customers can read only their own orders and profile; they cannot write authoritative order totals/status/payment/inventory fields.
- Sellers, if enabled, can read only their own permitted ledger/order projections.
- Product commercial terms, settlements, audit events, configuration, counters, and SKU registry are never publicly readable.
- All admin and commerce functions validate auth, role, payload schema, transition permissions, and idempotency keys.
- Enable App Check and rate limiting for public request/checkout endpoints.
- Keep secrets in backend secret management, never in `VITE_*` variables.
- Log privileged operations with actor and request correlation IDs.

Add version-controlled `firestore.rules`, `storage.rules`, `firestore.indexes.json`, Functions source, emulator configuration, and deployment documentation to the repository.

## 8. APIs/backend operations

Define versioned request/response schemas and shared TypeScript types for at least:

- `createProductDraft`
- `saveProduct`
- `archiveProduct`
- `allocateSku`
- `adjustInventory`
- `createCheckout`
- `confirmPaymentWebhook`
- `expireReservations`
- `transitionOrder`
- `cancelOrder`
- `recordCodPayment`
- `submitProductRequest`
- `updateProductRequest`
- `previewBulkProductUpdate`
- `runBulkProductUpdate`
- `createSettlement`
- `approveSettlement`
- `recordSettlementPayment`
- `retryNotification`

Mutation endpoints return stable error codes such as `OUT_OF_STOCK`, `SKU_ALREADY_EXISTS`, `COD_NOT_ELIGIBLE`, `INVALID_STATUS_TRANSITION`, and `STALE_VERSION`, allowing the UI to show specific corrective messages.

## 9. Migration plan

Run migrations in an emulator/staging project first, then back up production Firestore before live execution.

1. Add `schemaVersion` and build idempotent migration scripts with dry-run/report modes.
2. Normalize legacy product fields while preserving old fields during a compatibility window.
3. Convert each legacy product to one default variant:
   - colour from the existing `color` string or `Unspecified`;
   - size from the existing `size` string when present;
   - opening quantity supplied through an admin inventory import/reconciliation step, not guessed;
   - existing SKU if valid and unique, otherwise allocate a new SKU.
4. Detect duplicate/missing SKUs before writing. Produce an exception report and mapping from old product ID to new product/variant SKU.
5. Interpret the current `price` as the current selling price during migration unless the business supplies original MRP. Preserve displayed economics by deriving or importing MRP carefully; do not silently change live prices.
6. Copy `imageUrl/imageUrls` into structured image metadata as external URLs without breaking links.
7. Resolve seller references by matching existing seller records; route ambiguous/unmatched products to a review report.
8. Backfill search fields and public availability summaries.
9. Keep historical order item snapshots unchanged, while adding default payment/fulfilment structures and mapping legacy statuses.
10. Do not retroactively create seller liabilities without an agreed accounting start date. Import opening balances separately and record their source.
11. Deploy dual-read compatibility, migrate, verify counts/totals/samples, switch writes, then remove legacy reads only after a monitored period.

Because current products have no reliable quantity, go-live must include a stocktake/import template keyed by product and assigned SKU. Products without confirmed opening stock should remain draft or out of stock.

## 10. Admin and storefront UX deliverables

### Admin

- Role-aware login and unauthorized state.
- Product operational table, search/filter/sort/pagination, saved URL state, bulk selection/jobs.
- Product editor with variants, colour add/remove, per-variant SKU/stock, secure images, pricing/margin preview, seller terms, and publication validation.
- Inventory adjustment history and low-stock indicators.
- Orders with separate fulfilment/payment filters, transactional actions, required cancellation modal, refund/stock impact preview, and event timeline.
- Requests tab with full submitted details and workflow.
- Sellers with balances, ledger, settlements, statements, and notification history.
- Best-seller performance and override controls.
- Explicit loading, empty, partial failure, retry, and stale-update states throughout.

### Storefront/customer account

- Functional URL-based search integrated with filters.
- Variant colour/size selector and variant images.
- Accurate MRP, saving, and final sale price.
- In-stock/low-stock/out-of-stock display and stock-capped quantities.
- Server-validated checkout and meaningful stock/price-change recovery.
- COD option only when backend says eligible; online payment for other orders.
- Order view with fulfilment and payment status, selected colour/size/SKU, cancellation message, and refund information.

## 11. Testing strategy

### Unit tests

- Money and rounding functions.
- SKU normalization/allocation formatting.
- Variant uniqueness and aggregate availability.
- COD eligibility.
- Allowed order/payment transitions.
- Margin and seller payout calculations.
- Bestseller scoring and overrides.
- Search normalization and filter composition.

### Emulator integration tests

- Two simultaneous checkouts for the last unit: only one succeeds.
- Reservation expiry restores availability exactly once.
- Payment webhook retries do not duplicate stock, ledger, or notifications.
- Cancellation restores eligible stock and creates one reversal/refund task.
- Duplicate manual SKU claims fail atomically.
- Unauthorized users cannot mutate products, orders, payment status, inventory, commercial terms, or settlements.
- Bulk job retry does not reapply successful records.
- Seller ledger totals reconcile to eligible order-item snapshots and reversals.

### UI/end-to-end tests

- Create one-colour and multi-colour products, upload/reorder/remove images, and publish.
- Select distinct variants into the cart and track SKU/colour through the order.
- Out-of-stock UI and checkout conflict recovery.
- MRP-discount-sale-price display consistency across list, detail, cart, checkout, order, and admin.
- Search from desktop/mobile header and combined filter/sort behaviour.
- COD at just below, exactly at, and above configured threshold.
- Required cancellation reason and customer-facing message preview.
- Product request submission and admin visibility.
- Bulk discount preview, execution, progress, audit, and partial retry.

### Reconciliation and non-functional checks

- Sum of inventory movement deltas matches variant on-hand balances.
- Order totals equal immutable item snapshots and charges.
- Settlement totals equal included ledger entries.
- Accessibility for forms, modals, statuses, keyboards, and errors.
- Performance with production-like product/order volumes and paginated queries.
- Monitoring/alerts for function errors, payment webhook failures, stuck reservations/jobs, notification failures, and negative/reconciliation anomalies.

## 12. Delivery phases and acceptance gates

### Phase 0 — Decisions and baseline

- Confirm payment gateway, notification channels/provider, tax treatment, shipping fee policy, margin definition, seller payout trigger, return/refund rules, SKU prefix, rounding policy, and opening stock.
- Capture a production data backup and representative test dataset.
- Add automated build/lint/test checks.

**Gate:** business rules signed off; staging Firebase project and deployment pipeline ready.

### Phase 1 — Security and backend foundation

- Cloud Functions TypeScript project, shared schemas/types, Auth custom claims, rules, App Check, audit events, configuration documents, and emulator tests.

**Gate:** privilege tests pass; ordinary customers cannot access admin or authoritative mutations.

### Phase 2 — Catalogue, variants, SKU, stock, images, and pricing

- New schema, migration scripts, product editor, secure uploads, variant storefront/cart, inventory ledger, pricing/margin model, admin product search/filter/sort/pagination.

**Gate:** migrated catalogue reconciles; all sellable variants have unique SKUs and approved stock; price display is consistent everywhere.

### Phase 3 — Transactional checkout, payment, COD, and orders

- Server-priced checkout, stock reservation, online payment/webhook, COD configuration, order/payment states, cancellation/refund/notification flow, customer order display.

**Gate:** concurrency, idempotency, payment, cancellation, and stock reconciliation tests pass; payment provider sandbox is signed off.

### Phase 4 — Requests, best sellers, seller ledger, and settlements

- Persisted request workflow, order-derived bestseller metrics plus override, seller earnings/reversals, statements, settlements, and notifications.

**Gate:** accounting sample reconciles order-item to seller statement; request and notification retry workflows are operational.

### Phase 5 — Bulk operations and operational hardening

- Bulk preview/jobs, resumability, monitoring dashboards, data reconciliation jobs, backup/restore rehearsal, admin runbooks, and performance tests.

**Gate:** bulk failure/retry and restore drills pass; operational owners know how to resolve stuck jobs, payments, and notifications.

## 13. Definition of done

The project is complete only when:

- every requested capability is implemented through centralized validated services, not page-local rules;
- all active sellable variants have a stored unique SKU and auditable quantity;
- overselling is prevented under concurrent checkout;
- product price always means MRP input and discount is subtracted to derive sale price;
- sensitive margin/seller data is protected;
- order fulfilment and payment states are separate and auditable;
- cancellation requires a reason, safely handles stock/refund/ledger effects, and queues the customer message;
- COD threshold is configurable and enforced server-side with a working prepaid alternative;
- seller dues reconcile from immutable order-item snapshots through settlement;
- best sellers are order-derived with explicit override controls;
- submitted product requests are persisted and visible in admin;
- storefront search works with filters and URL state;
- admin search/filter/sort/pagination and resumable bulk updates work at production volume;
- old products, images, orders, and customer access survive migration;
- security rules, indexes, backend functions, tests, monitoring, migrations, and operating documentation are version-controlled and deployed.

## 14. Business decisions required before implementation

These are configuration/design inputs, not reasons to delay the engineering foundation:

1. Which prepaid payment gateway will be used?
2. Which customer and seller notification channels are required at launch: email, SMS, WhatsApp, or a combination?
3. Is inventory tracked separately for every colour/size combination? This plan recommends yes.
4. Does seller earning become payable at payment, shipment, delivery, or after a return window?
5. Is seller payout a fixed unit amount, a percentage, or both by product?
6. What costs count in the displayed admin profit margin?
7. What SKU prefix/padding and whether manual override is allowed?
8. What rounding policy should apply to the calculated sale price?
9. Can customers cancel, or is cancellation admin-only for this scope?
10. What production date starts seller ledger accounting, and are opening balances required?

