import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Initialize React Native Firebase Storage
const storageRef = storage();

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
  agentId?: string;
  agentName?: string;
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
      
      const docRef = await firestore().collection('listings').add({
        ...cleanListing,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
      const querySnapshot = await firestore().collection('listings').get();
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
      const docSnap = await firestore().collection('listings').doc(id).get();
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
      
      await firestore().collection('listings').doc(id).update({
        ...cleanUpdates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
      await firestore().collection('listings').doc(id).delete();
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  /**
   * Remove a specific image from a listing
   */
  async removeListingImage(listingId: string, imageUrl: string): Promise<void> {
    try {
      // Delete from Firebase Storage (silently ignore if not available)
      if (imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
        try {
          const imageRef = storageRef.refFromURL(imageUrl);
          await imageRef.delete();
          console.log('Successfully deleted image from Firebase Storage:', imageUrl);
        } catch (storageError) {
          // Silently ignore storage errors - this is expected behavior
        }
      }

      // Update Firestore to remove the URL from images array
      const docSnap = await firestore().collection('listings').doc(listingId).get();
      
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const currentImages = currentData?.images || [];
        const updatedImages = currentImages.filter((url: string) => url !== imageUrl);
        
        await firestore().collection('listings').doc(listingId).update({
          images: updatedImages,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('Successfully updated Firestore listing images');
      }
    } catch (error) {
      console.error('Error removing listing image:', error);
      throw error;
    }
  }
}; 