import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { checkFirebaseInitialization } from './init';

export interface AuthError {
  code: string;
  message: string;
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'agent';
  createdAt: any;
}

export const authService = {
  /**
   * Check if Firebase is properly initialized
   */
  isFirebaseInitialized(): boolean {
    return checkFirebaseInitialization();
  },

  /**
   * Check if an email exists in Firebase Authentication
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      if (!this.isFirebaseInitialized()) {
        console.error('Firebase not initialized');
        return false;
      }
      
      const methods = await auth().fetchSignInMethodsForEmail(email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  },

  /**
   * Delete a user from both Firestore and Firebase Authentication
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // First, delete from Firestore
      await firestore().collection('users').doc(userId).delete();
      
      // Then, delete from Firebase Authentication
      const currentUser = auth().currentUser;
      if (currentUser && currentUser.uid === userId) {
        await currentUser.delete();
      } else {
        // If trying to delete a different user, we need admin privileges
        // For now, we'll just delete from Firestore
        console.warn('Cannot delete Firebase Auth user without being signed in as that user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error as AuthError;
    }
  },

  /**
   * Check if an email exists in Firebase Authentication but not in Firestore
   * This helps identify orphaned Auth users
   */
  async isOrphanedAuthUser(email: string): Promise<boolean> {
    try {
      const methods = await auth().fetchSignInMethodsForEmail(email);
      if (methods.length === 0) {
        return false; // No auth user exists
      }

      // Note: We can't easily check Firestore without the UID
      // This function is mainly for informational purposes
      console.warn('Found Firebase Auth user for email:', email);
      return true;
    } catch (error) {
      console.error('Error checking for orphaned user:', error);
      return false;
    }
  },

  /**
   * Sign up a new user with name, email, and password
   * Also saves user info to Firestore with role "customer"
   * Handles cases where user exists in Auth but not in Firestore
   */
  async signUpWithDetails(name: string, email: string, password: string): Promise<any> {
    let authUser = null;
    let firestoreCreated = false;
    
    try {
      console.log('🚀 Starting signup process for:', email);
      
      // Check if email exists in Firebase Auth
      const emailExists = await this.checkEmailExists(email);
      console.log('📧 Email exists check result:', emailExists);
      
      if (emailExists) {
        // User exists in Firebase Auth - this is a conflict
        console.log('❌ Email already exists in Firebase Auth');
        throw {
          code: 'auth/email-already-in-use',
          message: 'An account with this email already exists. Please try signing in instead.'
        } as AuthError;
      }

      // Email doesn't exist in Auth, proceed with normal signup
      console.log('✅ Creating Firebase Auth user...');
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      authUser = userCredential.user;
      console.log('✅ Firebase Auth user created successfully with UID:', authUser.uid);
      
      // Verify the user is authenticated before creating Firestore document
      if (!authUser) {
        throw new Error('Failed to create Firebase Auth user');
      }
      
      // Check if Firestore document already exists (shouldn't happen for new users, but safety check)
      console.log('🔍 Checking if Firestore document already exists...');
      const existingDoc = await firestore().collection('users').doc(authUser.uid).get();
      
      if (existingDoc.exists()) {
        console.log('⚠️ Firestore document already exists, using existing data');
        const existingData = existingDoc.data();
        const userData: UserData = {
          uid: authUser.uid,
          name: existingData?.name || name,
          email: existingData?.email || email,
          role: existingData?.role || 'customer',
          createdAt: existingData?.createdAt || new Date()
        };
        console.log('✅ Using existing Firestore document:', userData);
        return { userCredential, userData };
      }
      
      // Create Firestore document with all required fields
      console.log('📝 Creating new Firestore document at /users/' + authUser.uid);
      const userDocumentData = {
        uid: authUser.uid,
        name: name,
        email: email,
        role: 'customer',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await firestore().collection('users').doc(authUser.uid).set(userDocumentData);
      firestoreCreated = true;
      console.log('✅ Firestore document created successfully with data:', userDocumentData);
      
      // Create user data object for return
      console.log('📋 Creating user data object for app...');
      const userData: UserData = {
        uid: authUser.uid,
        name: name,
        email: email,
        role: 'customer',
        createdAt: new Date()
      };
      console.log('✅ User data object created:', userData);
      
      console.log('🎉 Signup process completed successfully!');
      return { userCredential, userData };
      
    } catch (error: any) {
      console.error('❌ Error in signUpWithDetails:', error);
      
      // If we created an Auth user but Firestore creation failed, clean up the Auth user
      if (authUser && !firestoreCreated) {
        try {
          console.log('🧹 Cleaning up orphaned Auth user...');
          await authUser.delete();
          console.log('✅ Successfully cleaned up orphaned Auth user');
        } catch (deleteError) {
          console.error('❌ Failed to clean up orphaned Auth user:', deleteError);
        }
      }
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw {
          code: 'auth/email-already-in-use',
          message: 'An account with this email already exists. Please try signing in instead.'
        } as AuthError;
      } else if (error.code === 'auth/weak-password') {
        throw {
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters long.'
        } as AuthError;
      } else if (error.code === 'auth/invalid-email') {
        throw {
          code: 'auth/invalid-email',
          message: 'Please enter a valid email address.'
        } as AuthError;
      } else if (error.code === 'permission-denied') {
        throw {
          code: 'firestore/permission-denied',
          message: 'Permission denied. Please check your Firestore security rules.'
        } as AuthError;
      } else {
        throw {
          code: 'auth/signup-failed',
          message: 'Sign up failed. Please try again.'
        } as AuthError;
      }
    }
  },

  /**
   * Create a Firestore user document if it doesn't exist
   * This handles cases where Auth user exists but Firestore document is missing
   */
  async createMissingUserDocument(userId: string, email: string, name?: string): Promise<UserData> {
    try {
      console.log('🔍 Checking for existing Firestore document for UID:', userId);
      
      if (!this.isFirebaseInitialized()) {
        console.error('Firebase not initialized');
        throw {
          code: 'firebase/not-initialized',
          message: 'Firebase is not properly initialized. Please restart the app.'
        } as AuthError;
      }
      
      // First, verify the user is properly authenticated
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        console.log('⚠️ User not properly authenticated, skipping document creation');
        throw {
          code: 'auth/user-not-authenticated',
          message: 'User is not properly authenticated. Please sign in again.'
        } as AuthError;
      }
      
      const userDoc = await firestore().collection('users').doc(userId).get();
      
      if (userDoc.exists()) {
        // Document exists, return the data
        console.log('✅ Found existing Firestore document');
        return {
          uid: userId,
          ...userDoc.data()
        } as UserData;
      }
      
      // Document doesn't exist, create it with default values
      console.log('📝 Creating missing Firestore document for UID:', userId);
      const userData = {
        name: name || email.split('@')[0], // Use email prefix as fallback name
        email: email,
        role: 'customer' as const,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await firestore().collection('users').doc(userId).set(userData);
      console.log('✅ Successfully created missing Firestore document:', userData);
      
      return {
        uid: userId,
        ...userData
      } as UserData;
    } catch (error: any) {
      console.error('❌ Error creating missing user document:', error);
      
      // Provide specific error handling
      if (error.code === 'permission-denied') {
        throw {
          code: 'firestore/permission-denied',
          message: 'Permission denied. Please check your Firestore security rules.'
        } as AuthError;
      } else if (error.code === 'auth/user-not-authenticated') {
        throw error; // Re-throw authentication errors
      } else if (error.code === 'firebase/not-initialized') {
        throw error; // Re-throw initialization errors
      } else {
        throw {
          code: 'firestore/document-creation-failed',
          message: 'Failed to create user document. Please try again.'
        } as AuthError;
      }
    }
  },

  /**
   * Sign in an existing user with email and password
   * Also handles cases where Firestore document is missing
   */
  async signIn(email: string, password: string): Promise<any> {
    try {
      console.log('🚀 Starting signin process for:', email);
      
      // Validate inputs
      if (!email || !password) {
        throw {
          code: 'auth/invalid-input',
          message: 'Email and password are required.'
        } as AuthError;
      }

      // Trim whitespace from email
      const trimmedEmail = email.trim();
      
      console.log('📧 Attempting Firebase Auth signin with email:', trimmedEmail);
      const userCredential = await auth().signInWithEmailAndPassword(trimmedEmail, password);
      const { user } = userCredential;
      console.log('✅ Firebase Auth signin successful, UID:', user.uid);
      
      // Try to get user data from Firestore
      console.log('🔍 Fetching user data from Firestore...');
      let userData = await this.getUserData(user.uid);
      
      // If Firestore document doesn't exist, create it
      if (!userData) {
        console.log('📝 Firestore document missing for user, creating...');
        userData = await this.createMissingUserDocument(user.uid, trimmedEmail);
        console.log('✅ Created missing Firestore document:', userData);
      } else {
        console.log('✅ Found existing Firestore document:', userData);
      }
      
      return { userCredential, userData };
    } catch (error: any) {
      console.error('❌ Error in signIn:', error);
      
      // Provide specific error handling for common auth issues
      if (error.code === 'auth/invalid-credential') {
        throw {
          code: 'auth/invalid-credential',
          message: 'Invalid email or password. Please check your credentials and try again.'
        } as AuthError;
      } else if (error.code === 'auth/user-not-found') {
        throw {
          code: 'auth/user-not-found',
          message: 'No account found with this email address. Please check your email or create a new account.'
        } as AuthError;
      } else if (error.code === 'auth/wrong-password') {
        throw {
          code: 'auth/wrong-password',
          message: 'Incorrect password. Please try again.'
        } as AuthError;
      } else if (error.code === 'auth/invalid-email') {
        throw {
          code: 'auth/invalid-email',
          message: 'Please enter a valid email address.'
        } as AuthError;
      } else if (error.code === 'auth/user-disabled') {
        throw {
          code: 'auth/user-disabled',
          message: 'This account has been disabled. Please contact support.'
        } as AuthError;
      } else if (error.code === 'auth/too-many-requests') {
        throw {
          code: 'auth/too-many-requests',
          message: 'Too many failed attempts. Please try again later.'
        } as AuthError;
      } else if (error.code === 'auth/network-request-failed') {
        throw {
          code: 'auth/network-request-failed',
          message: 'Network error. Please check your internet connection.'
        } as AuthError;
      } else {
        // For any other errors, provide a generic message
        throw {
          code: error.code || 'auth/unknown-error',
          message: error.message || 'An error occurred during sign in. Please try again.'
        } as AuthError;
      }
    }
  },

  /**
   * Get user data from Firestore including role
   * If document doesn't exist, creates it with default values
   */
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      console.log('Getting user data for UID:', userId);
      
      if (!this.isFirebaseInitialized()) {
        console.error('Firebase not initialized');
        return null;
      }
      
      // First, verify the user is properly authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user authenticated, returning null');
        return null;
      }
      
      if (currentUser.uid !== userId) {
        console.log('UID mismatch, returning null');
        return null;
      }
      
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists()) {
        console.log('Found existing Firestore document');
        return {
          uid: userId,
          ...userDoc.data()
        } as UserData;
      }
      
      console.log('Firestore document does not exist, creating missing document...');
      // Document doesn't exist, try to create it
      return await this.createMissingUserDocument(userId, currentUser.email || '');
      
    } catch (error: any) {
      console.error('Error getting user data:', error);
      
      // If it's a permission error, try to create the document
      if (error.code === 'permission-denied') {
        console.log('Permission denied, attempting to create user document...');
        const currentUser = auth().currentUser;
        if (currentUser && currentUser.uid === userId) {
          try {
            return await this.createMissingUserDocument(userId, currentUser.email || '');
          } catch (createError) {
            console.error('Failed to create missing user document:', createError);
          }
        }
      }
      
      // For authentication errors, just return null instead of throwing
      if (error.code === 'auth/user-not-authenticated') {
        console.log('User not authenticated, returning null');
        return null;
      }
      
      return null;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }
      // If no current user, just return silently - this is not an error
      // This can happen when a user deletes their account and then signOut is called
    } catch (error) {
      // Only throw if it's not a "no-current-user" error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/no-current-user') {
        // This is expected when user is already deleted, don't throw
        return;
      }
      throw error as AuthError;
    }
  },

  /**
   * Get the current user
   */
  getCurrentUser(): any {
    return auth().currentUser;
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  },

  /**
   * Update the current user's password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw {
          code: 'auth/no-user',
          message: 'No user is currently signed in'
        } as AuthError;
      }

      await currentUser.updatePassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error as AuthError;
    }
  },

  /**
   * Delete the current user's account
   */
  async deleteUserAccount(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw {
          code: 'auth/no-user',
          message: 'No user is currently signed in'
        } as AuthError;
      }

      // First delete from Firestore
      await firestore().collection('users').doc(currentUser.uid).delete();
      
      // Then delete the Firebase Auth user
      await currentUser.delete();
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error as AuthError;
    }
  },

  /**
   * Debug method to test Firebase connectivity and auth setup
   */
  async testFirebaseConnection(): Promise<{
    firebaseInitialized: boolean;
    authAvailable: boolean;
    firestoreAvailable: boolean;
    currentUser: any;
  }> {
    try {
      const firebaseInitialized = this.isFirebaseInitialized();
      const authAvailable = !!auth();
      const firestoreAvailable = !!firestore();
      const currentUser = auth().currentUser;
      
      console.log('🔍 Firebase Connection Test Results:');
      console.log('  - Firebase Initialized:', firebaseInitialized);
      console.log('  - Auth Available:', authAvailable);
      console.log('  - Firestore Available:', firestoreAvailable);
      console.log('  - Current User:', currentUser ? currentUser.uid : 'None');
      
      return {
        firebaseInitialized,
        authAvailable,
        firestoreAvailable,
        currentUser
      };
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return {
        firebaseInitialized: false,
        authAvailable: false,
        firestoreAvailable: false,
        currentUser: null
      };
    }
  },

  /**
   * Update the current user's role
   */
  async updateUserRole(newRole: 'customer' | 'admin' | 'agent'): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw {
          code: 'auth/no-user',
          message: 'No user is currently signed in'
        } as AuthError;
      }

      await firestore().collection('users').doc(currentUser.uid).update({ role: newRole });
      console.log('✅ User role updated to:', newRole);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error as AuthError;
    }
  },

  /**
   * Test admin account access and provide debugging information
   */
  async testAdminAccount(email: string): Promise<{
    authExists: boolean;
    firestoreExists: boolean;
    role: string | null;
    error: string | null;
  }> {
    try {
      console.log('🔍 Testing admin account access for:', email);
      
      // Check if user exists in Firebase Auth
      const authExists = await this.checkEmailExists(email);
      console.log('  - Auth exists:', authExists);
      
      if (!authExists) {
        return {
          authExists: false,
          firestoreExists: false,
          role: null,
          error: 'User not found in Firebase Authentication'
        };
      }
      
      // Try to get user data from Firestore
      let firestoreExists = false;
      let role = null;
      
      try {
        // First, we need to sign in to access Firestore data
        // This is a test sign-in that we'll clean up
        const testCredential = await auth().signInWithEmailAndPassword(email, 'test-password');
        console.log('  - Test sign-in successful, UID:', testCredential.user.uid);
        
        // Get user data from Firestore
        const userDoc = await firestore().collection('users').doc(testCredential.user.uid).get();
        if (userDoc.exists()) {
          firestoreExists = true;
          const userData = userDoc.data();
          role = userData?.role || null;
          console.log('  - Firestore exists:', firestoreExists);
          console.log('  - Role:', role);
        }
        
        // Sign out the test user
        await auth().signOut();
        console.log('  - Test user signed out');
        
      } catch (signInError: any) {
        console.log('  - Test sign-in failed:', signInError.code);
        return {
          authExists: true,
          firestoreExists: false,
          role: null,
          error: `Authentication failed: ${signInError.code}`
        };
      }
      
      return {
        authExists,
        firestoreExists,
        role,
        error: null
      };
      
    } catch (error: any) {
      console.error('❌ Error testing admin account:', error);
      return {
        authExists: false,
        firestoreExists: false,
        role: null,
        error: error.message || 'Unknown error'
      };
    }
  }
}; 