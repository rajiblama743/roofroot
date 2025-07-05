import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Export the services
export const db = firestore();
export const authInstance = auth();

// For compatibility, export as 'auth'
export { authInstance as auth };

export default { auth: authInstance, firestore: db }; 