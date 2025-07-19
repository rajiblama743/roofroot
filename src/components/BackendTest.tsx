import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authService } from '../firebase';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const BackendTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFirebaseConnection = async () => {
    try {
      addTestResult('Testing Firebase connection...');
      
      // Test 1: Check if Firebase Auth is initialized
      const currentUser = auth().currentUser;
      addTestResult(`Auth initialized: ${!!currentUser}`);
      
      // Test 2: Check if Firestore is accessible
      try {
        const testDoc = await firestore().collection('test').doc('connection-test').get();
        addTestResult('Firestore connection: OK');
      } catch (error: any) {
        addTestResult(`Firestore error: ${error.code || error.message}`);
      }
      
      // Test 3: Test user document creation (if user is authenticated)
      if (currentUser) {
        try {
          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
          addTestResult(`User document exists: ${userDoc.exists()}`);
        } catch (error: any) {
          addTestResult(`User document error: ${error.code || error.message}`);
        }
      } else {
        addTestResult('No authenticated user');
      }
      
    } catch (error: any) {
      addTestResult(`Connection test failed: ${error.message}`);
    }
  };

  const testDocumentCreation = async () => {
    try {
      addTestResult('Testing document creation...');
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        addTestResult('No authenticated user for document creation test');
        return;
      }
      
      // Test creating a user document
      const testUserData = {
        name: 'Test User',
        email: currentUser.email || 'test@example.com',
        role: 'customer' as const,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      
      await firestore().collection('users').doc(currentUser.uid).set(testUserData);
      addTestResult('Document creation: SUCCESS');
      
    } catch (error: any) {
      addTestResult(`Document creation failed: ${error.code || error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testDocumentCreation}>
        <Text style={styles.buttonText}>Test Document Creation</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
        <Text style={styles.buttonText}>Clear Results</Text>
      </TouchableOpacity>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default BackendTest; 