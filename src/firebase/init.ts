// Initialize React Native Firebase
import '@react-native-firebase/app';

// Also initialize web Firebase SDK for compatibility
import { initializeApp } from 'firebase/app';

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyD73Flhq_RLs6H4kdww1cGoFSgrYpDOvM0",
  authDomain: "roofroot-2bdfb.firebaseapp.com",
  projectId: "roofroot-2bdfb",
  storageBucket: "roofroot-2bdfb.firebasestorage.app",
  messagingSenderId: "730348664478",
  appId: "1:730348664478:ios:2f6efb2f2b39d8f5b62d8f"
};

// Initialize Firebase web SDK
const app = initializeApp(firebaseConfig);

export default app; 