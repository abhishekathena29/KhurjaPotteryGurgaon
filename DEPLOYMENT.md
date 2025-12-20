# Deployment Guide for Vercel

## Vercel Configuration

The `vercel.json` file is configured to handle React Router's client-side routing. This ensures that all routes (including `/admin/login`) are properly handled.

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
     - `VITE_CLOUDINARY_CLOUD_NAME`
     - `VITE_CLOUDINARY_UPLOAD_PRESET`

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
- Ensure Node.js version is compatible (Vercel uses Node 18 by default)
- Check build logs in Vercel dashboard

## File Structure
```
/
├── vercel.json          # Vercel routing configuration
├── vite.config.js      # Vite configuration
├── package.json         # Dependencies
└── src/                # Source code
```


