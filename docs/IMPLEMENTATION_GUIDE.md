# Commerce Setup and Deployment Guide

## What is implemented

The repository contains a Firebase-backed commerce storefront and admin console —
Firestore security rules, indexes, and React admin/storefront integrations — for:

- multi-colour and colour/size variants;
- automatic and manually supplied transactionally unique SKUs;
- per-variant on-hand, reserved, and available inventory;
- atomic checkout reservations and idempotent order creation;
- MRP minus discount pricing using integer paise;
- private seller payout, unit cost, packaging cost, and margin preview;
- browser-direct Cloudinary product images, payment QR, and payment-proof uploads;
- admin catalogue search, filters, sorting, pagination, selection, and bulk jobs;
- separate fulfilment and payment states;
- mandatory cancellation reason and customer message with stock/ledger reversal;
- online QR payment with mandatory proof upload and manual admin verification;
- product request persistence and admin workflow;
- order-derived best sellers with automatic/force-on/force-off controls, recomputed
  on demand from the admin Maintenance section;
- seller ledger, payable totals, settlements, and payout references;
- customer/admin order views with SKU and selected variant details;
- storefront search combined with existing filters and sorting.

There is no backend: every one of these is a Firebase Web SDK call from the browser,
authorized by `firestore.rules`. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how each
feature behaves end to end.

## Prerequisites

- A Firebase project with Authentication and Firestore enabled (the free Spark plan is
  enough — there is no Firebase Storage and no billing-gated service in use).
- Node.js 20.19+ for local development and builds.
- Firebase CLI authenticated to the intended project (for deploying rules/indexes).
- A free Cloudinary account with an unsigned upload preset.

Never deploy using the default test-mode Firestore rules. The version-controlled
`firestore.rules` in this repository is authoritative.

## 1. Select the Firebase project

Copy `.firebaserc.example` to `.firebaserc` and replace the project ID. Do not commit an
environment-specific project selection if the same repository deploys to multiple
environments.

Create separate Firebase projects for development/staging and production.

## 2. Configure the web application

Copy `.env.example` to `.env` and supply the Firebase web configuration and Cloudinary
values. `VITE_*` identifiers are public client configuration, not secrets.

```text
VITE_FIREBASE_USE_EMULATORS=false
VITE_FIREBASE_APPCHECK_SITE_KEY=<reCAPTCHA v3 site key>
VITE_CLOUDINARY_CLOUD_NAME=<cloud name>
VITE_CLOUDINARY_UPLOAD_PRESET=<unsigned preset name>
```

Enable Firebase App Check for Firestore and Authentication if you want to reduce abuse
from unauthorized clients.

## 3. Install and build

```bash
npm install
npm run validate
```

## 4. Initialize commerce configuration

The storefront intentionally fails closed if `commerceConfig/default` does not exist —
business values (delivery fee, verification window, SKU/order prefixes, reservation
time, best-seller rules) are data, not page constants.

There is no seed script. Sign in as an admin (§5) and fill out the **Settings** tab in
the admin dashboard, then save — `adminApi.updateCommerceConfig` upserts (`setDoc`)
`commerceConfig/default` and its public checkout projection, creating the document the
first time it's saved.

Confirm the delivery fee, online-payment verification expectations, SKU/order prefixes,
reservation time, and best-seller rules before production. Upload the production
payment QR in Admin → Settings before enabling checkout.

## 5. Grant the first admin role

Create the user through Firebase Authentication (have them sign up normally, which
writes their `users/{uid}` profile document), then in the
[Firebase Console](https://console.firebase.google.com) → Firestore Database → Data tab,
open that `users/{uid}` document and set the field `isAdmin` (boolean) to `true`.

The user must sign out and back in to see the admin UI. Admin UI checks are only
presentation controls; `firestore.rules`'s `isAdmin()` function (which checks exactly
this field) enforces the real boundary on every privileged read/write. See
[`ADMIN_SETUP.md`](./ADMIN_SETUP.md).

Do not share a common administrator login. Give each operator their own account.

## 6. Payments and notifications

- **Payments** are manual QR verification only — there is no payment gateway
  integration. The owner uploads a payment QR image (Cloudinary) in Admin → Settings;
  a customer uploads a screenshot at checkout; an admin approves or rejects it in
  Admin → Payments. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.6.
- **Notifications** are not delivered anywhere automatically — there is no backend to
  send email/SMS/WhatsApp from. The admin Notifications tab is an in-app activity log;
  follow up with customers/sellers through whatever channel you use outside the app.
  See [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.9.

## 7. Deploy in this order

1. Firestore rules and indexes to staging: `firebase deploy --only firestore:rules,firestore:indexes`.
2. Grant the first admin claim in staging (§5) and initialize staging configuration (§4).
3. Deploy the React application (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)).
4. Run the acceptance checklist below.
5. Repeat with a fresh backup in production.

## 8. Validation commands

```bash
npm run lint
npm test
npm run build
npm run test:rules
```

The last command requires Java (it runs `firebase-tools emulators:exec` against the
Firestore emulator). Run it in CI or on a workstation with Java even if the frontend
unit suite passes locally.

## 9. Acceptance checklist

- Create a draft product with two colours and two sizes; confirm four distinct variants
  and SKUs.
- Attempt a duplicate manual SKU; confirm an explicit uniqueness error.
- Upload, preview, reorder through form order, remove, save, and reload product images
  (Cloudinary).
- Confirm ₹1,000 MRP with 15% discount displays ₹850 everywhere.
- Confirm seller and cost values are not readable from public product documents (try
  reading `productCommercials/{id}` as a non-admin and confirm it's rejected).
- Set one variant to zero and confirm out-of-stock on list, detail, cart control, and
  checkout.
- Simultaneously attempt the last unit from two sessions; only one reservation may
  succeed.
- Confirm order and verify reserved stock becomes committed once.
- Cancel a reserved and a committed test order; verify stock, event history, seller
  ledger, refund flag, and customer message.
- Verify checkout exposes online QR payment only and rejects any crafted alternate
  payment method.
- Mark delivered plus paid and reconcile seller payable to item snapshot payout.
- Create and pay a seller settlement; confirm all included ledger entries become paid.
- Submit a requested product and process it through admin with a customer update.
- Search by name, category, colour, size, and SKU while filters are active.
- Preview and run bulk discount/status/category/best-seller changes; inspect the bulk
  job and product results.
- Run **Release expired reservations** and **Recompute best sellers** from the admin
  Settings tab's Maintenance section; confirm expected orders/products update.
- Verify an ordinary (non-admin) customer cannot open admin pages or mutate protected
  collections — try a direct Firestore write from the browser console and confirm
  `firestore.rules` rejects it.

## 10. Operational monitoring

Since there is no backend, there are no scheduled jobs or webhooks to monitor — instead,
periodically (e.g. whenever an admin is in the dashboard):

- run the two Maintenance actions (release expired reservations, recompute best
  sellers) rather than relying on an external scheduler;
- check the Notifications tab for order/cancellation/settlement events that need a
  manual follow-up message to the customer or seller;
- watch for negative/inconsistent inventory (rules reject writes that would cause it, so
  any occurrence needs investigation);
- watch for seller settlements approved for an unusual duration without payment;
- reconcile inventory movements to variant balances and settlement entry totals to net
  payout on a periodic manual review.
