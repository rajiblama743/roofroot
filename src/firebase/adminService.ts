import { db } from './firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { authService } from './authService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface AdminUserData {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: any;
}

export const adminService = {
  /**
   * Get all users from Firestore
   */
  async getAllUsers(): Promise<AdminUserData[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: AdminUserData[] = [];
      
      usersSnapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        } as AdminUserData);
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  /**
   * Get user by email from Firestore
   */
  async getUserByEmail(email: string): Promise<AdminUserData | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          uid: doc.id,
          ...doc.data()
        } as AdminUserData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  /**
   * Delete user completely from both Firestore and Firebase Auth
   * Note: Firebase Auth deletion requires the user to be signed in as the user being deleted
   * or requires Firebase Admin SDK on the backend. This function will delete from Firestore
   * and provide clear feedback about Auth deletion status.
   */
  async deleteUserCompletely(email: string): Promise<{
    success: boolean;
    firestoreDeleted: boolean;
    authDeleted: boolean;
    message: string;
  }> {
    try {
      // First, find the user in Firestore
      const userData = await this.getUserByEmail(email);
      
      if (!userData) {
        return {
          success: false,
          firestoreDeleted: false,
          authDeleted: false,
          message: 'User not found in Firestore'
        };
      }

      // Check if user exists in Firebase Auth
      const authUserExists = await authService.checkEmailExists(email);
      
      let firestoreDeleted = false;
      let authDeleted = false;
      let message = '';

      // Delete from Firestore
      try {
        await deleteDoc(doc(db, 'users', userData.uid));
        firestoreDeleted = true;
        message += 'User deleted from Firestore. ';
      } catch (error) {
        console.error('Error deleting from Firestore:', error);
        message += 'Failed to delete from Firestore. ';
      }

      // Handle Firebase Auth deletion
      if (authUserExists) {
        // Note: Firebase Auth deletion from client-side requires the user to be signed in
        // as the user being deleted, which is not possible for admin operations
        // This would require Firebase Admin SDK on the backend
        message += 'Firebase Auth user deletion requires backend implementation. ';
        console.warn('Firebase Auth user deletion requires backend implementation for email:', email);
      } else {
        authDeleted = true;
        message += 'User was not found in Firebase Auth. ';
      }

      return {
        success: firestoreDeleted,
        firestoreDeleted,
        authDeleted,
        message: message.trim()
      };
    } catch (error) {
      console.error('Error deleting user completely:', error);
      return {
        success: false,
        firestoreDeleted: false,
        authDeleted: false,
        message: `Error: ${error}`
      };
    }
  },



  /**
   * Create an admin user programmatically
   * WARNING: This should only be used for initial setup, remove in production
   */
  async createAdminUser(email: string, password: string, name: string): Promise<boolean> {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore with admin role
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: 'admin',
        createdAt: serverTimestamp()
      });

      console.log('Admin user created successfully:', user.uid);
      return true;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return false;
    }
  }
}; 