import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { authService } from '../firebase';
import { UserData } from '../firebase';
import { useTheme } from '../context/ThemeContext';

interface SignInScreenProps {
  onSignInSuccess?: () => void;
  onBack?: () => void;
  onLogin?: (userData: UserData) => void;
  navigation?: any;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onSignInSuccess, onBack, onLogin, navigation }) => {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Check if we have user data
      if (result.userData) {
        // Call onLogin with user data to update app state
        onLogin?.(result.userData);
        return;
      }
      
      // Fallback: try to get user data manually
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        if (userData) {
          onLogin?.(userData);
          return;
        }
      }
      
      // If we still don't have user data, show success but don't update state
      Alert.alert('Sign in successful!', 'Welcome back!');
      onSignInSuccess?.();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      Alert.alert('Sign in failed', errorMessage);
      
      // If user not found, suggest signing up
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'Account Not Found',
          'Would you like to create a new account?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => onBack?.() }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header with Title, Subtitle and Close Button */}
      <View style={[styles.headerContainer, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Sign in to your RoofRoot account</Text>
        </View>
        <TouchableOpacity 
          style={[styles.closeButton, { backgroundColor: colors.tertiary }]} 
          onPress={() => navigation?.navigate('CustomerHome')}
        >
          <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.formContainer, { backgroundColor: colors.secondary }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.primary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.primary, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.buttonPrimary }, loading && styles.buttonDisabled]} 
              onPress={handleSignIn} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeButton: {
    padding: 16,
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignInScreen; 