# Free Render + Cloudinary deployment

This is the supported disk-free deployment for the standalone backend. It does
not deploy Firebase Cloud Functions or use Firebase Storage.

## Runtime layout

- Firebase Spark: Authentication, Firestore, rules, indexes, and App Check.
- Render Free web service: the Node 20/Express API from `functions/`.
- Cloudinary Free: durable image storage.
  - Product images and the payment QR use public `upload` assets.
  - Payment screenshots use `authenticated` assets.
  - Screenshot bytes are returned only by `GET /api/payment-proofs/:proofId`
    after Firebase ID-token, App Check, and owner/admin authorization.
- Cloudflare Pages: the Vite storefront/admin static build.
- cron-job.org: authenticated HTTP scheduling for the three backend jobs.

Render Free has cold starts, may restart at any time, and has no production SLA.
Cloudinary removes the data-loss risk from Render's ephemeral filesystem, but it
does not remove those availability limitations.

## 1. Create Cloudinary credentials

Create a Cloudinary account and copy these server credentials from the API Keys
page of the Cloudinary console:

- cloud name;
- API key;
- API secret.

No unsigned upload preset is needed. Do not put the API key or secret in a
`VITE_*` variable. All production uploads go through the authenticated backend.

## 2. Prepare the Firebase Admin credential

In Firebase Console, open Project settings -> Service accounts -> Generate new
private key. Keep the JSON outside this repository. On macOS, copy its base64
value without printing it:

```bash
base64 < /absolute/path/firebase-service-account.json | tr -d '\n' | pbcopy
```

Paste that clipboard value into Render's `FIREBASE_SERVICE_ACCOUNT_BASE64`
secret. An application email/password cannot replace this credential.

## 3. Create the Render service

The repository root contains `render.yaml`. In Render:

1. Select **New -> Blueprint**.
2. Connect the GitHub repository and select the branch containing this file.
3. Render detects the `potters-central-backend` Docker web service.
4. Enter every value marked `sync: false`:

| Variable | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 service-account JSON from step 2 |
| `BACKEND_ADMIN_EMAILS` | Comma-separated production administrator emails |
| `BACKEND_ALLOWED_ORIGINS` | Exact frontend HTTPS origins, comma-separated, with no trailing slash |
| `BACKEND_CRON_SECRET` | Output of `openssl rand -hex 32` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

The Blueprint sets `BACKEND_STORAGE_DRIVER=cloudinary`, uses the Dockerfile in
`functions/`, and checks `/api/health`. It intentionally defines no disk.

After deployment, record the URL, for example:

```text
https://potters-central-backend.onrender.com
```

Verify it:

```bash
curl -fsS https://potters-central-backend.onrender.com/api/health
```

## 4. Deploy the frontend

Cloudflare Pages is the free commercial-static-hosting route. Connect the same
GitHub repository and use:

- production branch: the branch containing the deployment commit;
- framework: React/Vite;
- build command: `npm run build`;
- output directory: `dist`;
- Node version environment variable: `NODE_VERSION=20.19.0`.

Add the Firebase `VITE_*` values already used locally, plus:

```dotenv
VITE_FIREBASE_USE_EMULATORS=false
VITE_BACKEND_API_URL=https://potters-central-backend.onrender.com/api
VITE_IMAGE_UPLOAD_DRIVER=backend
VITE_FIREBASE_APPCHECK_SITE_KEY=your-production-recaptcha-v3-site-key
```

Do not add Cloudinary API credentials or the Firebase service account to the
frontend host. The legacy unsigned browser uploader is not used in this setup.

When the final Pages URL is known, set Render's `BACKEND_ALLOWED_ORIGINS` to the
exact origin and redeploy the service.

## 5. Authorize the frontend

In Firebase Console:

1. Authentication -> Settings -> Authorized domains: add the Pages hostname.
2. App Check: register the hostname for the web app's reCAPTCHA v3 provider.
3. Put only the reCAPTCHA **site key** in
   `VITE_FIREBASE_APPCHECK_SITE_KEY`; the secret stays in its provider console.
4. Redeploy Pages.

Keep Render's `BACKEND_ENFORCE_APP_CHECK=true`. For diagnosis only, it can be
set to `false` briefly; restore it before accepting customer uploads.

## 6. Schedule jobs without Cloud Functions

Create three POST jobs at https://cron-job.org. Add the same custom header to
each job:

```text
x-cron-secret: the value of BACKEND_CRON_SECRET
```

| Schedule | URL |
| --- | --- |
| Every 15 minutes | `https://potters-central-backend.onrender.com/api/jobs/expire-reservations` |
| Every 5 minutes | `https://potters-central-backend.onrender.com/api/jobs/process-notifications` |
| Daily at 02:00 Asia/Kolkata | `https://potters-central-backend.onrender.com/api/jobs/recompute-best-sellers` |

The first request after a cold start can be slow. Use cron-job.org's test and
failure-notification features, and confirm subsequent executions return HTTP
200 with `{ "ok": true }`.

## 7. Production data and acceptance test

Firestore data remains in `potterscentral-c5666`; deploying Render does not copy
or replace it. Local files are different:

- Upload the payment QR again in Admin -> Settings. The new Firestore URL will
  point to Cloudinary instead of localhost.
- Re-upload product images whose stored URL contains `localhost` or
  `127.0.0.1`.
- Historical proofs created with `storageDriver=local` remain tied to their old
  local files; retain the local backend until any legally required proofs have
  been reviewed/exported.

Run this acceptance sequence:

1. Sign in as admin and verify backend access.
2. Upload a product image, save the product, and reload it.
3. Upload the payment QR and confirm it appears at checkout.
4. Place an order as a customer and upload a payment screenshot.
5. Confirm the proof is not directly public and is viewable in Admin -> Payments.
6. Verify and confirm the order; confirm stock decreases.
7. Create another order, reject it with a customer reason, and confirm stock is released.
8. Trigger each scheduled job once and check for HTTP 200.

## 8. Deploy updates

Run validation locally, then push the production branch:

```bash
npm run validate
npm run backend:test
git push origin vaibhav
```

Render and Cloudflare rebuild from the new commit. Secret values remain in their
host dashboards and must never be committed.
