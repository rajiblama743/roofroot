import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

interface SideNavProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  onProfile: () => void;
  isLoggedIn: boolean;
  userName?: string;
  userRole?: string;
}

const SideNav: React.FC<SideNavProps> = ({ 
  visible, 
  onClose, 
  onSignIn, 
  onSignUp, 
  onSignOut, 
  onProfile,
  isLoggedIn, 
  userName,
  userRole
}) => {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-280)).current;

  // Ensure navbar starts off-screen
  useEffect(() => {
    slideAnim.setValue(-280);
  }, []);

  useEffect(() => {
    if (visible) {
      // Slide in from left
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleHome = () => {
    onClose();
    if (userRole === 'admin') {
      navigation.navigate('AdminHome' as never);
    } else {
      navigation.navigate('CustomerHome' as never);
    }
  };

  const handleClose = () => {
    // Animate out first, then call onClose
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <View style={styles.overlaySpacer} />
        </TouchableOpacity>
        <Animated.View 
          style={[
            styles.sideNav, 
            { 
              backgroundColor: colors.secondary,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.spacer} />
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>RoofRoot</Text>
              <Text style={[styles.slogan, { color: colors.textSecondary }]}>Find Your Dream Home</Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.tertiary }]} 
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacing} />

          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.tertiary, borderColor: colors.border }]} 
            onPress={handleHome}
          >
            <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>🏠 Home</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={[styles.themeSection, { backgroundColor: colors.secondary, borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme</Text>
            <View style={[styles.themeToggleContainer, { backgroundColor: colors.tertiary, borderColor: colors.border }]}>
              <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.iconPrimary }}
                thumbColor={isDark ? colors.secondary : colors.secondary}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          <View style={[styles.accountSection, { backgroundColor: colors.secondary, borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
            {isLoggedIn ? (
              <>
                {userName && (
                  <TouchableOpacity 
                    style={[styles.userInfo, { backgroundColor: colors.primary, borderColor: colors.border }]} 
                    onPress={onProfile}
                  >
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{userName}</Text>
                    <Text style={[styles.profileHint, { color: colors.textSecondary }]}>Tap to view profile</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.navButton, styles.signOutButton, { borderColor: colors.buttonDanger }]} 
                  onPress={onSignOut}
                >
                  <Text style={[styles.navButtonText, styles.signOutButtonText]}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.navButton, { backgroundColor: colors.tertiary, borderColor: colors.border }]} 
                  onPress={onSignIn}
                >
                  <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navButton, styles.primaryButton, { borderColor: colors.buttonPrimary }]} 
                  onPress={onSignUp}
                >
                  <Text style={[styles.navButtonText, styles.primaryButtonText]}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Building Dreams, One Home at a Time</Text>
          </View>
        </Animated.View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  slogan: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'normal',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  userInfo: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  profileHint: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
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
    fontSize: 12,
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
  accountSection: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  spacing: {
    height: 20,
  },
  themeSection: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  spacer: {
    width: 32,
  },
  overlayTouchable: {
    flex: 1,
  },
  overlaySpacer: {
    flex: 1,
  },
});

export default SideNav; 