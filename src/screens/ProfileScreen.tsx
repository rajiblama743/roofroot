import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../firebase/authService';
import { useTheme } from '../context/ThemeContext';

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
}

interface ProfileScreenProps {
  user: User;
  onBack?: () => void;
  onSignOut: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onBack, onSignOut }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setLoading(true);
    try {
      await authService.deleteUserAccount();
      Alert.alert(
        'Account Deleted', 
        'Account successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to CustomerHome instead of calling onSignOut
              // since the user is already deleted
              if (onBack) {
                onBack();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role === 'admin' ? 'Administrator' : 'Customer';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: colors.secondary }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.buttonPrimary }]}>
            <Text style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>

        {/* Account Details */}
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Details</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.name}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.email}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.uid}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Actions</Text>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() => setShowPasswordModal(true)}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>🔐 Change Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.buttonDanger }]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.tertiary }]}
            onPress={onSignOut}
            disabled={loading}
          >
            <Text style={[styles.signOutButtonText, { color: colors.textSecondary }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.primary }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.tertiary }]}
              onPress={() => setShowPasswordModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton, { backgroundColor: colors.tertiary }]}
                onPress={() => setShowPasswordModal(false)}
                disabled={loading}
              >
                <Text style={[styles.cancelModalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton, { backgroundColor: colors.buttonPrimary }, loading && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  pageTitleContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelModalButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButton: {
    backgroundColor: '#6366F1',
  },
  confirmModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProfileScreen; 