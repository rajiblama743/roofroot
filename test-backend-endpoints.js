const fetch = require('node-fetch');

// Test script to verify backend endpoints
async function testBackendEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing backend endpoints...');
  console.log('📍 Base URL:', baseUrl);
  
  try {
    // Test 1: Health endpoint
    console.log('\n🔍 Testing /health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log('📡 Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed');
    }
    
    // Test 2: Root endpoint
    console.log('\n🔍 Testing / endpoint...');
    const rootResponse = await fetch(`${baseUrl}/`);
    console.log('📡 Root status:', rootResponse.status);
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Root endpoint working:', rootData);
    } else {
      console.log('❌ Root endpoint failed');
    }
    
    // Test 3: Agent requests approve endpoint (should fail without proper data)
    console.log('\n🔍 Testing /api/agent-requests/approve endpoint...');
    const approveResponse = await fetch(`${baseUrl}/api/agent-requests/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: 'test-request-id',
        adminUid: 'test-admin-uid',
      }),
    });
    
    console.log('📡 Approve status:', approveResponse.status);
    const approveText = await approveResponse.text();
    console.log('📄 Approve response:', approveText);
    
    if (approveResponse.ok) {
      console.log('✅ Approve endpoint working');
    } else {
      console.log('❌ Approve endpoint failed (expected for test data)');
    }
    
    // Test 4: Agent requests reject endpoint (should fail without proper data)
    console.log('\n🔍 Testing /api/agent-requests/reject endpoint...');
    const rejectResponse = await fetch(`${baseUrl}/api/agent-requests/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: 'test-request-id',
        adminUid: 'test-admin-uid',
      }),
    });
    
    console.log('📡 Reject status:', rejectResponse.status);
    const rejectText = await rejectResponse.text();
    console.log('📄 Reject response:', rejectText);
    
    if (rejectResponse.ok) {
      console.log('✅ Reject endpoint working');
    } else {
      console.log('❌ Reject endpoint failed (expected for test data)');
    }
    
    console.log('\n🎉 Backend endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('💡 Make sure the backend server is running on port 3000');
  }
}

// Run the test
testBackendEndpoints(); 