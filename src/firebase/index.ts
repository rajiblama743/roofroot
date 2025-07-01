// Export Firebase configuration and services
export { default as firebaseApp } from './firebaseConfig';
export { auth, db } from './firebaseConfig';

// Export authentication service
export { authService } from './authService';
export type { AuthError, UserData } from './authService';

// Export real estate service
export { realEstateService } from './realEstateService';
export type { RealEstateListing } from './realEstateService'; 