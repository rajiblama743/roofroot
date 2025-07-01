# Firebase Configuration Helper

## Quick Setup Steps

### 1. Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon ⚙️ → Project Settings
4. Scroll to "Your apps" section
5. Click "Add app" → Web (</>)
6. Register app with name "RoofRoot"
7. Copy the config object

### 2. Update Your Config File

Replace the placeholder values in `src/firebase/firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyC-your-actual-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 3. Enable Services

**Authentication:**
- Go to Authentication → Sign-in method
- Enable "Email/Password"

**Firestore:**
- Go to Firestore Database
- Create database in test mode

### 4. Test Connection

1. Update the config file
2. Save the file
3. The app will automatically test the connection
4. Check the status on screen and console logs

## Common Issues

**"Firebase connection failed"**
- Check if config values are correct
- Ensure Authentication and Firestore are enabled
- Verify internet connection

**"Permission denied"**
- Check Firestore security rules
- Ensure database is in test mode for development

## Security Rules (Development)

For development, use these Firestore rules:

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

⚠️ **Note**: These rules allow all access. Use proper security rules for production. 