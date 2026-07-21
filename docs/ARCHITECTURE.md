# Architecture & How Everything Works in Production

This is the map of the whole system. Read it to understand where each piece runs,
how requests flow, and **what actually happens when you use each feature on the
deployed site** — uploading an image, editing a product, checking out, cancelling
an order, paying a seller, and so on.

---

## 1. The four moving parts

```
                         ┌─────────────────────────────────────────────┐
                         │                Firebase project              │
                         │   Auth   ·   Firestore   ·   Storage         │
                         └───────▲───────────▲──────────────▲───────────┘
                                 │           │              │
        Firebase ID token  +     │           │ Admin SDK    │ (optional image files)
        App Check token          │           │ (privileged) │
                                 │           │              │
   ┌───────────────┐   HTTPS   ┌─┴───────────┴──────────────┴──┐
   │   Browser     │  /api/... │      Commerce API (backend)   │
   │  React SPA    │──────────▶│   Express + firebase-admin    │
   │ (Vercel CDN)  │◀──────────│   Node 20  (functions/)       │
   └───────────────┘   JSON    └───────────────┬───────────────┘
                                                │  outbound HTTPS
                                                ▼
                                   Payment provider · Notification
                                   provider (email/SMS/WhatsApp)
```

1. **Browser (React SPA)** — served as static files from Vercel's CDN. Holds no
   secrets. Signs users in with Firebase Auth directly, then calls the backend for
   everything transactional.
2. **Commerce API (backend)** — a Node/Express service (the `functions/` package).
   Holds the Firebase **Admin** service-account credential and all provider secrets.
   Every price, stock change, order transition, and admin action is validated and
   executed here.
3. **Firebase** — Auth (identities), Firestore (all data), Storage (image files, if
   the Firebase storage driver is used).
4. **External providers** — the payment gateway and the notification channel. Both
   are reached only from the backend through provider-neutral adapters.

> **Deployment model:** these are three separate deploys (frontend, backend, Firebase
> rules) that share one Firebase project id. The frontend and backend can live on the
> same domain (`/api` proxied to the backend) or on separate domains
> (`VITE_BACKEND_API_URL=https://api.example.com/api`, with the backend's
> `BACKEND_ALLOWED_ORIGINS` listing the storefront origin for CORS).

---

## 2. How the browser talks to the backend

Everything privileged goes through one of two shapes, both in `src/services/`:

- **Callable operations** — `POST /api/call/:operation` with a JSON body `{ data }`.
  Implemented by `backendClient.callBackend()` and wrapped in `commerceApi.js`
  (`commerceApi` for public ops, `adminApi` for admin ops).
- **Image upload** — `POST /api/product-images/:productId` as `multipart/form-data`
  (`productImages.uploadProductImage()`), so it can stream the file and report progress.

Every request automatically attaches, when available (`backendClient.backendAuthHeaders`):

- `Authorization: Bearer <Firebase ID token>` — proves who the user is.
- `x-firebase-appcheck: <App Check token>` — proves the request came from your real app.

The backend verifies both on the server side (`authenticateAdmin` / the callable
verification in `index.ts`). **Hiding a route in React is never treated as
authorization** — the backend re-checks the ID token and admin status on every call.

Public catalogue reads are cached for 30 seconds in `catalogueApi.js` so browsing
doesn't hammer the backend; `invalidateCatalogue()` clears it after an admin edit.

---

## 3. Authentication & admin authorization

- **Customers** sign up / sign in with Firebase Auth email+password
  (`AuthContext.jsx`). A profile doc is written to `users/{uid}`.
- **Admins** are identified two ways, checked server-side on every privileged call:
  1. a Firebase **custom claim** `admin: true` (granted via
     `functions/npm run grant:admin -- email@x.com`), or
  2. membership in the backend's `BACKEND_ADMIN_EMAILS` allowlist.
- On login, `AuthContext` reads the ID token claims; if `admin` isn't present it calls
  `verifyAdminAccess` on the backend to resolve admin status. `ProtectedRoute.jsx`
  only *hides* the admin UI — the backend enforces the real boundary.

**In production:** grant each operator their own account. After granting the claim the
user must sign out and back in (or the app calls `refreshPermissions()`) to pick up the
new token.

---

## 4. Feature-by-feature: what happens when deployed

### 4.1 Image upload  ⭐

There are **two frontend upload routes**, chosen by the frontend env var
`VITE_IMAGE_UPLOAD_DRIVER`. Whichever driver is used, the result is the same shape —
image **metadata** `{ id, url, storagePath, alt, sortOrder }` — that the product editor
holds until you **Save** the product (§4.2). Nothing is written to the catalogue on
upload; the URL is only persisted when the product is saved.

**In all cases** the browser first validates type (JPEG/PNG/WebP/GIF) and size (≤10 MB).

#### Driver A — `backend` (recommended for the free Render deployment)

`VITE_IMAGE_UPLOAD_DRIVER=backend` (or unset). The browser sends the file to the
authenticated backend. With `BACKEND_STORAGE_DRIVER=cloudinary`, the backend
validates image magic bytes and size, performs a signed server-side Cloudinary
upload, and returns `{ id, storagePath, url }`. Product and QR assets are public;
payment proofs use Cloudinary's authenticated delivery type and can only be read
through the backend's owner/admin authorization endpoint. Removing a saved
product image also deletes the referenced Cloudinary asset.

Cloudinary API credentials stay server-side. No unsigned preset and no Firebase
Storage bucket are required. See `RENDER_CLOUDINARY_DEPLOYMENT.md`.

#### Driver B — `cloudinary` (legacy direct browser upload)

`VITE_IMAGE_UPLOAD_DRIVER=cloudinary`. The browser uploads the file **directly to
Cloudinary** via an *unsigned upload preset* (`config/cloudinary.js`) and stores the
returned `secure_url` on the product. **No Firebase Storage, no paid Blaze plan, no
backend involvement for the file itself.** Cloudinary's free tier (25 GB storage + 25 GB
monthly bandwidth, no credit card) is enough for a small catalogue.

Setup once, then it's env-only in production:
1. Create a free Cloudinary account → note the **Cloud name**.
2. Settings → Upload → **Add upload preset** → Signing mode **Unsigned** → save → note
   the **preset name**. (Optionally restrict formats, max size, and target folder.)
3. Set on the frontend host (e.g. Vercel): `VITE_IMAGE_UPLOAD_DRIVER=cloudinary`,
   `VITE_CLOUDINARY_CLOUD_NAME=...`, `VITE_CLOUDINARY_UPLOAD_PRESET=...`, then redeploy.

`storagePath` is stored empty for Cloudinary images, so the backend never tries to
delete them from a Firebase bucket. (Trade-off: removing an image from a product does
not auto-delete the file from Cloudinary — fine within the free quota; prune manually if
ever needed.) Since the admin UI is admin-only and product **saves** are still
backend-authorized, catalogue integrity does not depend on the upload endpoint;
restrict the unsigned preset to limit stray uploads to your Cloudinary account.

#### Backend storage alternatives

`VITE_IMAGE_UPLOAD_DRIVER=backend` (or unset). The browser `POST`s each file to the
backend `/api/product-images/:productId` with the admin's ID + App Check tokens. The
backend **re-authenticates the admin**, **re-validates the file by its magic bytes**
(not just the declared MIME type), stores it, and returns the metadata. Where it stores
depends on the backend's `BACKEND_STORAGE_DRIVER`:
- `firebase` → Firebase Storage at `products/{productId}/{imageId}/original.<ext>`.
  **Requires the paid Blaze plan** (Firebase Storage needs billing enabled).
- `local` → disk under `BACKEND_UPLOAD_DIR`, served at `BACKEND_PUBLIC_URL/uploads/...`.
  Free, but **ephemeral** on most container hosts (lost on redeploy) unless a persistent
  volume is attached.
- `cloudinary` → durable Cloudinary assets. Public catalogue/QR images use normal
  delivery; private payment proofs use authenticated delivery and signed backend reads.

> **Bottom line:** for Render Free plus Firebase Spark, use
> `VITE_IMAGE_UPLOAD_DRIVER=backend` and `BACKEND_STORAGE_DRIVER=cloudinary`.

Storage security (only relevant to the `backend`+`firebase` driver): `storage.rules`
allows public read of `products/**` but restricts writes to admins with a valid image
content-type and size.

### 4.2 Creating / editing a product

Flow (`ProductsTab.jsx` → `adminApi.saveProduct` → `saveProduct` in `index.ts`):

1. A product **draft id is generated up front** (`createProductId()`) so images can be
   uploaded and grouped under it before the first save.
2. Admin fills name, description, category, **MRP + discount %**, one or more
   **variants** (each variant = colour [+ optional size], per-variant SKU and on-hand
   quantity, low-stock threshold), seller payout terms, internal costs, and
   merchandising flags (featured / best-seller mode).
3. On Save the backend:
   - verifies admin role + App Check;
   - validates the whole payload with zod (`schemas.ts`);
   - **derives** `salePrice = mrp − round(mrp × discount%)` in integer paise (no
     floating-point money);
   - **allocates or claims a unique SKU per variant** atomically via the SKU registry
     (`skus/{normalizedSku}`) + counter, so duplicates fail with `SKU_ALREADY_EXISTS`;
   - computes aggregate availability and stock status;
   - writes the public product, private commercial terms (seller payout/cost — kept in
     a separate admin-only collection so they're never exposed to shoppers), and search
     tokens.
4. The frontend calls `invalidateCatalogue()` so the change appears immediately.

**Money is always stored as integer paise.** The UI converts to rupees for display.
Editing a product later never rewrites historical orders — orders snapshot their prices.

### 4.3 Browsing, search & best sellers

- Storefront reads come from the cached `getCatalogue` backend call, normalized by
  `lib/commerce.js`. Only **active** products with valid variants/images are public.
- Search matches product name, category, SKU, colour, and size (see
  `commerce.test.js`), and composes with category/price filters and URL state.
- **Best sellers** are *order-derived*: a scheduled job
  (`recompute-best-sellers`) ranks products by paid, non-cancelled sales over a
  configurable window, with per-product `auto / force_on / force_off` overrides — it is
  **not** just "products with a discount."

### 4.4 Cart & checkout (the anti-oversell path)

Flow (`Checkout.jsx` → `commerceApi.createCheckout` → `createCheckout` in `index.ts`):

1. The cart stores **variant ids + quantities** only. It never trusts local prices.
2. At checkout the backend reloads every product/variant, **rejects inactive, missing,
   or insufficient-stock lines**, and recomputes all prices and totals server-side.
3. In a **Firestore transaction** it reserves stock by increasing `reservedQuantity`
   (available drops immediately), creates the order with an **idempotency key**, and
   writes an expiring reservation — so two shoppers can't buy the last unit
   (`OUT_OF_STOCK` for the loser).
4. Checkout is **online QR payment only**. A signed-in customer must upload a valid
   payment screenshot before an order can be created.
5. The order remains `verification_pending` with stock reserved until an administrator
   verifies the proof. Approval atomically marks it paid, commits stock, and confirms
   fulfilment; rejection cancels it and releases the reservation.
6. A scheduled `expire-reservations` job releases stock from abandoned/unverified orders
   exactly once.

### 4.5 Orders, fulfilment & cancellation

- Fulfilment status (`pending → confirmed → packed → shipped → delivered`) and payment
  status (`pending / paid / refunded / …`) are **independent**, each with its own
  filter in the admin Orders tab. Illegal transitions are rejected server-side.
- **Cancellation** requires a standardized reason code **and** a customer-facing
  message. The backend, in one transaction, marks the order cancelled, releases/reverses
  stock, flags refund work if prepaid, reverses seller ledger entries, and appends an
  audit event. The customer message is queued for notification verbatim.
- Customers see their own orders (with SKU, selected colour/size, and any cancellation
  message); Firestore rules stop them from reading anyone else's or editing totals.

### 4.6 Payments (manual QR verification)

- The owner uploads the public payment QR in Admin → Settings. Screenshots use a private
  backend directory and require customer/admin authentication to read.
- Admin → Payments is the only path that can approve or reject submitted proof.
- Approval and rejection are idempotent, validated backend operations; the browser
  cannot directly set payment, fulfilment, or inventory states.

### 4.7 Product requests

The "Request a Product" form persists to Firestore via `submitProductRequest` and
appears in the admin **Requests** tab with a workflow (new → reviewing → … ). It no
longer just logs to the console.

### 4.8 Sellers, ledger & settlements

Each order item snapshots its seller and payout amount, so the **seller ledger** is
deterministic. Admins see pending/payable/paid balances, create and approve
**settlements**, and record payout references. Cancellations/refunds create reversal
entries rather than editing history.

### 4.9 Notifications

A provider-neutral notification worker (`process-notifications` job +
`deliverNotification` trigger) sends order/cancellation/settlement messages through the
configured endpoint. Failed or unconfigured notifications remain visible in Firestore
and are retryable (`retryNotification`).

### 4.10 Bulk admin operations

Admins can preview then run bulk changes (discount, status, category, best-seller,
inventory) as resumable **bulk jobs** with per-item error reporting — never a
client-side loop over unrestricted writes.

---

## 5. Backend HTTP surface

| Method & path | Purpose | Auth |
|---------------|---------|------|
| `GET /api/health` | Liveness/health check | none |
| `POST /api/call/:operation` | All callable commerce/admin ops | ID token (+admin for admin ops) + App Check |
| `POST /api/product-images/:productId` | Admin image upload (multipart) | admin ID token + App Check |
| `POST /api/payment-webhook` | Verified payment events | HMAC signature |
| `POST /api/jobs/expire-reservations` | Release expired reservations | `x-cron-secret` |
| `POST /api/jobs/recompute-best-sellers` | Recompute best-seller ranks | `x-cron-secret` |
| `POST /api/jobs/process-notifications` | Flush pending notifications | `x-cron-secret` |

Schedule the three jobs from your host's scheduler (e.g. cron / Cloud Scheduler)
sending the `x-cron-secret` header — suggested cadences are in
[`BACKEND_DEPLOYMENT.md`](./BACKEND_DEPLOYMENT.md).

---

## 6. Data model (Firestore) — quick reference

`products/{id}` (public) · `products/{id}/variants/{id}` · `productCommercials/{id}`
(admin-only seller/cost) · `skus/{normalizedSku}` (uniqueness) · `counters/*` ·
`orders/{id}` (+`/events`) · `inventoryMovements/{id}` · `sellers/{id}` +
`sellerLedger/{id}` + `settlements/{id}` · `productRequests/{id}` · `bulkJobs/{id}` ·
`commerceConfig/default` (secured) + its public checkout projection · `notifications/{id}`.

Full field-level definitions and the design rationale are in
[`BACKEND_ENHANCEMENT_PLAN.md`](./BACKEND_ENHANCEMENT_PLAN.md) §4.

---

## 7. Security model in one paragraph

Secrets live only on the backend (service account, provider tokens, cron secret) — the
frontend only ever holds public `VITE_FIREBASE_*` config. Admin authority is enforced by
the backend and by Firestore/Storage rules, not by the React router. Money is integer
paise, computed and stored server-side. Stock, prices, and order totals are never
trusted from the browser. App Check keeps unauthorized clients out. Every privileged
mutation is validated (zod), authorized (claim/allowlist), and audited (order/inventory
events). See IMPLEMENTATION_GUIDE §7 and §11 for the full checklist and monitoring.

---

## 8. Note on the Firebase Functions path

`functions/` deploys as a **standalone Express service** (`main = lib/server.js`,
`Dockerfile` provided) — this is the supported/primary backend deployment. The same
handlers in `index.ts` are written with the Firebase Functions v2 signature, so a
Cloud Functions deployment is *possible*, but the current repo has no `functions` block
in `firebase.json` and no functions entry module wired for it. Deploy the backend as the
Node/Express service described in [`BACKEND_DEPLOYMENT.md`](./BACKEND_DEPLOYMENT.md).
