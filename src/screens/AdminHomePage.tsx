import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import { authService, realEstateService, RealEstateListing } from '../firebase';
import { adminService, AdminUserData, AgentRequest } from '../firebase/adminService';
import ListingForm from '../components/ListingForm';
import { useTheme } from '../context/ThemeContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface AdminHomePageProps {
  onListingDetails: (listing: RealEstateListing) => void;
}

// Optimized Listing Card Component for Admin
const AdminListingCard = React.memo(({ 
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
      {listing.agentName && (
        <Text style={[styles.agentName, { color: colors.textSecondary }]}>Agent: {listing.agentName}</Text>
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

// Optimized User Card Component
const UserCard = React.memo(({ 
  user, 
  onPress, 
  onDelete, 
  colors 
}: { 
  user: AdminUserData; 
  onPress: () => void; 
  onDelete: () => void; 
  colors: any;
}) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const handleDelete = useCallback((e: any) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  return (
    <TouchableOpacity 
      key={user.uid} 
      style={[styles.userCard, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        <Text style={[styles.userRole, { color: colors.iconPrimary, backgroundColor: colors.tertiary }, user.role === 'admin' && { color: colors.buttonDanger, backgroundColor: colors.tertiary }]}>
          {user.role}
        </Text>
      </View>
      <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
      <View style={styles.userFooter}>
        <Text style={[styles.userCreated, { color: colors.textSecondary }]}>
          Created: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
        </Text>
        {user.role !== 'admin' && (
          <TouchableOpacity 
            style={[styles.userDeleteButton, { backgroundColor: colors.buttonDanger, borderColor: colors.buttonDanger }]} 
            onPress={handleDelete}
          >
            <Text style={styles.userDeleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Agent Request Card Component
const AgentRequestCard = React.memo(({ 
  request, 
  onApprove, 
  onReject, 
  colors 
}: { 
  request: AgentRequest; 
  onApprove: () => void; 
  onReject: () => void; 
  colors: any;
}) => {
  const handleApprove = useCallback((e: any) => {
    e.stopPropagation();
    onApprove();
  }, [onApprove]);

  const handleReject = useCallback((e: any) => {
    e.stopPropagation();
    onReject();
  }, [onReject]);

  return (
    <View style={[styles.requestCard, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}>
      <View style={styles.requestHeader}>
        <Text style={[styles.requestName, { color: colors.textPrimary }]}>{request.name}</Text>
        <Text style={[styles.requestStatus, { 
          color: request.status === 'pending' ? colors.iconPrimary : 
                 request.status === 'approved' ? colors.buttonSuccess : colors.buttonDanger,
          backgroundColor: colors.tertiary 
        }]}>
          {request.status}
        </Text>
      </View>
      <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>{request.email}</Text>
      <Text style={[styles.requestPhone, { color: colors.textSecondary }]}>{request.phone}</Text>
      {request.agency && (
        <Text style={[styles.requestAgency, { color: colors.textSecondary }]}>Agency: {request.agency}</Text>
      )}
      {request.companyDescription && (
        <Text style={[styles.requestExperience, { color: colors.textSecondary }]}>Company Description: {request.companyDescription}</Text>
      )}
      <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
        Requested: {request.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown'}
      </Text>
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.approveButton, { backgroundColor: colors.buttonSuccess }]} 
            onPress={handleApprove}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rejectButton, { backgroundColor: colors.buttonDanger }]} 
            onPress={handleReject}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const AdminHomePage: React.FC<AdminHomePageProps> = ({ onListingDetails }) => {
  const { colors } = useTheme();
  const [listings, setListings] = useState<RealEstateListing[]>([]);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'agentRequests'>('listings');
  
  // Listing form states
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<RealEstateListing | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [approverName, setApproverName] = useState<string>('');
  
  // Agent requests states with real-time listeners
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
  const [loadingAgentRequests, setLoadingAgentRequests] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Real-time listeners references
  const [usersListener, setUsersListener] = useState<any>(null);
  const [agentRequestsListener, setAgentRequestsListener] = useState<any>(null);

  useEffect(() => {
    loadListings();
    loadUserData();
    loadInitialData();
    setupRealTimeListeners();

    // Cleanup listeners on unmount
    return () => {
      cleanupListeners();
    };
  }, []);

  const setupRealTimeListeners = useCallback(() => {
    console.log('🔧 Setting up real-time listeners...');

    // Setup users real-time listener
    const usersUnsubscribe = firestore()
      .collection('users')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          console.log('👥 Users real-time update:', snapshot.docs.length, 'users');
          const usersData: AdminUserData[] = [];
          snapshot.forEach((doc) => {
            usersData.push({
              uid: doc.id,
              ...doc.data()
            } as AdminUserData);
          });
          setUsers(usersData);
        },
        (error: any) => {
          console.error('❌ Error in users listener:', error);
        }
      );

    // Setup agent requests real-time listener
    const agentRequestsUnsubscribe = firestore()
      .collection('agentRequests')
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        (snapshot) => {
          console.log('📋 Agent requests real-time update:', snapshot.docs.length, 'requests');
          const requestsData: AgentRequest[] = [];
          snapshot.forEach((doc) => {
            requestsData.push({
              id: doc.id,
              ...doc.data()
            } as AgentRequest);
          });
          setAgentRequests(requestsData);
        },
        (error: any) => {
          console.error('❌ Error in agent requests listener:', error);
        }
      );

    setUsersListener(usersUnsubscribe);
    setAgentRequestsListener(agentRequestsUnsubscribe);
  }, []);

  const cleanupListeners = useCallback(() => {
    console.log('🧹 Cleaning up real-time listeners...');
    if (usersListener) {
      usersListener();
      setUsersListener(null);
    }
    if (agentRequestsListener) {
      agentRequestsListener();
      setAgentRequestsListener(null);
    }
  }, [usersListener, agentRequestsListener]);

  // Load initial data immediately, then set up real-time listeners
  const loadInitialData = useCallback(async () => {
    console.log('📥 Loading initial data...');
    
    // Load users immediately
    try {
      setLoadingUsers(true);
      const allUsers = await adminService.getAllUsers();
      console.log('📋 Initial users loaded:', allUsers.length);
      setUsers(allUsers);
    } catch (error) {
      console.error('❌ Failed to load initial users:', error);
    } finally {
      setLoadingUsers(false);
    }

    // Load agent requests immediately
    try {
      setLoadingAgentRequests(true);
      const requests = await adminService.getAgentRequests();
      console.log('📋 Initial agent requests loaded:', requests.length);
      setAgentRequests(requests);
    } catch (error) {
      console.error('❌ Failed to load initial agent requests:', error);
    } finally {
      setLoadingAgentRequests(false);
    }
  }, []);

  const loadListings = useCallback(async () => {
    try {
      const allListings = await realEstateService.getAllListings();
      setListings(allListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userData = await authService.getUserData(currentUser.uid);
      if (userData) {
        setUserName(userData.name);
      }
    }
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
              loadListings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  }, [loadListings]);

  const handleListingSubmit = useCallback(async (listingData: Omit<RealEstateListing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (formMode === 'edit' && editingListing?.id) {
        await realEstateService.updateListing(editingListing.id, listingData);
        Alert.alert('Success', 'Listing updated successfully');
      }
      loadListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      Alert.alert('Error', 'Failed to save listing');
    }
  }, [formMode, editingListing, loadListings, userName]);

  const handleUserPress = useCallback((user: AdminUserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    // Fetch approver name if this is an agent with approval info
    if (user.role === 'agent' && user.approvedBy) {
      firestore().collection('users').doc(user.approvedBy).get()
        .then((approverDoc) => {
          if (approverDoc.exists) {
            const approverData = approverDoc.data();
            setApproverName(approverData?.name || 'Unknown Admin');
          } else {
            setApproverName('Unknown Admin');
          }
        })
        .catch((error) => {
          console.error('Error fetching approver name:', error);
          setApproverName('Unknown Admin');
        });
    } else {
      setApproverName('');
    }
  }, []);

  const handleDeleteUser = useCallback(async (user: AdminUserData) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
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
                // No need to reload users - real-time listener will handle the update
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
  }, []);

  const handleApproveAgentRequest = useCallback(async (request: AgentRequest) => {
    try {
      console.log('🚀 Approving agent request for:', request.name);
      
      const result = await adminService.approveAgentRequest(request.id);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        // No need to reload agent requests - real-time listener will handle the update
      } else {
        Alert.alert('Error', result.message);
        console.error('Approval failed:', result.error);
      }
    } catch (error) {
      console.error('Error approving agent request:', error);
      Alert.alert('Error', 'Failed to approve agent request');
    }
  }, []);

  const handleRejectAgentRequest = useCallback(async (request: AgentRequest) => {
    try {
      console.log('🚀 Rejecting agent request for:', request.name);
      
      const result = await adminService.rejectAgentRequest(request.id);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        // No need to reload agent requests - real-time listener will handle the update
      } else {
        Alert.alert('Error', result.message);
        console.error('Rejection failed:', result.error);
      }
    } catch (error) {
      console.error('Error rejecting agent request:', error);
      Alert.alert('Error', 'Failed to reject agent request');
    }
  }, []);

  const handleListingPress = useCallback((listing: RealEstateListing) => {
    onListingDetails(listing);
  }, [onListingDetails]);

  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.iconPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading listings...</Text>
        </View>
      );
    }

    if (activeTab === 'listings') {
      if (listings.length > 0) {
        return (
          <View style={styles.listingsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Listings ({listings.length})</Text>
            {listings.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                onPress={() => handleListingPress(listing)}
                onEdit={() => handleEditListing(listing)}
                onDelete={() => handleDeleteListing(listing)}
                colors={colors}
              />
            ))}
          </View>
        );
      } else {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Listings Available</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No listings have been created yet.
            </Text>
          </View>
        );
      }
    } else if (activeTab === 'users') {
      // Users tab with real-time updates
      if (loadingUsers) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.iconPrimary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading users...</Text>
          </View>
        );
      }

      if (users.length > 0) {
        return (
          <View style={styles.usersContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Registered Users ({users.length})</Text>
            {users.map((user) => (
              <UserCard
                key={user.uid}
                user={user}
                onPress={() => handleUserPress(user)}
                onDelete={() => handleDeleteUser(user)}
                colors={colors}
              />
            ))}
          </View>
        );
      } else {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Users Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No users have registered yet.
            </Text>
          </View>
        );
      }
    } else {
      // Agent Requests tab with real-time updates
      if (loadingAgentRequests) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.iconPrimary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading agent requests...</Text>
          </View>
        );
      }

      if (agentRequests.length > 0) {
        return (
          <View style={styles.requestsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Requests ({agentRequests.length})</Text>
            {agentRequests.map((request) => (
              <AgentRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApproveAgentRequest(request)}
                onReject={() => handleRejectAgentRequest(request)}
                colors={colors}
              />
            ))}
          </View>
        );
      } else {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Pending Requests</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No agent account requests have been submitted.
            </Text>
          </View>
        );
      }
    }
  }, [loading, loadingUsers, loadingAgentRequests, activeTab, listings, users, agentRequests, colors, handleListingPress, handleEditListing, handleDeleteListing, handleDeleteUser, handleApproveAgentRequest, handleRejectAgentRequest]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Admin Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage Real Estate Platform</Text>
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
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'agentRequests' && { backgroundColor: colors.iconPrimary }]} 
          onPress={() => setActiveTab('agentRequests')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'agentRequests' && { color: 'white' }]}>
            Requests ({agentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      >
        {memoizedContent}
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
                {selectedUser.agency && (
                  <>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Agency:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.agency}</Text>
                  </>
                )}
                {selectedUser.phone && (
                  <>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Phone:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.phone}</Text>
                  </>
                )}
                {selectedUser.companyDescription && (
                  <>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Company Description:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.companyDescription}</Text>
                  </>
                )}
                <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>User ID:</Text>
                <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.uid}</Text>
                {selectedUser.role === 'agent' && selectedUser.approvedBy ? (
                  <>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Approved By:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{approverName || selectedUser.approvedBy}</Text>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Approved At:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.approvedAt?.toDate?.()?.toLocaleString() || selectedUser.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.userModalLabel, { color: colors.textSecondary }]}>Created At:</Text>
                    <Text style={[styles.userModalValue, { color: colors.textPrimary }]}>{selectedUser.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'}</Text>
                  </>
                )}
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
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
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
  },
  listingsContainer: {
    marginBottom: 20,
  },
  usersContainer: {
    marginBottom: 20,
  },
  requestsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    marginBottom: 4,
  },
  agentName: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userCreated: {
    fontSize: 12,
    marginBottom: 8,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDeleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDeleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requestEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestAgency: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestExperience: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  userModalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  userModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  userModalValue: {
    fontSize: 16,
    marginBottom: 12,
  },

});

export default AdminHomePage; 