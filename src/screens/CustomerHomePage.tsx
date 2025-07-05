import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import auth from '@react-native-firebase/auth';

interface CustomerHomePageProps {
  onListingDetails: (listing: RealEstateListing) => void;
}

const CustomerHomePage: React.FC<CustomerHomePageProps> = ({ onListingDetails }) => {
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadListings();
    setupAuthListener();
  }, []);

  const setupAuthListener = () => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        setIsAuthenticated(true);
        const userData = await authService.getUserData(user.uid);
        if (userData) {
          setUserName(userData.name);
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUserName('');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  };

  const loadListings = async () => {
    try {
      const allListings = await realEstateService.getAllListings();
      setListings(allListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenTitleContainer}>
        <Text style={styles.screenTitle}>Available Properties ({listings.length})</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : listings.length > 0 ? (
          <View style={styles.listingsContainer}>
            {listings.map((listing) => (
              <TouchableOpacity 
                key={listing.id} 
                style={styles.listingCard}
                onPress={() => onListingDetails(listing)}
                activeOpacity={0.7}
              >
                {listing.images && listing.images.length > 0 ? (
                  <Image source={{ uri: listing.images[0] }} style={styles.listingImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>🖼️</Text>
                    <Text style={styles.placeholderMessage}>Image coming soon</Text>
                  </View>
                )}
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingDescription}>{listing.description}</Text>
                <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
                {listing.location && (
                  <Text style={styles.listingLocation}>📍 {listing.location}</Text>
                )}
                <Text style={styles.tapHint}>Tap to view details</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Properties Available</Text>
            <Text style={styles.emptyText}>
              Check back soon for new listings!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  brandContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  brandSlogan: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'normal',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  screenTitleContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  listingsContainer: {
    marginBottom: 20,
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  listingImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 4,
    textAlign: 'center',
  },
  placeholderMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default CustomerHomePage; 