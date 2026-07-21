# Potters Central — Commerce Backend

The trusted commerce API for Potters Central. A Node 20 + Express (TypeScript) service
using the Firebase Admin SDK. It owns all pricing, inventory, order, payment, seller, and
admin logic. The React frontend calls it for everything transactional.

> Deployment steps, env reference, and scheduled-job cadences live in
> [`../docs/BACKEND_DEPLOYMENT.md`](../docs/BACKEND_DEPLOYMENT.md). System-wide data flow
> is in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Layout

```
functions/
├── src/
│   ├── server.ts        ← Express app; the deployable entry (main = lib/server.js)
│   ├── index.ts         ← all callable operations, payment webhook, and scheduled jobs
│   ├── domain.ts        ← pure business logic (money, SKU, stock, transitions)
│   ├── schemas.ts       ← zod request schemas
│   ├── domain.test.ts   ← unit tests for domain.ts
│   ├── server.test.ts   ← integration tests for the Express surface
│   └── scripts/
│       ├── seed-config.ts       ← write commerceConfig/default
│       ├── grant-admin.ts       ← grant the admin custom claim
│       └── migrate-products.ts  ← migrate the legacy catalogue (dry-run by default)
├── Dockerfile           ← production container (multi-stage build → node:20-slim)
├── tsconfig.json        ← compiles src/ → lib/ (git-ignored, regenerated on build)
└── .env.example         ← copy to .env; server-only secrets
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run build` | `tsc` → compiles `src/` to `lib/` |
| `npm run server` | build, then run with `--env-file=.env` (local dev) |
| `npm start` | run the compiled server (`node lib/server.js`) — used in the container |
| `npm test` | build + domain unit tests |
| `npm run test:server` | build + Express integration tests |
| `npm run seed:config` | write `commerceConfig/default` from the env values |
| `npm run grant:admin -- email@example.com` | grant the `admin` claim to a user |
| `npm run migrate -- --stock /path/opening-stock.json [--apply]` | migrate legacy products |

> `lib/` is build output — it is git-ignored and must be built before `npm start`
> (`npm run server`, the Dockerfile, and the test scripts all build first).

## HTTP endpoints

| Method & path | Purpose | Auth |
|---------------|---------|------|
| `GET /api/health` | health check | none |
| `POST /api/call/:operation` | callable commerce/admin operations | Firebase ID token (+admin) + App Check |
| `POST /api/product-images/:productId` | admin image upload (multipart, magic-byte validated) | admin ID token + App Check |
| `POST /api/payment-webhook` | verified payment events (HMAC raw-body signature) | provider signature |
| `POST /api/jobs/expire-reservations` | release expired stock reservations | `x-cron-secret` |
| `POST /api/jobs/recompute-best-sellers` | recompute best-seller ranking | `x-cron-secret` |
| `POST /api/jobs/process-notifications` | flush pending notifications | `x-cron-secret` |

Available `:operation` values are the keys of `callableHandlers` in `server.ts`
(e.g. `getCatalogue`, `createCheckout`, `saveProduct`, `adjustInventory`,
`transitionOrder`, `cancelOrder`, `createSettlement`, `previewBulkProductUpdate`, …).

## Environment

Copy `.env.example` to `.env` and fill in:

- **Seed config** (non-secret): `COMMERCE_CURRENCY`, `DELIVERY_FEE_PAISE`,
  `PREPAID_ENABLED`, `RESERVATION_TTL_MINUTES`, `SKU_*`, `ORDER_*`, `BEST_SELLER_*`.
- **Runtime secrets** (server-only, never `VITE_`): `FIREBASE_SERVICE_ACCOUNT_BASE64`
  (or `GOOGLE_APPLICATION_CREDENTIALS` for local), `FIREBASE_STORAGE_BUCKET`,
  `BACKEND_ADMIN_EMAILS`, `BACKEND_ALLOWED_ORIGINS`, `BACKEND_ENFORCE_APP_CHECK`,
  `BACKEND_CRON_SECRET`, `BACKEND_STORAGE_DRIVER` (`cloudinary` for free Render),
  `BACKEND_UPLOAD_DIR` / `BACKEND_PUBLIC_URL` (local driver only), and the
  `CLOUDINARY_*`, `PAYMENT_*`, and `NOTIFICATION_*` credentials. Cloudinary API
  credentials are server-only and are never prefixed with `VITE_`.

Generate the base64 service account without printing the JSON:

```bash
base64 < /absolute/path/service-account.json | tr -d '\n'
```

## Run in Docker

```bash
docker build -t potters-central-backend .
docker run --env-file .env -p 3001:3001 potters-central-backend
```
