import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { testBackendConnectivity } from '../firebase/googleCloudStorage';
import { initializeApiUrl, API_BASE_URL } from '../config/apiConfig';

const BackendTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Device detection helpers
  const isSimulator = () => {
    if (Platform.OS === 'ios') {
      return __DEV__ && !require('react-native').NativeModules.RCTDeviceInfo?.isPhysicalDevice;
    }
    if (Platform.OS === 'android') {
      return __DEV__ && require('react-native').NativeModules.RCTDeviceInfo?.isEmulator;
    }
    return false;
  };

  const getDeviceInfo = () => {
    const deviceType = isSimulator() ? 'Simulator/Emulator' : 'Physical Device';
    return {
      platform: Platform.OS,
      deviceType,
      apiUrl: currentApiUrl || API_BASE_URL,
    };
  };

  // Initialize API URL on component mount
  useEffect(() => {
    const initApi = async () => {
      try {
        setIsInitializing(true);
        const apiUrl = await initializeApiUrl();
        setCurrentApiUrl(apiUrl);
        console.log('✅ API URL initialized:', apiUrl);
      } catch (error) {
        console.error('Failed to initialize API URL:', error);
        setCurrentApiUrl(API_BASE_URL);
      } finally {
        setIsInitializing(false);
      }
    };

    initApi();
  }, []);

  const runConnectivityTest = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Starting backend connectivity test...');
      const result = await testBackendConnectivity();
      setTestResult(result);
      
      if (result.success) {
        Alert.alert(
          '✅ Backend Test Successful',
          `Backend is accessible!\n\nAPI Base URL: ${result.details.apiBaseUrl}\nPlatform: ${result.details.platform}\nEnvironment: ${result.details.environment}`
        );
      } else {
        Alert.alert(
          '❌ Backend Test Failed',
          `Backend is not accessible.\n\nAPI Base URL: ${result.details.apiBaseUrl}\nError: ${result.details.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Error', 'Failed to run connectivity test');
    } finally {
      setIsLoading(false);
    }
  };

  const deviceInfo = getDeviceInfo();

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Backend Connectivity Test</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔍 Detecting server IP...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connectivity Test</Text>
      
      {/* Device Information */}
      <View style={styles.deviceInfoContainer}>
        <Text style={styles.deviceInfoTitle}>📱 Device Information:</Text>
        <Text style={styles.deviceInfoText}>
          Platform: {deviceInfo.platform.toUpperCase()}{'\n'}
          Device Type: {deviceInfo.deviceType}{'\n'}
          API URL: {deviceInfo.apiUrl}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runConnectivityTest}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Backend Connectivity'}
        </Text>
      </TouchableOpacity>

      {testResult && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {testResult.success ? '✅ Test Results' : '❌ Test Results'}
          </Text>
          <Text style={styles.resultText}>
            {JSON.stringify(testResult.details, null, 2)}
          </Text>
        </ScrollView>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔧 Auto-Detection Features:</Text>
        <Text style={styles.infoText}>
          ✅ Progressive loading (instant startup){'\n'}
          ✅ Smart caching (24-hour cache){'\n'}
          ✅ Parallel requests (2s timeouts){'\n'}
          ✅ Background detection (non-blocking){'\n'}
          ✅ Fallback system (reliable){'\n\n'}
          💡 App starts immediately, IP detection runs in background
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔧 URL Configuration:</Text>
        <Text style={styles.infoText}>
          • iOS Simulator: localhost:3000{'\n'}
          • iOS Physical: Cached IP or auto-detected{'\n'}
          • Android Emulator: 10.0.2.2:3000{'\n'}
          • Android Physical: Cached IP or auto-detected{'\n\n'}
          💡 Cached IPs last 24 hours for instant startup!
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Troubleshooting Tips:</Text>
        <Text style={styles.infoText}>
          • Ensure backend server is running: cd backend && npm start{'\n'}
          • Check if device can reach the backend IP{'\n'}
          • Verify both devices are on same WiFi network{'\n'}
          • Check console logs for detailed error information
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  deviceInfoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32',
  },
  deviceInfoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    maxHeight: 300,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});

export default BackendTest; 