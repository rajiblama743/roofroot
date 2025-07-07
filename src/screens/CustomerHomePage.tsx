import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import auth from '@react-native-firebase/auth';
import { useTheme } from '../context/ThemeContext';

interface CustomerHomePageProps {
  onListingDetails: (listing: RealEstateListing) => void;
}

const CustomerHomePage: React.FC<CustomerHomePageProps> = ({ onListingDetails }) => {
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.screenTitleContainer, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Available Properties ({listings.length})</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading listings...</Text>
          </View>
        ) : listings.length > 0 ? (
          <View style={styles.listingsContainer}>
            {listings.map((listing) => (
              <TouchableOpacity 
                key={listing.id} 
                style={[styles.listingCard, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}
                onPress={() => onListingDetails(listing)}
                activeOpacity={0.7}
              >
                {listing.images && listing.images.length > 0 ? (
                  <Image source={{ uri: listing.images[0] }} style={styles.listingImage} />
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: colors.tertiary }]}>
                    <Text style={styles.placeholderText}>🖼️</Text>
                    <Text style={[styles.placeholderMessage, { color: colors.textSecondary }]}>Image coming soon</Text>
                  </View>
                )}
                <Text style={[styles.listingTitle, { color: colors.textPrimary }]}>{listing.title}</Text>
                <Text style={[styles.listingDescription, { color: colors.textSecondary }]}>{listing.description}</Text>
                <Text style={[styles.listingPrice, { color: colors.iconPrimary }]}>${listing.price.toLocaleString()}</Text>
                {listing.location && (
                  <Text style={[styles.listingLocation, { color: colors.textSecondary }]}>📍 {listing.location}</Text>
                )}
                <Text style={[styles.tapHint, { color: colors.textSecondary }]}>Tap to view details</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Properties Available</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
  },
  brandContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  brandSlogan: {
    fontSize: 14,
    fontWeight: 'normal',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  screenTitleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  },
  listingsContainer: {
    marginBottom: 20,
  },
  listingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 12,
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
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
    textAlign: 'center',
  },
});

export default CustomerHomePage; 