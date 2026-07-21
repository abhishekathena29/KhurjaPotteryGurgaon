# Deployment Guide for Vercel

## Vercel Configuration

The `vercel.json` file is configured to handle React Router's client-side routing. This ensures that all routes (including `/admin/login`) are properly handled.

Deploy the standalone backend first. Its public HTTPS URL is required by the frontend, and its persistent upload volume must be mounted before the owner uploads the production payment QR. The backend does not use Firebase Cloud Functions.

## Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add vercel.json for routing"
   git push
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **Environment Variables**
   - In Vercel Dashboard → Project Settings → Environment Variables
   - Add all your `.env` variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_BACKEND_API_URL` (the deployed backend origin, e.g. `https://api.example.com/api`)
     - `VITE_IMAGE_UPLOAD_DRIVER` (set to `cloudinary` to host images free, without a paid Firebase Storage plan)
     - `VITE_CLOUDINARY_CLOUD_NAME`
     - `VITE_CLOUDINARY_UPLOAD_PRESET`

### Free image hosting (no paid Firebase Storage / Blaze plan)

Firebase **Storage** requires the paid Blaze plan, but Firestore and Auth run on the free
Spark plan. To upload product images for free, host them on Cloudinary instead:

1. Create a free [Cloudinary](https://cloudinary.com) account and note your **Cloud name**.
2. Settings → Upload → **Add upload preset** → Signing mode **Unsigned** → save; note the
   **preset name**. Optionally restrict allowed formats, max file size, and a folder.
3. In Vercel set `VITE_IMAGE_UPLOAD_DRIVER=cloudinary`, `VITE_CLOUDINARY_CLOUD_NAME`, and
   `VITE_CLOUDINARY_UPLOAD_PRESET`, then redeploy.

With this driver the browser uploads images straight to Cloudinary and stores the returned
URL on the product — the backend and Firebase Storage are not involved in image storage.
See [ARCHITECTURE.md](./ARCHITECTURE.md) §4.1 for details.

4. **Redeploy**
   - After adding environment variables, trigger a new deployment
   - Or push a new commit to trigger automatic deployment

## Troubleshooting

### 404 Errors on Routes
- Ensure `vercel.json` is in the root directory
- The file should contain the rewrite rule to redirect all routes to `index.html`
- After deploying, wait a few minutes for changes to propagate

### Environment Variables Not Working
- Make sure all variables are prefixed with `VITE_`
- Redeploy after adding environment variables
- Check Vercel build logs for any errors

### Build Errors
- Check that all dependencies are in `package.json`
- Set the Vercel project Node.js version to Node 20.19 or newer, matching `package.json`
- Check build logs in Vercel dashboard

## File Structure
```
/
├── vercel.json          # Vercel routing configuration
├── vite.config.js      # Vite configuration
├── package.json         # Dependencies
└── src/                # Source code
```
