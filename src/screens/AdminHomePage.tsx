import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import { adminService, AdminUserData } from '../firebase/adminService';
import ListingForm from '../components/ListingForm';
import { useTheme } from '../context/ThemeContext';

interface AdminHomePageProps {
  onListingDetails: (listing: RealEstateListing) => void;
}

const AdminHomePage: React.FC<AdminHomePageProps> = ({ onListingDetails }) => {
  const { colors } = useTheme();
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  
  // Listing form states
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<RealEstateListing | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadListings();
    loadUsers();
    loadUserData();
  }, []);

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

  const loadUsers = async () => {
    try {
      const allUsers = await adminService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const loadUserData = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userData = await authService.getUserData(currentUser.uid);
      if (userData) {
        setUserName(userData.name);
      }
    }
  };

  const handleCreateListing = () => {
    setFormMode('create');
    setEditingListing(null);
    setShowListingForm(true);
  };

  const handleEditListing = (listing: RealEstateListing) => {
    setFormMode('edit');
    setEditingListing(listing);
    setShowListingForm(true);
  };

  const handleDeleteListing = async (listing: RealEstateListing) => {
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
              loadListings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const handleListingSubmit = async (listingData: Omit<RealEstateListing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (formMode === 'create') {
        await realEstateService.createListing(listingData);
        Alert.alert('Success', 'Listing created successfully');
      } else if (editingListing?.id) {
        await realEstateService.updateListing(editingListing.id, listingData);
        Alert.alert('Success', 'Listing updated successfully');
      }
      loadListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      Alert.alert('Error', 'Failed to save listing');
    }
  };

  const handleDeleteUser = async (user: AdminUserData) => {
    // Prevent deletion of admin users
    if (user.role === 'admin') {
      Alert.alert('Error', 'Admin users cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.name}" (${user.email})?\n\nThis will remove them from Firestore. Firebase Auth deletion requires backend implementation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await adminService.deleteUserCompletely(user.email);
              if (result.success) {
                Alert.alert('Success', result.message);
                loadUsers();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Admin Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage Real Estate Listings</Text>
        {userName && (
          <Text style={[styles.welcomeText, { color: colors.iconPrimary }]}>Welcome, {userName}!</Text>
        )}
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'listings' && { backgroundColor: colors.iconPrimary }]} 
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'listings' && { color: 'white' }]}>
            Listings ({listings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && { backgroundColor: colors.iconPrimary }]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'users' && { color: 'white' }]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'listings' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.buttonSuccess, shadowColor: colors.buttonSuccess }]} onPress={handleCreateListing}>
            <Text style={styles.createButtonText}>+ Create New Listing</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        ) : activeTab === 'listings' ? (
          listings.length > 0 ? (
            <View style={styles.listingsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Current Listings ({listings.length})</Text>
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
                      onPress={(e) => { e.stopPropagation(); handleEditListing(listing); }}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteButton, { backgroundColor: colors.buttonDanger }]} 
                      onPress={(e) => { e.stopPropagation(); handleDeleteListing(listing); }}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Listings Available</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Create your first listing to get started!
              </Text>
            </View>
          )
        ) : (
          // Users tab
          users.length > 0 ? (
            <View style={styles.usersContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Registered Users ({users.length})</Text>
              {users.map((user) => (
                <TouchableOpacity 
                  key={user.uid} 
                  style={[styles.userCard, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}
                  onPress={() => { setSelectedUser(user); setShowUserModal(true); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.userHeader}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                    <Text style={[styles.userRole, { color: colors.iconPrimary, backgroundColor: colors.tertiary }, user.role === 'admin' && { color: colors.buttonDanger, backgroundColor: colors.tertiary }]}>
                      {user.role}
                    </Text>
                  </View>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                  <Text style={[styles.userCreated, { color: colors.textSecondary }]}>
                    Created: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </Text>
                  {user.role !== 'admin' && (
                    <TouchableOpacity 
                      style={[styles.userDeleteButton, { backgroundColor: colors.buttonDanger, borderColor: colors.buttonDanger }]} 
                      onPress={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                    >
                      <Text style={styles.userDeleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Users Available</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users have registered yet.
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <ListingForm
        visible={showListingForm}
        onClose={() => setShowListingForm(false)}
        onSubmit={handleListingSubmit}
        listing={editingListing}
        mode={formMode}
      />

      <Modal
        visible={showUserModal && !!selectedUser}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.userModalContainer, { backgroundColor: colors.secondary }]}>
            <View style={styles.userModalHeader}>
              <Text style={[styles.userModalTitle, { color: colors.textPrimary }]}>User Details</Text>
              <TouchableOpacity 
                style={[styles.userModalCloseButton, { backgroundColor: colors.tertiary }]} 
                onPress={() => setShowUserModal(false)}
              >
                <Text style={[styles.userModalCloseButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedUser && (
              <>
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Name:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.name}</Text>
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Email:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.email}</Text>
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Role:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.role}</Text>
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>User ID:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.uid}</Text>
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Created At:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
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
  usersContainer: {
    marginBottom: 20,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
  },
  adminRole: {
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userCreated: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
  listingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  userActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  userViewButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  userViewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userModalContainer: {
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxWidth: '90%',
    alignItems: 'flex-start',
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    paddingRight: 0,
  },
  userModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  userModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  userModalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  userModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  userModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userModalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDeleteButton: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderWidth: 1,
  },
  userDeleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AdminHomePage; 