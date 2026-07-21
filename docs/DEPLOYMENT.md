# Frontend deployment

Deploy the backend first by following
[RENDER_CLOUDINARY_DEPLOYMENT.md](./RENDER_CLOUDINARY_DEPLOYMENT.md). The frontend
build needs the final Render HTTPS URL.

## Static host settings

The frontend is a Vite single-page application. On Cloudflare Pages use:

- production branch: the branch containing the deployment commit;
- build command: `npm run build`;
- output directory: `dist`;
- `NODE_VERSION=20.19.0`.

Vercel can use the same build settings for non-commercial testing. Its Hobby
plan terms must be reviewed before using it for a commercial storefront.

## Environment variables

Copy the Firebase web values from the local `.env`, then set:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=potterscentral-c5666
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_USE_EMULATORS=false
VITE_FIREBASE_APPCHECK_SITE_KEY=...
VITE_BACKEND_API_URL=https://potters-central-backend.onrender.com/api
VITE_IMAGE_UPLOAD_DRIVER=backend
```

All `VITE_*` values are included in the browser build. Never put the Firebase
service-account JSON, Cloudinary API secret, or backend cron secret here.

After the first deployment:

1. Add the frontend hostname to Firebase Authentication authorized domains.
2. Register it with the Firebase App Check web provider.
3. Set Render's `BACKEND_ALLOWED_ORIGINS` to the exact HTTPS frontend origin.
4. Redeploy both services after changing environment variables.

## Verification

Open `/`, `/products`, `/checkout`, `/admin/login`, and a product-detail route
directly. Each route must load the SPA rather than return 404. Sign in, upload a
test image, and verify the browser calls the configured Render `/api` origin.
