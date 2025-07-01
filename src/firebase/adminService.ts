import { db } from './firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { authService } from './authService';

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
   * Delete user completely (both Firestore and Firebase Auth)
   * Note: This requires the user to be signed in as the user being deleted
   * or requires admin privileges through Firebase Admin SDK on the backend
   */
  async deleteUserCompletely(email: string): Promise<boolean> {
    try {
      // First, find the user in Firestore
      const userData = await this.getUserByEmail(email);
      
      if (!userData) {
        console.log('User not found in Firestore for email:', email);
        return false;
      }

      // Check if user exists in Firebase Auth
      const authUserExists = await authService.checkEmailExists(email);
      
      if (!authUserExists) {
        console.log('User not found in Firebase Auth for email:', email);
        // Still delete from Firestore if it exists there
        await deleteDoc(doc(db, 'users', userData.uid));
        return true;
      }

      // Delete from Firestore first
      await deleteDoc(doc(db, 'users', userData.uid));
      
      // Note: Deleting from Firebase Auth requires the user to be signed in
      // or requires Firebase Admin SDK on the backend
      // For now, we'll just delete from Firestore and log a warning
      console.warn('User deleted from Firestore. Firebase Auth user deletion requires backend implementation.');
      
      return true;
    } catch (error) {
      console.error('Error deleting user completely:', error);
      throw error;
    }
  },

  /**
   * Check if a user exists in both Firestore and Firebase Auth
   */
  async checkUserConsistency(email: string): Promise<{
    firestoreExists: boolean;
    authExists: boolean;
    isConsistent: boolean;
  }> {
    try {
      const firestoreUser = await this.getUserByEmail(email);
      const authExists = await authService.checkEmailExists(email);
      
      const firestoreExists = !!firestoreUser;
      const isConsistent = firestoreExists === authExists;
      
      return {
        firestoreExists,
        authExists,
        isConsistent
      };
    } catch (error) {
      console.error('Error checking user consistency:', error);
      throw error;
    }
  },

  /**
   * Clean up orphaned users (users that exist in one system but not the other)
   */
  async cleanupOrphanedUsers(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    try {
      const users = await this.getAllUsers();
      const results = {
        cleaned: 0,
        errors: [] as string[]
      };

      for (const user of users) {
        try {
          const consistency = await this.checkUserConsistency(user.email);
          
          if (!consistency.isConsistent) {
            if (consistency.firestoreExists && !consistency.authExists) {
              // User exists in Firestore but not in Auth - delete from Firestore
              await deleteDoc(doc(db, 'users', user.uid));
              results.cleaned++;
              console.log(`Cleaned up orphaned Firestore user: ${user.email}`);
            } else if (!consistency.firestoreExists && consistency.authExists) {
              // User exists in Auth but not in Firestore - this is harder to handle
              results.errors.push(`Orphaned Auth user found: ${user.email} - requires manual cleanup`);
            }
          }
        } catch (error) {
          results.errors.push(`Error processing user ${user.email}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error cleaning up orphaned users:', error);
      throw error;
    }
  }
}; 