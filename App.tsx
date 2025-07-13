/**
 * RoofRoot React Native App
 * Real Estate Platform
 */

import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import SignUpScreen from './src/screens/SignUpScreen';
import SignInScreen from './src/screens/SignInScreen';
import CustomerHomePage from './src/screens/CustomerHomePage';
import AdminHomePage from './src/screens/AdminHomePage';
import ListingDetailsScreen from './src/screens/ListingDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SideNav from './src/components/SideNav';
import { authService, UserData } from './src/firebase';
import 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AppHeader from './src/components/AppHeader';
import { ThemeProvider } from './src/context/ThemeContext';
import { initializeApiUrl } from './src/config/apiConfig';

const Stack = createStackNavigator();

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Progressive loading: Show app immediately with cached IP
      console.log('🚀 Starting app with progressive loading...');
      
      // Set loading to false immediately to show the app
      setLoading(false);
      
      // Run IP detection in background (non-blocking)
      console.log('🔄 Starting background IP detection...');
      initializeApiUrl().then(newApiUrl => {
        console.log('✅ Background IP detection completed:', newApiUrl);
      }).catch(error => {
        console.error('❌ Background IP detection failed:', error);
      });
      
      // Check auth state (also non-blocking since app is already shown)
      await checkAuthState();
    } catch (error) {
      console.error('Error in app initialization:', error);
      // App is already shown, just log the error
    }
  };

  const checkAuthState = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await authService.getUserData(currentUser.uid);
        if (userData) {
          setUserData(userData);
        } else {
          // User exists in Auth but not in Firestore - this shouldn't happen with our new logic
          // but we'll handle it gracefully
          console.warn('User exists in Auth but not in Firestore');
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (navigation: any) => {
    try {
      await authService.signOut();
      setUserData(null);
      navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] });
    } catch (error) {
      // If the error is about no current user, this is expected when user is deleted
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/no-current-user') {
        // User is already deleted, just reset the state and navigate
        setUserData(null);
        navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] });
        return;
      }
      console.error('Error signing out:', error);
    }
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
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <AppHeader onMenuPress={() => setSideNavVisible(true)} userName={userData?.name} />
        <Stack.Navigator
          initialRouteName={userData?.role === 'admin' ? 'AdminHome' : 'CustomerHome'}
          screenOptions={{
            headerShown: false,
            // Performance optimizations for smooth transitions
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            }),
            // Optimize transition timing
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 300,
                  easing: require('react-native').Easing.out(require('react-native').Easing.cubic),
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 300,
                  easing: require('react-native').Easing.in(require('react-native').Easing.cubic),
                },
              },
            },
          }}
        >
        <Stack.Screen name="SignIn">
          {props => <SignInScreen {...props} onLogin={userData => {
            setUserData(userData);
            if (userData.role === 'admin') {
              navigationRef.current?.reset({ index: 0, routes: [{ name: 'AdminHome' as never }] });
            } else {
              navigationRef.current?.reset({ index: 0, routes: [{ name: 'CustomerHome' as never }] });
            }
          }} />}
        </Stack.Screen>
        <Stack.Screen name="SignUp">
          {props => <SignUpScreen {...props} onSignUpSuccess={() => {
            // After successful signup, check auth state to get user data
            checkAuthState();
            props.navigation.replace('CustomerHome');
          }} />}
        </Stack.Screen>
        <Stack.Screen name="CustomerHome">
          {props => <CustomerHomePage {...props} onListingDetails={listing => {
            setSelectedListing(listing);
            props.navigation.navigate('ListingDetails');
          }} />}
        </Stack.Screen>
        <Stack.Screen name="AdminHome">
          {props => <AdminHomePage {...props} onListingDetails={listing => {
            setSelectedListing(listing);
            props.navigation.navigate('ListingDetails');
          }} />}
        </Stack.Screen>
        <Stack.Screen name="ListingDetails">
          {props => <ListingDetailsScreen {...props} listing={selectedListing} onImageRemoved={() => {
            // Refresh the listing data when an image is removed
            if (selectedListing) {
              // This will trigger a re-render with updated listing data
              setSelectedListing({ ...selectedListing });
            }
          }} />}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {props => userData ? <ProfileScreen {...props} user={userData} onSignOut={() => handleSignOut(props.navigation)} onBack={() => {
            setUserData(null);
            props.navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] });
          }} /> : null}
        </Stack.Screen>
              </Stack.Navigator>
        <SideNav
          visible={sideNavVisible}
          onClose={() => setSideNavVisible(false)}
          onSignIn={() => {
            setSideNavVisible(false);
            navigationRef.current?.navigate('SignIn' as never);
          }}
          onSignUp={() => {
            setSideNavVisible(false);
            navigationRef.current?.navigate('SignUp' as never);
          }}
          onSignOut={() => {
            setSideNavVisible(false);
            authService.signOut().then(() => {
              setUserData(null);
              navigationRef.current?.reset({ index: 0, routes: [{ name: 'CustomerHome' as never }] });
            }).catch((error) => {
              // If the error is about no current user, this is expected when user is deleted
              if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/no-current-user') {
                // User is already deleted, just reset the state and navigate
                setUserData(null);
                navigationRef.current?.reset({ index: 0, routes: [{ name: 'CustomerHome' as never }] });
                return;
              }
              console.error('Error signing out:', error);
            });
          }}
          onProfile={() => {
            setSideNavVisible(false);
            navigationRef.current?.navigate('Profile' as never);
          }}
          isLoggedIn={!!userData}
          userName={userData?.name}
          userRole={userData?.role}
        />
      </NavigationContainer>
    </ThemeProvider>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
  },
  screenTitleContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
});

export default App;
