# Firebase Document Creation Error Troubleshooting

## Error: `[firestore/document-creation-failed] failed to create user document`

This error occurs when the app tries to create a user document in Firestore but fails. Here are the most common causes and solutions:

## 🔍 Quick Diagnosis

### 1. Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `roofroot-2bdfb`
3. Go to **Firestore Database** → **Rules**
4. Verify the rules are properly deployed

### 2. Check Authentication Status
1. In Firebase Console, go to **Authentication** → **Users**
2. Verify that user accounts exist
3. Check if users are properly authenticated

### 3. Check Firestore Database
1. In Firebase Console, go to **Firestore Database** → **Data**
2. Look for the `users` collection
3. Check if user documents exist

## 🛠️ Common Solutions

### Solution 1: Update Firestore Security Rules

If you're getting permission errors, update your Firestore rules:

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

### Solution 2: Test Mode (Development Only)

For quick testing, temporarily enable test mode:

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

⚠️ **Warning**: Only use test mode for development!

### Solution 3: Clear App Data

1. Delete the app from your device/simulator
2. Reinstall the app
3. Try signing up again

### Solution 4: Check Network Connection

1. Ensure your device has internet access
2. Check if Firebase services are accessible
3. Try on a different network if possible

## 🔧 Debugging Steps

### Step 1: Enable Debug Logging

The app now includes better error logging. Check the console for:
- `🔍 Checking for existing Firestore document`
- `📝 Creating missing Firestore document`
- `❌ Error creating missing user document`

### Step 2: Test Firebase Connection

Use the Firebase Connection Test in the app:
1. Navigate to the test screen
2. Run "Test Connection"
3. Run "Test Document Creation"
4. Check the results

### Step 3: Verify Firebase Configuration

Check `src/firebase/init.ts`:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyD73Flhq_RLs6H4kdww1cGoFSgrYpDOvM0",
  authDomain: "roofroot-2bdfb.firebaseapp.com",
  projectId: "roofroot-2bdfb",
  storageBucket: "roofroot-2bdfb.firebasestorage.app",
  messagingSenderId: "730348664478",
  appId: "1:730348664478:ios:2f6efb2f2b39d8f5b62d8f"
};
```

## 🚨 Error Codes and Meanings

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `firestore/permission-denied` | Security rules blocking access | Update Firestore rules |
| `auth/user-not-authenticated` | User not properly signed in | Sign in again |
| `firebase/not-initialized` | Firebase not ready | Restart app |
| `firestore/document-creation-failed` | General creation failure | Check network/retry |

## 📱 App-Specific Fixes

### Recent Improvements Made:

1. **Better Error Handling**: Added specific error codes and messages
2. **Initialization Checks**: Verify Firebase is ready before operations
3. **Timing Fixes**: Added delays to prevent race conditions
4. **Error Boundary**: Catches and handles errors gracefully
5. **Auth State Improvements**: Better handling of authentication state

### If the Error Persists:

1. **Check Console Logs**: Look for detailed error messages
2. **Test with New User**: Try creating a completely new account
3. **Verify Firebase Project**: Ensure you're using the correct Firebase project
4. **Check Dependencies**: Ensure all Firebase packages are properly installed

## 🔄 Recovery Steps

If the error continues:

1. **Restart the App**: Close and reopen the app
2. **Clear Cache**: Clear app cache and data
3. **Reinstall**: Delete and reinstall the app
4. **Check Firebase Console**: Verify project settings
5. **Contact Support**: If the issue persists, provide console logs

## 📞 Getting Help

If you're still experiencing issues:

1. Check the console logs for detailed error messages
2. Verify your Firebase project configuration
3. Test with the Firebase Connection Test in the app
4. Ensure you have proper internet connectivity
5. Try on a different device or simulator

The app now includes better error handling and should provide more specific error messages to help diagnose the issue. 