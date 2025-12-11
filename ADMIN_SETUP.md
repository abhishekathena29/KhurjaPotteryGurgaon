# Admin Platform Setup Guide

## Overview
The admin platform allows you to manage categories and products for the Khurja@Gng e-commerce website.

## Admin Login Credentials
- **Email:** `admin@123`
- **Password:** `admin123`

## Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create Database"
   - Start in "Test Mode" (you can change security rules later)
   - Choose a location for your database

3. **Get Firebase Configuration**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`)
   - Copy the Firebase configuration values

4. **Set Up Environment Variables**
   - Copy `.env.example` to `.env` in the root directory:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and replace the placeholder values with your Firebase config:
     ```env
     VITE_FIREBASE_API_KEY=your-actual-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=your-actual-app-id
     ```
   - **Important:** Restart your development server after updating `.env` file

5. **Set Firestore Security Rules** (REQUIRED)
   
   **Important:** You must configure Firestore security rules to allow reads and writes, otherwise you'll get permission errors.
   
   - Go to Firestore Database → Rules tab in Firebase Console
   - Replace the default rules with one of the following:

   **Option 1: Development Mode (Allow all reads/writes)**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   ⚠️ **Warning:** This allows anyone to read/write. Use only for development!

   **Option 2: Production Mode (Allow reads, restrict writes)**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /categories/{document=**} {
         allow read: if true;
         allow write: if request.auth != null; // Requires authentication
       }
       match /products/{document=**} {
         allow read: if true;
         allow write: if request.auth != null; // Requires authentication
       }
     }
   }
   ```
   **Note:** Option 2 requires Firebase Authentication setup. For now, use Option 1 for development.

   - Click "Publish" to save the rules
   - Rules take effect immediately

## Cloudinary Setup

1. **Create a Cloudinary Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for a free account

2. **Get Your Cloud Name**
   - After signing up, you'll see your Cloud Name on the dashboard
   - It's usually something like `dxxxxx`

3. **Create an Upload Preset**
   - Go to Settings → Upload
   - Scroll down to "Upload presets"
   - Click "Add upload preset"
   - Set:
     - **Preset name:** `khurja-products` (or any name you prefer)
     - **Signing mode:** Unsigned (for easier client-side uploads)
     - **Folder:** `khurja-products` (optional, for organization)
   - Click "Save"

4. **Update Cloudinary Config in .env**
   - Add your Cloudinary configuration to the `.env` file:
     ```env
     VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
     VITE_CLOUDINARY_UPLOAD_PRESET=khurja-products
     ```
   - Replace `your-cloud-name` with your actual Cloudinary cloud name
   - The preset name `khurja-products` is already set (or use your custom preset name)
   - **Important:** Restart your development server after updating `.env` file

## Admin Features

### Categories Tab
- **Add Category:** Click "Add Category" button, enter category name, click "Add"
- **Edit Category:** Click the edit icon on any category card
- **Delete Category:** Click the delete icon on any category card

### Products Tab
- **Add Product:** 
  1. Click "Add Product" button
  2. Fill in the form:
     - Owner Name
     - Owner Phone No
     - Owner Email ID
     - Product Category (dropdown from created categories)
     - Product Price
     - Product Image (upload to Cloudinary)
  3. Click "Add Product"

- **Edit Product:** Click "Edit" button on any product card
- **Delete Product:** Click the delete icon on any product card

## Accessing Admin Panel

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/admin/login`

3. Login with the credentials above

4. You'll be redirected to the dashboard at `/admin/dashboard`

## Data Structure

### Categories Collection (Firestore)
```javascript
{
  name: "Mugs",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Products Collection (Firestore)
```javascript
{
  ownerName: "John Doe",
  ownerPhone: "+91 98765 43210",
  ownerEmail: "john@example.com",
  category: "Mugs",
  price: 299,
  imageUrl: "https://res.cloudinary.com/...",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Firebase Connection Issues
- Verify your Firebase config values are correct
- Check that Firestore is enabled in your Firebase project
- Ensure your Firestore security rules allow reads/writes

### Cloudinary Upload Issues
- Verify your Cloud Name is correct
- Check that your Upload Preset is set to "Unsigned"
- Ensure the preset name matches exactly (case-sensitive)
- Check browser console for detailed error messages

### Admin Login Not Working
- Verify you're using the exact credentials: `admin@123` / `admin123`
- Check browser localStorage is enabled
- Clear browser cache and try again

## Security Notes

- The current admin authentication is hardcoded and stored in localStorage
- For production, consider implementing proper authentication (Firebase Auth)
- Add proper Firestore security rules to restrict access
- Consider adding role-based access control

