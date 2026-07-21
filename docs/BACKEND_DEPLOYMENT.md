# Standalone backend deployment

The commerce API now runs as a normal Node/Express backend. Firebase remains the existing Authentication, Firestore, and Storage provider, but no Firebase Cloud Functions deployment is required.

## Required access

The backend must have a Firebase Admin SDK service-account credential for the same project configured in the frontend. An application email/password is not a server credential and cannot replace this key.

Required project permissions are:

- Firebase Authentication user/token administration;
- Firestore read/write access;
- Storage object administration.

Store the service account as a host secret named `FIREBASE_SERVICE_ACCOUNT_BASE64`. Generate its value locally without printing the JSON:

```bash
base64 < /absolute/path/service-account.json | tr -d '\n'
```

## Local configuration

```bash
cd functions
cp .env.example .env
```

Set the real bucket, service account, administrator email allowlist, allowed frontend origins, and a random cron secret. Keep `BACKEND_ENFORCE_APP_CHECK=true` when Firebase App Check is configured. For a temporary localhost-only setup it can be `false`; Firebase ID-token verification and the server-side admin allowlist remain mandatory.

Initialize commerce configuration once:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json npm run seed:config
```

Start both applications:

```bash
# Terminal 1
cd functions
npm run server

# Terminal 2, from repository root
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:3001`. The backend health check is `GET /api/health`.

## Production deployment

Deploy the `functions` directory as a Node 20 web service on the selected backend host.

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health path: `/api/health`

Configure every value under “Standalone backend runtime” in `functions/.env.example` as a hosted secret/environment variable. Set `BACKEND_ALLOWED_ORIGINS` to the exact HTTPS storefront/admin origins.

Production runtime requirements:

- `HOST=0.0.0.0` (already set by the Docker image);
- `BACKEND_PUBLIC_URL=https://your-backend.example.com` with no `/api` suffix;
- `BACKEND_ALLOWED_ORIGINS=https://your-storefront.example.com`;
- a persistent writable volume for both `BACKEND_UPLOAD_DIR` and `BACKEND_PRIVATE_UPLOAD_DIR` when `BACKEND_STORAGE_DRIVER=local`;
- a long random `BACKEND_CRON_SECRET` and `BACKEND_ENFORCE_APP_CHECK=true` after the production App Check site is registered.

Local upload URLs are intentionally not portable. After the production backend and persistent volume are online, upload the production QR again from Admin → Settings so Firestore contains the HTTPS backend URL. Existing product files stored on local disk must likewise be copied to the mounted production volume or uploaded again.

Set this frontend environment variable and redeploy the Vite site:

```bash
VITE_BACKEND_API_URL=https://your-backend.example.com/api
```

The backend exposes:

- authenticated callable commerce/admin operations under `POST /api/call/:operation`;
- validated admin image uploads under `POST /api/product-images/:productId`;
- owner-only payment QR uploads under `POST /api/payment-qr`;
- authenticated customer proof uploads under `POST /api/payment-proofs`, with private owner/admin reads at `GET /api/payment-proofs/:proofId`;
- the verified payment adapter at `POST /api/payment-webhook`;
- cron-protected reservation, best-seller, and notification jobs under `POST /api/jobs/*`.

New checkout is online QR payment only. Alternate payment methods are rejected by the backend request schema, not merely hidden in the frontend.

Schedule the jobs with the `x-cron-secret` header:

- `/api/jobs/expire-reservations` every 15 minutes;
- `/api/jobs/recompute-best-sellers` daily at 02:00 Asia/Kolkata;
- `/api/jobs/process-notifications` every 1–5 minutes.

## Manual QR payment workflow

Configure `BACKEND_PRIVATE_UPLOAD_DIR` on persistent storage; it must not be inside the public `BACKEND_UPLOAD_DIR`. Payment screenshots are never exposed by `/uploads` and are served only after Firebase ID-token and ownership/admin verification.

In Admin → Settings, upload the owner QR, add the payee name/instructions, choose the verification window, and enable online QR payments. A customer must upload a valid image proof before checkout can create an online order. The order reserves stock with payment status `verification_pending`. Admin → Payments provides the protected proof preview:

- **Verify & confirm** atomically marks payment paid, commits inventory, and confirms the order.
- **Reject & cancel** requires a customer-facing reason, releases reserved inventory, records the rejection, and queues the cancellation notification.

The QR is intentionally public storefront content; payment proofs are private. Both files require persistent disk (or the Firebase storage driver) in production.

## Existing catalogue migration

Back up the project first. Then initialize configuration and run the existing migration in dry-run mode. Review the report and provide an opening-stock JSON before applying:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json npm run migrate -- --stock /absolute/path/opening-stock.json
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json npm run migrate -- --stock /absolute/path/opening-stock.json --apply
```

## Validation

```bash
npm test
npm run test:server
```

From the repository root:

```bash
npm run validate
```
