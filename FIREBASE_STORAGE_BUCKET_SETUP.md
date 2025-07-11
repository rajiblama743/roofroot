# Firebase Storage Bucket Setup

## Current Issue
Your Firebase project is in a region that doesn't support no-cost Storage buckets. You need to create a Cloud Storage bucket manually.

## Solution: Create Cloud Storage Bucket

### Step 1: Go to Google Cloud Console
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `roofroot-2bdfb`
3. Go to **Cloud Storage** → **Buckets**

### Step 2: Create a New Bucket
1. Click **"CREATE BUCKET"**
2. **Name your bucket**: `roofroot-2bdfb.appspot.com` (use your project ID)
3. **Location type**: Choose based on your needs:
   - **Multi-region**: Better performance, higher cost
   - **Region**: Lower cost, choose closest to your users
4. **Storage class**: Standard
5. **Access control**: Uniform
6. **Protection tools**: None (for development)

### Step 3: Configure Firebase Storage
1. Go back to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `roofroot-2bdfb`
3. Go to **Storage** section
4. Click **"Get started"**
5. Choose the bucket you just created
6. Set up security rules (use the rules below)

### Step 4: Update Storage Rules
In Firebase Console → Storage → Rules, use these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 5: Test the Setup
1. Try uploading an image in your app
2. Check console logs for successful upload
3. Verify images appear on other devices

## Alternative: Use Different Region

If you want to use the free tier, you can:

### Option 1: Create New Firebase Project
1. Create a new Firebase project in a supported region:
   - `us-central1` (Iowa)
   - `europe-west1` (Belgium)
   - `asia-southeast1` (Singapore)

2. Update your Firebase config in `src/firebase/init.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-new-api-key",
     authDomain: "your-new-project.firebaseapp.com",
     projectId: "your-new-project-id",
     storageBucket: "your-new-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-new-app-id"
   };
   ```

### Option 2: Use Existing Project with Manual Bucket
Keep your current project but create the bucket manually (recommended for now).

## Cost Considerations

- **Free tier**: 5GB storage, 1GB/day download
- **Paid tier**: $0.026/GB/month for storage
- **Network**: $0.12/GB for downloads

For a real estate app, you'll likely stay within free limits unless you have many high-resolution images.

## Testing Steps

After creating the bucket:

1. **Update Firebase config** if needed
2. **Set storage rules** in Firebase Console
3. **Test upload** in your app
4. **Check console logs**:
   ```
   Network connectivity test successful
   Firebase Storage test successful
   Test file uploaded successfully
   ```

## Troubleshooting

### "Bucket not found" error
- Ensure bucket name matches your project ID
- Check that bucket is in the same project as Firebase

### "Permission denied" error
- Update storage rules to allow read/write
- Ensure bucket has proper permissions

### "Quota exceeded" error
- Check your Cloud Storage usage
- Consider upgrading plan if needed

## Next Steps

1. Create the Cloud Storage bucket
2. Configure Firebase Storage
3. Update storage rules
4. Test image uploads
5. Verify cross-device functionality

## Support

If you need help with the setup:
1. Check Google Cloud Console for bucket creation
2. Verify Firebase project configuration
3. Test with the enhanced error handling in the app 