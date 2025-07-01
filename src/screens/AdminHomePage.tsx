import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import { adminService, AdminUserData } from '../firebase/adminService';

const AdminHomePage: React.FC = () => {
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');

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
    Alert.alert('Create Listing', 'This feature will be implemented soon!');
  };

  const handleEditListing = (listing: RealEstateListing) => {
    Alert.alert('Edit Listing', `Edit "${listing.title}" - This feature will be implemented soon!`);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage Real Estate Listings</Text>
        {userName && (
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'listings' && styles.activeTab]} 
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
            Listings ({listings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'listings' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateListing}>
            <Text style={styles.createButtonText}>+ Create New Listing</Text>
          </TouchableOpacity>
        </View>
      )}



      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'listings' ? (
          listings.length > 0 ? (
            <View style={styles.listingsContainer}>
              <Text style={styles.sectionTitle}>Current Listings ({listings.length})</Text>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    <Text style={styles.listingTitle}>{listing.title}</Text>
                    <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.listingDescription}>{listing.description}</Text>
                  {listing.location && (
                    <Text style={styles.listingLocation}>📍 {listing.location}</Text>
                  )}
                  <View style={styles.listingActions}>
                    <TouchableOpacity 
                      style={styles.editButton} 
                      onPress={() => handleEditListing(listing)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => handleDeleteListing(listing)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Listings Available</Text>
              <Text style={styles.emptyText}>
                Create your first listing to get started!
              </Text>
            </View>
          )
        ) : (
          // Users tab
          users.length > 0 ? (
            <View style={styles.usersContainer}>
              <Text style={styles.sectionTitle}>Registered Users ({users.length})</Text>
              {users.map((user) => (
                <View key={user.uid} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={[styles.userRole, user.role === 'admin' && styles.adminRole]}>
                      {user.role}
                    </Text>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userCreated}>
                    Created: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </Text>
                  {user.role !== 'admin' && (
                    <TouchableOpacity 
                      style={styles.userDeleteButton} 
                      onPress={() => handleDeleteUser(user)}
                    >
                      <Text style={styles.userDeleteButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Users Available</Text>
              <Text style={styles.emptyText}>
                No users have registered yet.
              </Text>
            </View>
          )
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
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
    color: '#64748B',
  },
  activeTabText: {
    color: 'white',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  createButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
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
    color: '#64748B',
  },
  listingsContainer: {
    marginBottom: 20,
  },
  usersContainer: {
    marginBottom: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
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
    color: '#64748B',
    marginBottom: 4,
  },
  userCreated: {
    fontSize: 12,
    color: '#94A3B8',
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
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  listingDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 20,
  },
  listingLocation: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#6366F1',
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
    backgroundColor: '#EF4444',
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
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  userDeleteButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  userDeleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminHomePage; 