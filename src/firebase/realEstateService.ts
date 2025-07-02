import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';

export interface RealEstateListing {
  id?: string;
  title: string;
  description: string;
  price: number;
  location?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const realEstateService = {
  /**
   * Create a new real estate listing
   */
  async createListing(listing: Omit<RealEstateListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanListing = Object.fromEntries(
        Object.entries(listing).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'listing'), {
        ...cleanListing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  /**
   * Get all real estate listings
   */
  async getAllListings(): Promise<RealEstateListing[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'listing'));
      const listings: RealEstateListing[] = [];
      querySnapshot.forEach((doc) => {
        listings.push({
          id: doc.id,
          ...doc.data()
        } as RealEstateListing);
      });
      return listings;
    } catch (error) {
      console.error('Error getting listings:', error);
      throw error;
    }
  },

  /**
   * Get a single real estate listing by ID
   */
  async getListingById(id: string): Promise<RealEstateListing | null> {
    try {
      const docRef = doc(db, 'listing', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as RealEstateListing;
      }
      return null;
    } catch (error) {
      console.error('Error getting listing:', error);
      throw error;
    }
  },

  /**
   * Update a real estate listing
   */
  async updateListing(id: string, updates: Partial<RealEstateListing>): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = doc(db, 'listing', id);
      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  /**
   * Delete a real estate listing
   */
  async deleteListing(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'listing', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }
}; 