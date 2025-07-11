import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../config/apiConfig';

const PlatformTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testPlatformConfiguration = async () => {
    try {
      console.log('🧪 Testing platform-specific configuration...');
      console.log('🌐 Platform:', Platform.OS);
      console.log('📍 API Base URL:', API_BASE_URL);
      
      // Test the backend connectivity
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        const result = `✅ Platform: ${Platform.OS}\n📍 URL: ${API_BASE_URL}\n📡 Status: ${data.status}`;
        setTestResult(result);
        Alert.alert('✅ Success', `Backend is accessible!\n\nPlatform: ${Platform.OS}\nURL: ${API_BASE_URL}`);
      } else {
        const result = `❌ Platform: ${Platform.OS}\n📍 URL: ${API_BASE_URL}\n📡 Status: ${response.status}`;
        setTestResult(result);
        Alert.alert('❌ Failed', `Backend not accessible.\n\nPlatform: ${Platform.OS}\nURL: ${API_BASE_URL}\nStatus: ${response.status}`);
      }
    } catch (error) {
      const result = `❌ Platform: ${Platform.OS}\n📍 URL: ${API_BASE_URL}\n💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setTestResult(result);
      Alert.alert('❌ Error', `Connection failed.\n\nPlatform: ${Platform.OS}\nURL: ${API_BASE_URL}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Platform Configuration Test</Text>
      <Text style={styles.subtitle}>Testing platform-specific API URLs</Text>
      
      <TouchableOpacity style={styles.button} onPress={testPlatformConfiguration}>
        <Text style={styles.buttonText}>Test Configuration</Text>
      </TouchableOpacity>
      
      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Test Result:</Text>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Expected URLs:</Text>
        <Text style={styles.infoText}>• Android: http://10.0.2.2:3000</Text>
        <Text style={styles.infoText}>• iOS: http://192.168.0.249:3000</Text>
        <Text style={styles.infoText}>• Current Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>• Current URL: {API_BASE_URL}</Text>
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
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default PlatformTest; 