import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration object
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAtKPfu8cUTxLGY3LLAcq0M2ob5KRAMd7w",
    authDomain: "roofroot-2bdfb.firebaseapp.com",
    projectId: "roofroot-2bdfb",
    storageBucket: "roofroot-2bdfb.firebasestorage.app",
    messagingSenderId: "730348664478",
    appId: "1:730348664478:web:fa71aed73e4ccf66b62d8f",
    measurementId: "G-3LTQHQGHN7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 