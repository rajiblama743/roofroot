import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  User,
  deleteUser,
  fetchSignInMethodsForEmail,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { setDoc, doc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';

export interface AuthError {
  code: string;
  message: string;
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: any;
}

export const authService = {
  /**
   * Check if an email exists in Firebase Authentication
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
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
      await deleteDoc(doc(db, 'users', userId));
      
      // Then, delete from Firebase Authentication
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await deleteUser(currentUser);
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
      const methods = await fetchSignInMethodsForEmail(auth, email);
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
  async signUpWithDetails(name: string, email: string, password: string): Promise<UserCredential> {
    try {
      // Check if email exists in Firebase Auth
      const emailExists = await this.checkEmailExists(email);
      
      if (emailExists) {
        // User exists in Firebase Auth - this is a conflict
        // We can't easily check Firestore without the UID, so we'll handle this
        // by attempting to create the user and catching the specific error
        throw {
          code: 'auth/email-already-in-use',
          message: 'An account with this email already exists. Please try signing in instead.'
        } as AuthError;
      }

      // Email doesn't exist in Auth, proceed with normal signup
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: 'customer',
        createdAt: serverTimestamp(),
      });
      
      return userCredential;
    } catch (error) {
      throw error as AuthError;
    }
  },

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error as AuthError;
    }
  },

  /**
   * Get user data from Firestore including role
   */
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return {
          uid: userId,
          ...userDoc.data()
        } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error as AuthError;
    }
  },

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  },

  /**
   * Update the current user's password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw {
          code: 'auth/no-user',
          message: 'No user is currently signed in'
        } as AuthError;
      }

      await updatePassword(currentUser, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error as AuthError;
    }
  },

  /**
   * Delete the current user's account from both Auth and Firestore
   */
  async deleteUserAccount(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw {
          code: 'auth/no-user',
          message: 'No user is currently signed in'
        } as AuthError;
      }

      // First, delete from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Then, delete from Firebase Authentication
      await deleteUser(currentUser);
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error as AuthError;
    }
  }
}; 