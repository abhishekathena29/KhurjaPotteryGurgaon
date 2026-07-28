# Deployment

There are two independent deploys against one Firebase project: Firestore rules/indexes,
and the static frontend build. There is no backend to deploy.

## 1. Firestore rules & indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Deploy this whenever `firestore.rules` or `firestore.indexes.json` changes. Never deploy
using the default test-mode rules — the version-controlled `firestore.rules` in this
repository is authoritative.

## 2. Frontend static host settings

The frontend is a Vite single-page application. On Vercel (or any static host) use:

- production branch: the branch containing the deployment commit;
- build command: `npm run build`;
- output directory: `dist`;
- Node version: 20.19+.

## 3. Environment variables

Copy the Firebase web values and Cloudinary values from the local `.env`, then set on
the host:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=potterscentral-c5666
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_USE_EMULATORS=false
VITE_FIREBASE_APPCHECK_SITE_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

All `VITE_*` values are included in the browser build — that's expected, since none of
them are secrets (the Firebase web config and the Cloudinary unsigned preset are both
meant to be public). Never put a Firebase service-account JSON or a signed Cloudinary
API secret here — this project doesn't use either.

After the first deployment:

1. Add the frontend hostname to Firebase Authentication authorized domains.
2. Register it with the Firebase App Check web provider (if App Check is enabled).
3. Redeploy after changing environment variables.

## Verification

Open `/`, `/products`, `/checkout`, `/admin/login`, and a product-detail route
directly. Each route must load the SPA rather than return 404. Sign in, upload a
test image, and verify it lands in Cloudinary and the returned URL is stored on the
product.
