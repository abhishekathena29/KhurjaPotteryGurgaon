# Architecture & How Everything Works in Production

This is the map of the whole system. Read it to understand where each piece runs,
how requests flow, and **what actually happens when you use each feature on the
deployed site** — uploading an image, editing a product, checking out, cancelling
an order, paying a seller, and so on.

---

## 1. The moving parts

```
   ┌───────────────┐        Firebase ID token          ┌───────────────────────────┐
   │   Browser     │ ───────────────────────────────▶  │      Firebase project     │
   │  React SPA    │        client SDK reads/writes     │   Auth  ·  Firestore      │
   │ (static host) │ ◀───────────────────────────────  │  (rules-enforced)          │
   └───────┬───────┘                                    └───────────────────────────┘
           │
           │  unsigned browser upload (product photos,
           │  payment QR, payment-proof screenshots)
           ▼
   ┌───────────────┐
   │   Cloudinary  │
   └───────────────┘
```

1. **Browser (React SPA)** — served as static files from a static host (e.g. Vercel).
   Holds no secrets. Signs users in with Firebase Auth directly and reads/writes
   Firestore directly through the Firebase Web SDK — there is no backend in between.
2. **Firebase** — Auth (identities) and Firestore (all data: catalogue, orders,
   inventory, sellers, config, audit trail). There is no Firebase Storage and no
   service account; the browser is the only client and it authenticates as the signed-in
   user.
3. **Cloudinary** — image storage for product photos, the payment QR, and
   payment-proof screenshots. The browser uploads directly to Cloudinary via an
   *unsigned* upload preset (`VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET`);
   Cloudinary returns a public `secure_url` that gets stored on the relevant Firestore
   document.

> **Deployment model:** two independent deploys that share one Firebase project id —
> the Firestore rules/indexes, and the static frontend build. There is no backend to
> deploy, no service account to provision, and no scheduled jobs to configure on any
> host.

---

## 2. How the browser talks to Firebase

Everything goes through the Firebase Web SDK directly, wrapped in `src/services/`:

- **`catalogueApi.js`** — public catalogue reads (products, categories), cached briefly
  client-side; `invalidateCatalogue()` clears the cache after an admin edit.
- **`commerceApi.js`** — `commerceApi` for customer-facing writes (checkout, product
  requests, own-order reads) and `adminApi` for privileged admin operations (save
  product, transition order, adjust inventory, settlements, commerce config, bulk jobs,
  maintenance actions). Every one of these is a normal Firestore SDK call (`setDoc`,
  `updateDoc`, `runTransaction`, batched writes, …) made as the signed-in user.
- **`productImages.js`** / **`paymentUploads.js`** — upload a file directly to
  Cloudinary via the unsigned preset, then persist the returned `url` onto the relevant
  Firestore document (product image, `commerceConfig.manualPaymentQrUrl`, or an order's
  payment-proof field).

There is no server to re-check permissions after the fact. **`firestore.rules` is the
only enforcement point** — every invariant that used to live in trusted backend code
(price/stock integrity, one-reservation-per-unit, admin-only fields, order state
transitions, seller ledger writes) is now expressed as a Firestore security rule, and
the client SDK calls fail outright if a write violates one.

---

## 3. Authentication & admin authorization

- **Customers** sign up / sign in with Firebase Auth email+password
  (`AuthContext.jsx`). A profile doc is written to `users/{uid}`.
- **Admins** are identified by a single Firestore field: `users/{uid}.isAdmin == true`.
  `firestore.rules`'s `isAdmin()` helper reads that field and gates every privileged
  rule (catalogue writes, order transitions, inventory, commerce config, seller ledger,
  settlements, category management). There are no custom claims and no server-side
  allowlist.
- `AuthContext` loads the user's profile document on sign-in to know whether to show
  the admin UI. `ProtectedRoute.jsx` only *hides* the admin UI for non-admins — the
  Firestore rules enforce the real boundary regardless of what the React router shows.
- See [`ADMIN_SETUP.md`](./ADMIN_SETUP.md) for how to grant admin access (set
  `isAdmin: true` on a user's document in the Firebase Console).

---

## 4. Feature-by-feature: what happens when deployed

### 4.1 Image upload

Product photos, the payment QR, and payment-proof screenshots all use the same path:
the browser uploads the file **directly to Cloudinary** via an *unsigned upload preset*
(`config/cloudinary.js`), and the returned `secure_url` is stored as plain data —
on the product's `images[]` array, on `commerceConfig.manualPaymentQrUrl`, or on the
order's payment-proof field. Nothing is written to Firestore until the surrounding form
is saved (image upload alone doesn't mutate the catalogue).

The browser validates type (JPEG/PNG/WebP/GIF) and size before uploading. There is no
Firebase Storage bucket and no server-side re-validation of file bytes — the unsigned
preset should be restricted (allowed formats, max size, target folder) in the Cloudinary
dashboard to limit stray uploads, and the admin UI being admin-gated is what limits who
can trigger a product-image upload in the first place. Removing an image from a product
does **not** delete the underlying Cloudinary asset (fine within the free tier; prune
manually if ever needed).

Setup once, then it's env-only in production:
1. Create a free Cloudinary account → note the **Cloud name**.
2. Settings → Upload → **Add upload preset** → Signing mode **Unsigned** → save → note
   the **preset name**. (Optionally restrict formats, max size, and target folder.)
3. Set `VITE_CLOUDINARY_CLOUD_NAME=...` and `VITE_CLOUDINARY_UPLOAD_PRESET=...` on the
   frontend host and redeploy.

### 4.2 Creating / editing a product

Flow (`ProductsTab.jsx` → `adminApi.saveProduct` in `commerceApi.js`):

1. A product **draft id is generated up front** so images can be uploaded to Cloudinary
   and grouped under it before the first save.
2. Admin fills name, description, category, **MRP + discount %**, one or more
   **variants** (each variant = colour [+ optional size], per-variant SKU and on-hand
   quantity, low-stock threshold), seller payout terms, internal costs, and
   merchandising flags (featured / best-seller mode).
3. On Save, `saveProduct` (running as the signed-in admin, enforced by
   `firestore.rules`):
   - **derives** `salePrice = mrp − round(mrp × discount%)` in integer paise (no
     floating-point money);
   - **allocates or claims a unique SKU per variant** via the SKU registry
     (`skus/{normalizedSku}`) inside a Firestore transaction, so duplicates fail with
     `SKU_ALREADY_EXISTS`;
   - computes aggregate availability and stock status;
   - writes the public product and the private commercial terms (seller payout/cost —
     kept in a separate admin-only collection so they're never exposed to shoppers,
     protected by rules) and search tokens.
4. The frontend calls `invalidateCatalogue()` so the change appears immediately.

**Money is always stored as integer paise.** The UI converts to rupees for display.
Editing a product later never rewrites historical orders — orders snapshot their prices.

### 4.3 Browsing, search & best sellers

- Storefront reads come from the cached `getCatalogue` call in `catalogueApi.js`,
  normalized by `lib/commerce.js`. Only **active** products with valid variants/images
  are public (enforced by `firestore.rules` on what's readable, and by client-side
  filtering of draft/archived records).
- Search matches product name, category, SKU, colour, and size (see
  `commerce.test.js`), and composes with category/price filters and URL state.
- **Best sellers** are *order-derived*: an admin runs **"Recompute best sellers"** from
  the admin Settings tab's **Maintenance** section (§4.10), which ranks products by
  paid, delivered sales over a configurable window, with per-product
  `auto / force_on / force_off` overrides — it is **not** just "products with a
  discount."

### 4.4 Cart & checkout (the anti-oversell path)

Flow (`Checkout.jsx` → `commerceApi.createCheckout` in `commerceApi.js`):

1. The cart stores **variant ids + quantities** only. It never trusts local prices.
2. At checkout the client reloads every product/variant, **rejects inactive, missing,
   or insufficient-stock lines**, and recomputes all prices and totals from the current
   Firestore data.
3. In a **Firestore transaction** it reserves stock by increasing `reservedQuantity`
   (available drops immediately), creates the order with an **idempotency key**, and
   writes an expiring reservation — so two shoppers can't buy the last unit
   (`OUT_OF_STOCK` for the loser). `firestore.rules` enforces that a checkout write can
   only move stock the way this transaction shape allows; a crafted client write outside
   these invariants is rejected.
4. Checkout is **online QR payment only**. A signed-in customer must upload a valid
   payment screenshot (to Cloudinary, §4.1) before an order can be created.
5. The order remains `verification_pending` with stock reserved until an administrator
   verifies the proof in Admin → Payments. Approval atomically marks it paid, commits
   stock, and confirms fulfilment; rejection cancels it and releases the reservation.
6. Abandoned/unverified reservations are **not** released automatically — an admin runs
   **"Release expired reservations"** from the Settings tab's Maintenance section
   (§4.10) to sweep them.

### 4.5 Orders, fulfilment & cancellation

- Fulfilment status (`pending → confirmed → packed → shipped → delivered`) and payment
  status (`pending / paid / refunded / …`) are **independent**, each with its own
  filter in the admin Orders tab. Illegal transitions are rejected by `firestore.rules`.
- **Cancellation** requires a standardized reason code **and** a customer-facing
  message. `adminApi.cancelOrder` runs the whole thing — mark cancelled, release/reverse
  stock, flag refund work if prepaid, reverse seller ledger entries, append an audit
  event — as one Firestore transaction/batch so it can't partially apply. The customer
  message is stored on the order for the admin to relay manually (there is no automated
  notification channel — see §4.9).
- Customers see their own orders (with SKU, selected colour/size, and any cancellation
  message); `firestore.rules` stop them from reading anyone else's or editing totals.

### 4.6 Payments (manual QR verification)

- The owner uploads the public payment QR (to Cloudinary) in Admin → Settings; the URL
  is stored on `commerceConfig.manualPaymentQrUrl`.
- The customer uploads a payment-proof screenshot (to Cloudinary) during checkout.
- Admin → Payments is the only place that can approve or reject submitted proof
  (`adminApi.verifyManualPayment`); `firestore.rules` restrict the underlying order
  fields (payment status, fulfilment status) to admin writes only, so the browser
  cannot directly set them.
- There is no payment gateway integration — this is purely a manual verify-by-screenshot
  flow.

### 4.7 Product requests

The "Request a Product" form persists to Firestore via `commerceApi.submitProductRequest`
and appears in the admin **Requests** tab with a workflow (new → reviewing → … ).

### 4.8 Sellers, ledger & settlements

Each order item snapshots its seller and payout amount, so the **seller ledger** is
deterministic. Admins see pending/payable/paid balances, create and approve
**settlements**, and record payout references. Cancellations/refunds create reversal
entries rather than editing history.

### 4.9 Notifications

There is no email/SMS/WhatsApp delivery — there's no backend to send anything from. The
admin **Notifications** tab is an in-app activity log of order/payment/settlement events
(`NotificationsTab.jsx`) for the admin to review and follow up with customers/sellers
manually (phone, WhatsApp, email — whatever channel they use outside the app). The
cancellation/status messages an admin writes are stored on the order/request/settlement
record so they're visible here, not sent automatically.

### 4.10 Maintenance (replaces the old scheduled jobs)

The old backend ran two scheduled jobs (release expired reservations every ~15 minutes,
recompute best sellers daily) via cron. With no backend and no scheduler, these are now
two buttons in the admin **Settings** tab's **Maintenance** section, run on demand by an
admin:

- **Release expired reservations** — finds orders still `reserved` past their
  reservation window and cancels/releases them (`adminApi.releaseExpiredReservations`).
- **Recompute best sellers** — re-ranks products by paid, delivered sales over the
  configured window and updates each product's best-seller flag
  (`adminApi.recomputeBestSellers`).

Run these periodically (e.g. whenever you're in the admin dashboard) rather than
relying on an external scheduler.

### 4.11 Bulk admin operations

Admins can preview then run bulk changes (discount, status, category, best-seller,
inventory) as resumable **bulk jobs** with per-item error reporting — implemented as
chunked client-side batched writes, never an unrestricted client-side loop (each write
still goes through the same `firestore.rules` checks).

---

## 5. Data model (Firestore) — quick reference

`products/{id}` (public) · `products/{id}/variants/{id}` · `productCommercials/{id}`
(admin-only seller/cost) · `skus/{normalizedSku}` (uniqueness) · `counters/*` ·
`orders/{id}` (+`/events`) · `inventoryMovements/{id}` · `sellers/{id}` +
`sellerLedger/{id}` + `settlements/{id}` · `productRequests/{id}` · `bulkJobs/{id}` ·
`commerceConfig/default` (secured) + its public checkout projection · `notifications/{id}`
(in-app activity log only — see §4.9).

`firestore.rules` is the authoritative, and only, definition of who can read/write each
of these and under what conditions (SKU uniqueness, stock non-negativity, order state
transitions, admin-only fields, etc.) — there is no separate design document; read the
rules file directly for field-level detail.

---

## 6. Security model in one paragraph

There are no server-side secrets at all — the frontend only ever holds public
`VITE_FIREBASE_*` config and public `VITE_CLOUDINARY_*` config (an unsigned upload
preset is not a secret). Admin authority and every business invariant (money as integer
paise, stock never oversold, prices/totals never client-supplied, order state machine,
SKU uniqueness) are enforced entirely by `firestore.rules`, since there is no trusted
backend to enforce them at request time. Every privileged mutation runs as the signed-in
user and is only as safe as the rule that permits it — review `firestore.rules` whenever
a new admin capability is added. See [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md)
for the full setup and acceptance checklist.
