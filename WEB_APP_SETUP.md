# Web App Setup with Firebase Hosting (Optional)

## When to Add a Web App

You might want a web version of RoofRoot if you need:
- Web dashboard for admins
- Web interface for users
- Cross-platform accessibility
- Web-based management tools

## Creating a Web Version

### 1. Create React Web App

```bash
npx create-react-app roofroot-web --template typescript
cd roofroot-web
npm install firebase
```

### 2. Share Firebase Config

Copy your Firebase configuration from the React Native app:

```typescript
// src/firebase/firebaseConfig.ts (same as mobile app)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Deploy with Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## Project Structure

```
RoofRoot/
├── mobile/                 # React Native app
│   ├── src/firebase/
│   └── ...
├── web/                   # React web app
│   ├── src/firebase/
│   └── ...
└── shared/               # Shared utilities
    └── firebaseConfig.ts
```

## Benefits of Web + Mobile

✅ **Same backend** - Shared Firebase services  
✅ **Consistent data** - Same database and auth  
✅ **Cross-platform** - Web + mobile access  
✅ **Admin tools** - Web dashboard for management  
✅ **User choice** - Users can use web or mobile  

## Firebase Hosting Features

- **Global CDN** - Fast loading worldwide
- **SSL certificates** - Secure HTTPS
- **Custom domains** - Your own domain
- **Version control** - Easy rollbacks
- **Preview channels** - Testing before production

## Summary

- **Mobile app** = React Native (Android/iOS)
- **Web app** = React + Firebase Hosting
- **Shared backend** = Same Firebase project
- **Deployment** = Play Store/App Store + Firebase Hosting 