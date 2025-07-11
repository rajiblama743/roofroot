# Google Cloud Storage Setup Guide

This guide will help you set up Google Cloud Storage for your RoofRoot app instead of Firebase Storage, since your region doesn't support free tier storage buckets.

## Prerequisites

1. Google Cloud Project (same as your Firebase project)
2. Node.js installed on your development machine
3. Google Cloud CLI (optional but recommended)

## Step 1: Create Google Cloud Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`roofroot-2bdfb`)
3. Navigate to **Cloud Storage** → **Buckets**
4. Click **Create Bucket**
5. Choose a unique name (e.g., `roofroot-storage`)
6. Choose a location that supports your needs
7. Set access control to **Uniform**
8. Click **Create**

## Step 2: Create Service Account

1. In Google Cloud Console, go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `roofroot-storage-service`
4. Description: `Service account for RoofRoot image uploads`
5. Click **Create and Continue**
6. Add these roles:
   - **Storage Object Admin** (for full access to storage objects)
   - **Storage Object Viewer** (for reading objects)
7. Click **Continue** and **Done**
8. Click on the created service account
9. Go to **Keys** tab
10. Click **Add Key** → **Create New Key**
11. Choose **JSON** format
12. Download the key file and save it as `service-account-key.json` in the `backend/` folder

## Step 3: Set Up Backend Server

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure your `service-account-key.json` file is in the `backend/` folder

4. Update the bucket name in `server.js` if needed:
   ```javascript
   const BUCKET_NAME = 'roofroot-storage'; // Your actual bucket name
   ```

5. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

## Step 4: Update React Native App

1. Update the API base URL in `src/firebase/googleCloudStorage.ts`:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000'; // For development
   // Change to your deployed backend URL for production
   ```

2. For iOS simulator, use `http://localhost:3000`
3. For Android emulator, use `http://10.0.2.2:3000`
4. For physical devices, use your computer's IP address

## Step 5: Test the Setup

1. Start your backend server
2. Run your React Native app
3. Try uploading an image through the ListingForm
4. Check the console logs for any errors

## Step 6: Deploy Backend (Optional)

For production, you can deploy the backend to:

### Option A: Google Cloud Run (Recommended)
1. Install Google Cloud CLI
2. Enable Cloud Run API
3. Deploy:
   ```bash
   gcloud run deploy roofroot-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Option B: Heroku
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git

### Option C: Vercel/Netlify
1. Create a serverless function
2. Deploy to Vercel or Netlify

## Step 7: Update Production URLs

Once deployed, update the API base URL in your React Native app:

```javascript
// In src/firebase/googleCloudStorage.ts
const API_BASE_URL = 'https://your-deployed-backend.com';
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your backend has CORS enabled
2. **Authentication Errors**: Check your service account key file
3. **Bucket Not Found**: Verify the bucket name and permissions
4. **Network Errors**: Check your API base URL and network connectivity

### Debug Steps:

1. Check backend logs: `npm run dev`
2. Check React Native logs: `npx react-native log-android` or `npx react-native log-ios`
3. Test backend health: `curl http://localhost:3000/health`

## Security Considerations

1. **Service Account Key**: Keep your service account key secure and never commit it to version control
2. **Environment Variables**: Use environment variables for sensitive data in production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Consider adding rate limiting to your backend
5. **File Size Limits**: The backend is configured for 10MB max file size

## Cost Optimization

1. **Storage Class**: Use appropriate storage classes (Standard, Nearline, Coldline)
2. **Lifecycle Policies**: Set up lifecycle policies to move old files to cheaper storage
3. **CDN**: Consider using Cloud CDN for faster image delivery
4. **Compression**: Implement image compression before upload

## Next Steps

1. Implement image compression
2. Add image resizing
3. Set up Cloud CDN
4. Implement file cleanup for deleted listings
5. Add upload progress indicators
6. Implement retry logic for failed uploads 