# Firestore Security Rules Setup

## Issue
You're getting a `[firestore/permission-denied]` error when trying to sign up or sign in. This is because your Firestore security rules are too restrictive.

## Solution

### Step 1: Update Firestore Security Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all listings
    match /listings/{listingId} {
      allow read: if request.auth != null;
      // Only allow admin users to write listings
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read all images
    match /images/{imageId} {
      allow read: if request.auth != null;
      // Only allow admin users to write images
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish** to save the rules

### Step 2: Alternative - Test Mode (Temporary)

If you want to test quickly without setting up proper rules, you can temporarily set Firestore to test mode:

1. In Firebase Console, go to **Firestore Database**
2. Click on the **Rules** tab
3. Replace the rules with this temporary test mode:

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

⚠️ **Warning**: Test mode allows anyone to read/write your database. Only use this for development and testing.

### Step 3: Verify the Fix

After updating the rules:

1. Restart your React Native app
2. Try signing up with a new email
3. Check the console logs for any remaining errors

## What These Rules Do

### User Documents (`/users/{userId}`)
- Users can only read/write their own user document
- Prevents users from accessing other users' data
- Allows the app to create and update user profiles

### Listings (`/listings/{listingId}`)
- All authenticated users can read listings
- Only admin users can create/edit/delete listings
- Prevents unauthorized modifications

### Images (`/images/{imageId}`)
- All authenticated users can read images
- Only admin users can upload/delete images
- Maintains security for media files

## Troubleshooting

### If you still get permission errors:

1. **Check Authentication**: Make sure the user is properly authenticated
2. **Verify UID Match**: Ensure the user's UID matches the document ID
3. **Clear App Data**: Try clearing the app's storage/cache
4. **Check Console Logs**: Look for detailed error messages in the console

### Common Issues:

1. **User not authenticated**: Make sure `request.auth != null`
2. **UID mismatch**: The user's UID must match the document ID
3. **Role-based access**: Admin functions require the user to have `role: 'admin'`

## Security Best Practices

1. **Never use test mode in production**
2. **Always validate user permissions**
3. **Use specific rules for each collection**
4. **Regularly review and update rules**
5. **Monitor Firebase Console for security alerts**

## Next Steps

After fixing the security rules:

1. Test signup with a new email
2. Test signin with existing users
3. Verify the navbar shows the correct user state
4. Test admin functionality if applicable 