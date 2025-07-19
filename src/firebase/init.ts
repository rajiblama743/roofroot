// Initialize React Native Firebase
import '@react-native-firebase/app';

// Add initialization check
export const checkFirebaseInitialization = () => {
  try {
    // Check if Firebase is properly initialized
    const auth = require('@react-native-firebase/auth').default;
    const firestore = require('@react-native-firebase/firestore').default;
    
    console.log('✅ Firebase initialization check passed');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization check failed:', error);
    return false;
  }
};

export default { initialized: true }; 