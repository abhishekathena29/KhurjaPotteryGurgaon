# Commerce Backend Implementation and Deployment Guide

## What is implemented

The repository now contains a trusted Firebase commerce backend, security rules, storage rules, indexes, migrations, tests, and React admin/storefront integrations for:

- multi-colour and colour/size variants;
- automatic and manually supplied transactionally unique SKUs;
- per-variant on-hand, reserved, and available inventory;
- atomic checkout reservations and idempotent order creation;
- MRP minus discount pricing using integer paise;
- private seller payout, unit cost, packaging cost, and margin preview;
- secure resumable Firebase Storage product images;
- admin catalogue search, filters, sorting, pagination, selection, and bulk jobs;
- separate fulfilment and payment states;
- mandatory cancellation reason and customer message with stock/ledger reversal;
- online QR payment with mandatory private proof upload and manual admin verification;
- product request persistence and admin workflow;
- order-derived best sellers with automatic/force-on/force-off controls;
- seller ledger, payable totals, settlements, payout references, and notifications;
- customer/admin order views with SKU and selected variant details;
- storefront search combined with existing filters and sorting.

## Prerequisites

- A Firebase Spark project with Authentication and Firestore enabled.
- Node.js 20 for Functions deployment.
- Firebase CLI authenticated to the intended project.
- Java only when running Firebase emulators locally.
- A payment integration endpoint if prepaid checkout will be enabled.
- A notification integration endpoint if automated email/SMS/WhatsApp delivery is required.

Never deploy using the legacy test-mode Firestore rules. The version-controlled rules in this repository are authoritative.

## 1. Select the Firebase project

Copy `.firebaserc.example` to `.firebaserc` and replace the project ID. Do not commit an environment-specific project selection if the same repository deploys to multiple environments.

Create separate Firebase projects for development/staging and production.

## 2. Configure the web application

Copy `.env.example` to `.env` and supply the Firebase web configuration. `VITE_*` Firebase identifiers are public client configuration, not administrator credentials.

Set:

```text
VITE_FIREBASE_FUNCTIONS_REGION=asia-south1
VITE_FIREBASE_USE_EMULATORS=false
VITE_FIREBASE_APPCHECK_SITE_KEY=<reCAPTCHA v3 site key>
```

Enable Firebase App Check for Firestore, Functions, Authentication where supported, and Storage after verifying staging traffic.

## 3. Install and build

```bash
npm install
npm --prefix functions install
npm run validate
npm run functions:build
```

## 4. Initialize commerce configuration

The storefront and backend intentionally fail closed if `commerceConfig/default` does not exist. Business values are data, not page constants.

Copy `functions/.env.example` to `functions/.env`, review every value, and run:

```bash
npm --prefix functions run seed:config
```

The seed writes the secured configuration and its public checkout projection. Thereafter, an admin can update those values in Admin → Settings.

Confirm the delivery fee, online-payment verification window, SKU/order prefixes, reservation time, and best-seller rules before production. Upload the production payment QR in Admin → Settings before enabling checkout.

## 5. Grant the first admin role

Create the user through Firebase Authentication, then use Application Default Credentials with:

```bash
npm --prefix functions run grant:admin -- administrator@example.com
```

The user must sign out and back in to refresh their token. Admin UI checks are only presentation controls; Functions, Firestore rules, and Storage rules enforce the claim independently.

Do not share a common administrator password. Give each operator their own account.

## 6. Configure provider adapters

### Prepaid payments

The backend uses a provider-neutral server adapter. Configure:

```bash
firebase functions:secrets:set PAYMENT_PROVIDER_ENDPOINT
firebase functions:secrets:set PAYMENT_PROVIDER_TOKEN
firebase functions:secrets:set PAYMENT_WEBHOOK_SECRET
```

The payment session endpoint receives:

```json
{
  "orderId": "firestore-order-id",
  "orderNumber": "ORD-0000001",
  "amountPaise": 155000,
  "currency": "INR",
  "customer": { "email": "customer@example.com", "phone": "...", "pincode": "..." }
}
```

It must return:

```json
{ "sessionId": "provider-session-id", "checkoutUrl": "https://provider.example/checkout/..." }
```

The provider or adapter sends verified events to the deployed `paymentWebhook` endpoint with the raw-body HMAC-SHA256 in `x-payment-signature`:

```json
{
  "eventId": "unique-provider-event-id",
  "orderId": "firestore-order-id",
  "providerPaymentId": "payment-id",
  "status": "paid",
  "amountPaise": 155000
}
```

Do not enable prepaid in Admin → Settings until the sandbox flow, redirect, webhook signature, amount verification, failure flow, and retry idempotency pass.

### Notifications

Configure:

```bash
firebase functions:secrets:set NOTIFICATION_WEBHOOK_ENDPOINT
firebase functions:secrets:set NOTIFICATION_WEBHOOK_TOKEN
```

The endpoint receives notification type, recipient, order/request/settlement reference, and template payload. It can be implemented by the selected email, SMS, WhatsApp, or workflow provider. Failed/configuration-required notifications remain visible in Firestore and can be retried through the backend.

Customer cancellation text is supplied by the admin and stored with the order; provider templates should include it verbatim as a data field rather than generating a different reason.

## 7. Migrate the existing catalogue

Back up production Firestore first. Create a JSON stocktake keyed by legacy product ID or legacy SKU:

```json
{
  "firestore-product-id": 12,
  "LEGACY-SKU": 7
}
```

Dry run:

```bash
npm --prefix functions run migrate -- --stock /absolute/path/opening-stock.json
```

Apply only after reviewing the report:

```bash
npm --prefix functions run migrate -- --stock /absolute/path/opening-stock.json --apply
```

The migration is idempotent (`schemaVersion: 2` products are skipped), creates one default variant, claims or allocates a unique SKU, retains external image URLs, matches category/seller records, preserves current sale economics, and writes opening inventory movements. A product absent from the stocktake is migrated as draft with zero stock rather than guessing availability.

All migrated private commercial records have `migrationReviewRequired: true`. Review seller payout and internal cost terms before settlements begin.

## 8. Deploy in this order

1. Firestore rules and indexes to staging.
2. Initialize staging configuration and first admin claim.
3. Run migration dry-run and apply in staging.
4. Deploy Firestore rules and indexes.
5. Deploy the React application.
6. Run the acceptance checklist below.
7. Repeat with a fresh backup in production.

Typical Firebase deployment command:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Deploy the standalone backend from `render.yaml`, then deploy the Vite application
after adding its environment variables. No Firebase Cloud Functions are used.

## 9. Validation commands

```bash
npm run lint
npm test
npm run build
npm --prefix functions test
npm run test:rules
```

The last command requires Java. Run emulator tests in CI or on a workstation with Java even if the frontend/unit suites pass locally.

## 10. Acceptance checklist

- Create a draft product with two colours and two sizes; confirm four distinct variants and SKUs.
- Attempt a duplicate manual SKU; confirm an explicit uniqueness error.
- Upload, preview, reorder through form order, remove, save, and reload product images.
- Confirm ₹1,000 MRP with 15% discount displays ₹850 everywhere.
- Confirm seller and cost values are not readable from public product documents.
- Set one variant to zero and confirm out-of-stock on list, detail, cart control, and checkout.
- Simultaneously attempt the last unit from two sessions; only one reservation may succeed.
- Confirm order and verify reserved stock becomes committed once.
- Cancel a reserved and a committed test order; verify stock, event history, seller ledger, refund flag, and customer message.
- Verify checkout exposes online QR payment only and rejects any crafted alternate payment method.
- Verify online payment webhook retries do not duplicate earnings or stock changes.
- Mark delivered plus paid and reconcile seller payable to item snapshot payout.
- Create and pay a seller settlement; confirm all included ledger entries become paid.
- Submit a requested product and process it through admin with a customer update.
- Search by name, category, colour, size, and SKU while filters are active.
- Preview and run bulk discount/status/category/best-seller changes; inspect the bulk job and product results.
- Verify an ordinary customer cannot open admin pages or mutate protected collections.

## 11. Operational monitoring

Alert on:

- failed Functions and payment webhooks;
- `notifications.status` of `failed` or `configuration_required`;
- expired reservations that could not be released;
- bulk jobs not reaching a completed state;
- payment amounts that do not equal order totals;
- negative/inconsistent inventory (backend rejects it, so any occurrence needs investigation);
- seller settlements approved for an unusual duration without payment.

Reconcile inventory movements to variant balances and settlement entry totals to net payout on a scheduled operational report.
