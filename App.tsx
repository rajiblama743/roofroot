/**
 * RoofRoot React Native App
 * Real Estate Platform
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import SignUpScreen from './src/screens/SignUpScreen';
import SignInScreen from './src/screens/SignInScreen';
import CustomerHomePage from './src/screens/CustomerHomePage';
import AdminHomePage from './src/screens/AdminHomePage';
import SideNav from './src/components/SideNav';
import { authService, UserData } from './src/firebase';

type ScreenType = 'customer' | 'admin' | 'signup' | 'signin';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('customer');
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        if (userData) {
          setUserData(userData);
          // Route based on user role
          setCurrentScreen(userData.role === 'admin' ? 'admin' : 'customer');
        } else {
          setCurrentScreen('customer');
        }
      } else {
        setCurrentScreen('customer');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setCurrentScreen('customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSuccess = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userData = await authService.getUserData(currentUser.uid);
      if (userData) {
        setUserData(userData);
        setCurrentScreen(userData.role === 'admin' ? 'admin' : 'customer');
      }
    }
  };

  const handleSignUpSuccess = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userData = await authService.getUserData(currentUser.uid);
      if (userData) {
        setUserData(userData);
        setCurrentScreen('customer'); // New users are always customers
      }
    }
  };

  const handleBackFromAuth = () => {
    setCurrentScreen('customer');
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUserData(null);
      setCurrentScreen('customer');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'signup':
        return <SignUpScreen onSignUpSuccess={handleSignUpSuccess} onBack={handleBackFromAuth} />;
      case 'signin':
        return <SignInScreen onSignInSuccess={handleSignInSuccess} onBack={handleBackFromAuth} />;
      case 'admin':
        return <AdminHomePage />;
      case 'customer':
      default:
        return <CustomerHomePage />;
    }
  };

  const renderHeader = () => {
    if (currentScreen === 'signup' || currentScreen === 'signin') {
      return null; // Don't show header on auth screens
    }

    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setSideNavVisible(true)}
        >
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>RoofRoot</Text>
          {userData && (
            <Text style={styles.userInfo}>
              {userData.name}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderCurrentScreen()}
      
      <SideNav
        visible={sideNavVisible}
        onClose={() => setSideNavVisible(false)}
        onSignIn={() => {
          setSideNavVisible(false);
          setCurrentScreen('signin');
        }}
        onSignUp={() => {
          setSideNavVisible(false);
          setCurrentScreen('signup');
        }}
        onSignOut={handleSignOut}
        isLoggedIn={!!userData}
        userName={userData?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  userInfo: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default App;
