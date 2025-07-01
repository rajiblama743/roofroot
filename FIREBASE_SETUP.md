# Firebase Setup Guide for RoofRoot

This project is configured with Firebase integration for authentication and Firestore database.

## Firebase Configuration

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Authentication and Firestore Database

### 2. Configure Authentication

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" authentication
3. Configure any additional sign-in methods as needed

### 3. Configure Firestore Database

1. In Firebase Console, go to Firestore Database
2. Create a database in test mode (for development)
3. Set up security rules as needed

### 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</>) 
4. Register your app and copy the configuration object

### 5. Update Firebase Config

Replace the placeholder values in `src/firebase/firebaseConfig.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Project Structure

```
src/
├── firebase/
│   ├── firebaseConfig.ts    # Firebase initialization and config
│   ├── authService.ts       # Authentication functions
│   └── index.ts            # Exports for easy importing
```

## Available Services

### Authentication Service (`authService`)

- `signUp(email, password)` - Create new user account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get current authenticated user
- `onAuthStateChanged(callback)` - Listen to auth state changes

### Firestore Database (`db`)

The Firestore instance is exported and ready to use for database operations.

## Usage Example

```typescript
import { authService, db } from './src/firebase';

// Sign up a new user
try {
  const userCredential = await authService.signUp('user@example.com', 'password123');
  console.log('User created:', userCredential.user);
} catch (error) {
  console.error('Sign up error:', error);
}

// Sign in existing user
try {
  const userCredential = await authService.signIn('user@example.com', 'password123');
  console.log('User signed in:', userCredential.user);
} catch (error) {
  console.error('Sign in error:', error);
}
```

## Security Rules

Remember to configure appropriate Firestore security rules in the Firebase Console based on your application's requirements.

## Next Steps

1. Update the Firebase configuration with your actual project details
2. Test authentication functions
3. Implement your application's UI and business logic
4. Configure Firestore security rules
5. Deploy your application 