import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import ListingForm from '../components/ListingForm';
import { useTheme } from '../context/ThemeContext';

interface AgentHomePageProps {
  onListingDetails: (listing: RealEstateListing) => void;
}

// Optimized Listing Card Component for Agent
const AgentListingCard = React.memo(({ 
  listing, 
  onPress, 
  onEdit, 
  onDelete, 
  colors 
}: { 
  listing: RealEstateListing; 
  onPress: () => void; 
  onEdit: () => void; 
  onDelete: () => void; 
  colors: any;
}) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const handleEdit = useCallback((e: any) => {
    e.stopPropagation();
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback((e: any) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  return (
    <TouchableOpacity 
      key={listing.id} 
      style={[styles.listingCard, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {listing.images && listing.images.length > 0 ? (
        <Image 
          source={{ uri: listing.images[0] }} 
          style={styles.listingImage}
          fadeDuration={0}
          progressiveRenderingEnabled={true}
          resizeMethod="resize"
        />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: colors.tertiary }]}>
          <Text style={styles.placeholderText}>🖼️</Text>
          <Text style={[styles.placeholderMessage, { color: colors.textSecondary }]}>Image coming soon</Text>
        </View>
      )}
      <View style={styles.listingHeader}>
        <Text style={[styles.listingTitle, { color: colors.textPrimary }]}>{listing.title}</Text>
        <Text style={[styles.listingPrice, { color: colors.iconPrimary }]}>${listing.price.toLocaleString()}</Text>
      </View>
      <Text style={[styles.listingDescription, { color: colors.textSecondary }]}>{listing.description}</Text>
      {listing.location && (
        <Text style={[styles.listingLocation, { color: colors.textSecondary }]}>📍 {listing.location}</Text>
      )}
      <View style={styles.listingActions}>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.iconPrimary }]} 
          onPress={handleEdit}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: colors.buttonDanger }]} 
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const AgentHomePage: React.FC<AgentHomePageProps> = ({ onListingDetails }) => {
  const { colors } = useTheme();
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Listing form states
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<RealEstateListing | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadUserData();
    loadAgentListings();
  }, []);

  const loadUserData = useCallback(async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setCurrentUserId(currentUser.uid);
      const userData = await authService.getUserData(currentUser.uid);
      if (userData) {
        setUserName(userData.name);
      }
    }
  }, []);

  const loadAgentListings = useCallback(async () => {
    try {
      const allListings = await realEstateService.getAllListings();
      // Filter listings to show only those created by the current agent
      const agentListings = allListings.filter(listing => listing.agentId === currentUserId);
      setListings(agentListings);
    } catch (error) {
      console.error('Error loading agent listings:', error);
      Alert.alert('Error', 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const handleCreateListing = useCallback(() => {
    setFormMode('create');
    setEditingListing(null);
    setShowListingForm(true);
  }, []);

  const handleEditListing = useCallback((listing: RealEstateListing) => {
    setFormMode('edit');
    setEditingListing(listing);
    setShowListingForm(true);
  }, []);

  const handleDeleteListing = useCallback(async (listing: RealEstateListing) => {
    if (!listing.id) return;
    
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${listing.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await realEstateService.deleteListing(listing.id!);
              Alert.alert('Success', 'Listing deleted successfully');
              loadAgentListings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  }, [loadAgentListings]);

  const handleListingSubmit = useCallback(async (listingData: Omit<RealEstateListing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Add agent information to the listing
      const listingWithAgentInfo = {
        ...listingData,
        agentId: currentUserId,
        agentName: userName,
      };

      if (formMode === 'create') {
        await realEstateService.createListing(listingWithAgentInfo);
        Alert.alert('Success', 'Listing created successfully');
      } else if (editingListing?.id) {
        await realEstateService.updateListing(editingListing.id, listingWithAgentInfo);
        Alert.alert('Success', 'Listing updated successfully');
      }
      setShowListingForm(false);
      loadAgentListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      Alert.alert('Error', 'Failed to save listing');
    }
  }, [formMode, editingListing, loadAgentListings, currentUserId, userName]);

  // Memoize the listings content to prevent unnecessary re-renders
  const memoizedListingsContent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your listings...</Text>
        </View>
      );
    }

    if (listings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Listings Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Create your first listing to get started!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listingsContainer}>
        {listings.map((listing) => (
          <AgentListingCard
            key={listing.id}
            listing={listing}
            onPress={() => onListingDetails(listing)}
            onEdit={() => handleEditListing(listing)}
            onDelete={() => handleDeleteListing(listing)}
            colors={colors}
          />
        ))}
      </View>
    );
  }, [listings, loading, colors, onListingDetails, handleEditListing, handleDeleteListing]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Agent Dashboard</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Welcome back, {userName}! Manage your listings here.
        </Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.buttonPrimary }]} 
          onPress={handleCreateListing}
        >
          <Text style={styles.createButtonText}>+ Create New Listing</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.statNumber, { color: colors.iconPrimary }]}>{listings.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Listings</Text>
          </View>
        </View>

        {memoizedListingsContent}
      </ScrollView>

      {/* Listing Form Modal */}
      <Modal
        visible={showListingForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.primary }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {formMode === 'create' ? 'Create New Listing' : 'Edit Listing'}
            </Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.tertiary }]} 
              onPress={() => setShowListingForm(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ListingForm
            visible={showListingForm}
            onClose={() => setShowListingForm(false)}
            onSubmit={handleListingSubmit}
            listing={editingListing}
            mode={formMode}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  listingImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listingDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  listingLocation: {
    fontSize: 12,
    marginBottom: 12,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AgentHomePage; 