# Cloudinary Setup Guide

## What Changed?

Your TruckConnect app now uses **Cloudinary** for storing driver documents instead of base64 strings in MongoDB. This is much more efficient and scalable.

## Why This Change?

- **Better Performance**: Images are stored on Cloudinary's CDN, not in your database
- **Smaller Database**: MongoDB only stores URLs instead of large base64 strings
- **Faster Uploads**: Multer handles file uploads efficiently
- **Better Image Management**: Cloudinary provides image optimization and transformations

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. After signing in, go to your Dashboard

### 2. Get Your Credentials

On your Cloudinary Dashboard, you'll see:
- **Cloud Name**
- **API Key**
- **API Secret**

### 3. Update Your .env File

Open `truckconnect/.env` and replace the placeholder values:

```env
PORT=5000
MONGO_URI=mongodb+srv://raghava:raghava@cluster0.50wntf7.mongodb.net/truckconnect
JWT_SECRET=yourSuperSecretKey

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. Update Render Environment Variables

Since your app is deployed on Render, you need to add these environment variables there too:

1. Go to your Render Dashboard
2. Select your **backend service** (truckconnect/backend)
3. Go to "Environment" tab
4. Add these three new environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

5. Save changes - Render will automatically redeploy

### 5. Test Locally (Optional)

If you want to test locally before pushing:

```cmd
cd truckconnect
npm install
npm start
```

Then try registering a new driver with documents.

## What Happens Now?

When a driver registers:
1. Frontend sends files as `FormData` (not base64)
2. Backend receives files via Multer
3. Multer automatically uploads to Cloudinary
4. Cloudinary returns a URL
5. Only the URL is saved in MongoDB

## Files Modified

- `backend/routes/authRoutes.js` - Added Multer middleware for file uploads
- `src/components/DriverAuth.tsx` - Changed from base64 to FormData
- `src/api/index.ts` - Updated API call to send FormData
- `package.json` - Removed browser-image-compression dependency
- `.env` - Added Cloudinary credentials

## Deployment Notes

- Auto-deploy is enabled on Render
- After you push to GitHub, Render will automatically rebuild
- Make sure to add Cloudinary env variables on Render BEFORE pushing
- The frontend and backend will both be redeployed

## Need Help?

If you encounter issues:
1. Check that Cloudinary credentials are correct
2. Verify environment variables are set on Render
3. Check Render deployment logs for errors
4. Make sure file sizes are under 5MB
