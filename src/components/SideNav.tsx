import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface SideNavProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  isLoggedIn: boolean;
  userName?: string;
}

const SideNav: React.FC<SideNavProps> = ({ 
  visible, 
  onClose, 
  onSignIn, 
  onSignUp, 
  onSignOut, 
  isLoggedIn, 
  userName 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sideNav}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>RoofRoot</Text>
              <Text style={styles.slogan}>Find Your Dream Home</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {isLoggedIn ? (
              // Logged in user - show user info and sign out
              <>
                <Text style={styles.sectionTitle}>Account</Text>
                {userName && (
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userName}</Text>
                  </View>
                )}
                <TouchableOpacity style={[styles.navButton, styles.signOutButton]} onPress={onSignOut}>
                  <Text style={[styles.navButtonText, styles.signOutButtonText]}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Not logged in - show sign in/sign up options
              <>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.navButton} onPress={onSignIn}>
                  <Text style={styles.navButtonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, styles.primaryButton]} onPress={onSignUp}>
                  <Text style={[styles.navButtonText, styles.primaryButtonText]}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Building Dreams, One Home at a Time</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  slogan: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'normal',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  userInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  navButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: 'white',
  },
  signOutButtonText: {
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SideNav; 