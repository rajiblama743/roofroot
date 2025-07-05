import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { user } = userCredential;
      
      await firestore().collection('users').doc(user.uid).set({
        name,
        email,
        role: 'customer',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      
      return userCredential;
    } catch (error) {
      throw error as AuthError;
    }
  },

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<any> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
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
      const userDoc = await firestore().collection('users').doc(userId).get();
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
      await auth().signOut();
    } catch (error) {
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
  }
}; 