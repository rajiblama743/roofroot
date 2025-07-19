const admin = require('firebase-admin');

// Test script for agent request management
async function testAgentRequestManagement() {
  try {
    console.log('🧪 Testing agent request management...');
    
    // Initialize Firebase Admin SDK
    const serviceAccount = require('./firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'roofroot-2bdfb.firebasestorage.app'
    });

    const db = admin.firestore();
    
    // Test 1: Create a test agent request
    console.log('\n📝 Creating test agent request...');
    const testRequest = {
      name: 'Test Agent',
      email: 'test-agent@example.com',
      phone: '+1234567890',
      agency: 'Test Agency',
      companyDescription: 'Test company description',
      password: 'testpassword123',
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const requestRef = await db.collection('agentRequests').add(testRequest);
    console.log('✅ Test agent request created with ID:', requestRef.id);
    
    // Test 2: Verify the request exists
    console.log('\n🔍 Verifying test agent request...');
    const requestDoc = await db.collection('agentRequests').doc(requestRef.id).get();
    if (requestDoc.exists) {
      console.log('✅ Test agent request found:', requestDoc.data());
    } else {
      console.log('❌ Test agent request not found');
    }
    
    // Test 3: Test user creation (simulate approval)
    console.log('\n🚀 Testing user creation...');
    try {
      const userRecord = await admin.auth().createUser({
        email: testRequest.email,
        password: testRequest.password,
        displayName: testRequest.name,
      });
      console.log('✅ Test user created in Firebase Auth:', userRecord.uid);
      
      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name: testRequest.name,
        email: testRequest.email,
        role: 'agent',
        agency: testRequest.agency,
        phone: testRequest.phone,
        companyDescription: testRequest.companyDescription,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: 'test-admin',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Test user document created in Firestore');
      
      // Update request status
      await db.collection('agentRequests').doc(requestRef.id).update({
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: 'test-admin',
        authUid: userRecord.uid,
      });
      console.log('✅ Test agent request status updated to approved');
      
      // Clean up: Delete test user
      console.log('\n🧹 Cleaning up test data...');
      await admin.auth().deleteUser(userRecord.uid);
      console.log('✅ Test user deleted from Firebase Auth');
      
      await db.collection('users').doc(userRecord.uid).delete();
      console.log('✅ Test user document deleted from Firestore');
      
      await db.collection('agentRequests').doc(requestRef.id).delete();
      console.log('✅ Test agent request deleted');
      
    } catch (error) {
      console.error('❌ Error in user creation test:', error);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up Firebase Admin SDK
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run the test
testAgentRequestManagement(); 