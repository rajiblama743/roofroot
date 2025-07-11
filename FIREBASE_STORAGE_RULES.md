# Firebase Storage Rules Setup

## Current Issue
Firebase Storage is not accessible due to restrictive security rules.

## Solution: Update Firebase Storage Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `roofroot-2bdfb`
3. Go to **Storage** section in the left sidebar
4. Click on **Rules** tab

### Step 2: Update Storage Rules
Replace the current rules with these development rules:

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

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for confirmation that rules are updated

### Step 4: Test the Fix
1. Try uploading an image in your app
2. Check console logs for successful upload messages
3. Verify images appear on other devices

## Alternative: Authenticated Access (Recommended for Production)

If you want to restrict access to authenticated users only:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Alternative: Specific Path Rules (Most Secure)

For production, use specific path rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listing-images/{imageId} {
      allow read: if true;  // Anyone can view listing images
      allow write: if request.auth != null;  // Only authenticated users can upload
    }
  }
}
```

## Testing Steps

1. **Update rules** in Firebase Console
2. **Wait 1-2 minutes** for rules to propagate
3. **Try uploading** an image in your app
4. **Check console logs** for:
   ```
   Firebase Storage test successful
   Test file uploaded successfully
   Download URL obtained: https://...
   ```

## Common Error Codes

- `storage/unauthorized` → Rules too restrictive
- `storage/object-not-found` → Bucket not found
- `storage/quota-exceeded` → Storage limit reached
- `storage/unauthenticated` → User not signed in (if using auth rules)

## Next Steps

After updating the rules:
1. Test image upload in your app
2. Verify images appear on other devices
3. Check Firebase Console Storage section to see uploaded files
4. Consider implementing proper authentication for production

## Security Note

⚠️ **Development Rules** (`allow read, write: if true`) allow anyone to read/write to your storage. Only use these for development/testing.

For production, implement proper authentication and more restrictive rules. 