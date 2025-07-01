import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const CustomerHomePage: React.FC = () => {
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadListings();
    setupAuthListener();
  }, []);

  const setupAuthListener = () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
      <View style={styles.header}>
        <Text style={styles.title}>RoofRoot</Text>
        <Text style={styles.subtitle}>Find Your Dream Home</Text>
        {isAuthenticated && userName && (
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : listings.length > 0 ? (
          <View style={styles.listingsContainer}>
            <Text style={styles.sectionTitle}>Available Properties ({listings.length})</Text>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.listingCard}>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingDescription}>{listing.description}</Text>
                <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
                {listing.location && (
                  <Text style={styles.listingLocation}>📍 {listing.location}</Text>
                )}
                {listing.imageUrl && (
                  <Text style={styles.listingImageUrl}>🖼️ View Photos</Text>
                )}
              </View>
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
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
  listingImageUrl: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
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
});

export default CustomerHomePage; 