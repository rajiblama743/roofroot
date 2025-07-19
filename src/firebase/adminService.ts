import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { authService } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

export interface AdminUserData {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'agent';
  createdAt: any;
  approvedBy?: string;
  approvedAt?: any;
  agency?: string;
  phone?: string;
  companyDescription?: string;
}

export interface AgentRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  agency: string;
  companyDescription?: string;
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  authUid?: string;
}

export const adminService = {
  /**
   * Get all users from Firestore
   */
  async getAllUsers(): Promise<AdminUserData[]> {
    try {
      const usersSnapshot = await firestore().collection('users').get();
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
      const querySnapshot = await firestore().collection('users').where('email', '==', email).get();
      
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
   * Get all agent requests from Firestore
   */
  async getAgentRequests(): Promise<AgentRequest[]> {
    try {
      const requestsSnapshot = await firestore().collection('agentRequests')
        .orderBy('timestamp', 'desc')
        .get();
      
      const requests: AgentRequest[] = [];
      requestsSnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        } as AgentRequest);
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting agent requests:', error);
      throw error;
    }
  },

  /**
   * Approve an agent request using the backend API
   * This creates a new user in Firebase Auth and Firestore securely
   */
  async approveAgentRequest(requestId: string): Promise<{
    success: boolean;
    message: string;
    userUid?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Approving agent request:', requestId);
      console.log('📍 API Base URL:', API_BASE_URL);
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const requestBody = {
        requestId,
        adminUid: currentUser.uid,
      };

      console.log('📤 Request body:', requestBody);
      console.log('🌐 Making request to:', `${API_BASE_URL}/api/agent-requests/approve`);

      const response = await fetch(`${API_BASE_URL}/api/agent-requests/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Get the response text first to debug
      const responseText = await response.text();
      console.log('📄 Response text:', responseText);

      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('📄 Raw response:', responseText);
        
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return {
            success: false,
            message: 'Backend server error - received HTML instead of JSON. Please check if the backend server is running and the endpoint exists.',
            error: 'HTML response received'
          };
        }
        
        return {
          success: false,
          message: 'Invalid response from server - expected JSON but received unexpected format.',
          error: 'JSON parse error'
        };
      }
      
      if (!response.ok) {
        console.error('❌ Backend error:', result);
        return {
          success: false,
          message: result.error || `Server error: ${response.status} ${response.statusText}`,
          error: result.error || 'HTTP error'
        };
      }

      console.log('✅ Agent request approved successfully:', result);
      return {
        success: true,
        message: result.message,
        userUid: result.userUid
      };

    } catch (error: any) {
      console.error('❌ Error approving agent request:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('fetch')) {
        return {
          success: false,
          message: 'Network error - cannot connect to backend server. Please check if the server is running.',
          error: error.message
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to approve agent request',
        error: error.message
      };
    }
  },

  /**
   * Reject an agent request using the backend API
   */
  async rejectAgentRequest(requestId: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Rejecting agent request:', requestId);
      console.log('📍 API Base URL:', API_BASE_URL);
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const requestBody = {
        requestId,
        adminUid: currentUser.uid,
      };

      console.log('📤 Request body:', requestBody);
      console.log('🌐 Making request to:', `${API_BASE_URL}/api/agent-requests/reject`);

      const response = await fetch(`${API_BASE_URL}/api/agent-requests/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Get the response text first to debug
      const responseText = await response.text();
      console.log('📄 Response text:', responseText);

      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('📄 Raw response:', responseText);
        
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return {
            success: false,
            message: 'Backend server error - received HTML instead of JSON. Please check if the backend server is running and the endpoint exists.',
            error: 'HTML response received'
          };
        }
        
        return {
          success: false,
          message: 'Invalid response from server - expected JSON but received unexpected format.',
          error: 'JSON parse error'
        };
      }
      
      if (!response.ok) {
        console.error('❌ Backend error:', result);
        return {
          success: false,
          message: result.error || `Server error: ${response.status} ${response.statusText}`,
          error: result.error || 'HTTP error'
        };
      }

      console.log('✅ Agent request rejected successfully:', result);
      return {
        success: true,
        message: result.message
      };

    } catch (error: any) {
      console.error('❌ Error rejecting agent request:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('fetch')) {
        return {
          success: false,
          message: 'Network error - cannot connect to backend server. Please check if the server is running.',
          error: error.message
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to reject agent request',
        error: error.message
      };
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
        await firestore().collection('users').doc(userData.uid).delete();
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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user document in Firestore with admin role
      await firestore().collection('users').doc(user.uid).set({
        name: name,
        email: email,
        role: 'admin',
        createdAt: firestore.FieldValue.serverTimestamp()
      });

      console.log('Admin user created successfully:', user.uid);
      return true;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return false;
    }
  },

  /**
   * Verify admin account credentials without actually signing in
   * This helps debug authentication issues
   */
  async verifyAdminCredentials(email: string, password: string): Promise<{
    authExists: boolean;
    firestoreExists: boolean;
    role: string | null;
    canSignIn: boolean;
    error: string | null;
  }> {
    try {
      console.log('🔍 Verifying admin credentials for:', email);
      
      // Check if user exists in Firebase Auth
      const authExists = await authService.checkEmailExists(email);
      console.log('  - Auth exists:', authExists);
      
      if (!authExists) {
        return {
          authExists: false,
          firestoreExists: false,
          role: null,
          canSignIn: false,
          error: 'User not found in Firebase Authentication'
        };
      }
      
      // Try to sign in to test credentials
      let canSignIn = false;
      let firestoreExists = false;
      let role = null;
      
      try {
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        canSignIn = true;
        console.log('  - Sign-in successful, UID:', userCredential.user.uid);
        
        // Get user data from Firestore
        const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
        if (userDoc.exists()) {
          firestoreExists = true;
          const userData = userDoc.data();
          role = userData?.role || null;
          console.log('  - Firestore exists:', firestoreExists);
          console.log('  - Role:', role);
        }
        
        // Sign out
        await auth().signOut();
        console.log('  - Signed out after verification');
        
      } catch (signInError: any) {
        console.log('  - Sign-in failed:', signInError.code);
        return {
          authExists: true,
          firestoreExists: false,
          role: null,
          canSignIn: false,
          error: `Authentication failed: ${signInError.code} - ${signInError.message}`
        };
      }
      
      return {
        authExists,
        firestoreExists,
        role,
        canSignIn,
        error: null
      };
      
    } catch (error: any) {
      console.error('❌ Error verifying admin credentials:', error);
      return {
        authExists: false,
        firestoreExists: false,
        role: null,
        canSignIn: false,
        error: error.message || 'Unknown error'
      };
    }
  }
}; 