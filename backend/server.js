const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK (with error handling)
let admin = null;
let firebaseInitialized = false;

try {
  const serviceAccount = require('./firebase-admin-key.json');
  
  // Check if the service account has placeholder values
  if (serviceAccount.private_key_id === 'YOUR_PRIVATE_KEY_ID' || 
      serviceAccount.private_key === '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n') {
    console.log('⚠️  Firebase Admin SDK not properly configured - using placeholder values');
    console.log('📝 Please update firebase-admin-key.json with real values from Firebase Console');
    firebaseInitialized = false;
  } else {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'roofroot-2bdfb.firebasestorage.app'
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  console.log('📝 Please ensure firebase-admin-key.json exists and contains valid credentials');
  firebaseInitialized = false;
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: './google-cloud-key.json',
  projectId: 'roofroot-2bdfb',
});

const bucket = storage.bucket('roofroot-2bdfb.firebasestorage.app');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'RoofRoot Backend API is running!',
    firebaseInitialized: firebaseInitialized
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    firebase: firebaseInitialized ? 'initialized' : 'not configured'
  });
});

// Agent Request Management Endpoints
app.post('/api/agent-requests/approve', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK not configured. Please set up firebase-admin-key.json with real credentials.'
    });
  }

  try {
    const { requestId, adminUid } = req.body;
    
    if (!requestId || !adminUid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request ID and admin UID are required' 
      });
    }

    console.log(`🔍 Processing agent request approval for request ID: ${requestId}`);

    // Get the agent request from Firestore
    const db = admin.firestore();
    const requestDoc = await db.collection('agentRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent request not found' 
      });
    }

    const requestData = requestDoc.data();
    console.log('📋 Agent request data:', {
      name: requestData.name,
      email: requestData.email,
      agency: requestData.agency,
      status: requestData.status
    });

    // Verify admin permissions
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: Admin privileges required' 
      });
    }

    // Check if user already exists in Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(requestData.email);
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists in Firebase Authentication' 
      });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User doesn't exist, proceed with creation
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: requestData.email,
      password: requestData.password,
      displayName: requestData.name,
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name: requestData.name,
      email: requestData.email,
      role: 'agent',
      agency: requestData.agency,
      phone: requestData.phone || null,
      companyDescription: requestData.companyDescription || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: adminUid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Firestore user document created');

    // Update agent request status and then delete the document
    await db.collection('agentRequests').doc(requestId).update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: adminUid,
      authUid: userRecord.uid,
    });

    console.log('✅ Agent request status updated to approved');

    // Delete the agent request document after successful approval
    await db.collection('agentRequests').doc(requestId).delete();
    console.log('🗑️  Agent request document deleted from collection');

    res.json({
      success: true,
      message: `Agent account created successfully for ${requestData.name}`,
      userUid: userRecord.uid,
      email: requestData.email
    });

  } catch (error) {
    console.error('❌ Error approving agent request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to approve agent request' 
    });
  }
});

app.post('/api/agent-requests/reject', async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK not configured. Please set up firebase-admin-key.json with real credentials.'
    });
  }

  try {
    const { requestId, adminUid } = req.body;
    
    if (!requestId || !adminUid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Request ID and admin UID are required' 
      });
    }

    console.log(`🔍 Processing agent request rejection for request ID: ${requestId}`);

    // Get the agent request from Firestore
    const db = admin.firestore();
    const requestDoc = await db.collection('agentRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent request not found' 
      });
    }

    const requestData = requestDoc.data();
    console.log('📋 Agent request data:', {
      name: requestData.name,
      email: requestData.email,
      agency: requestData.agency,
      status: requestData.status
    });

    // Verify admin permissions
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: Admin privileges required' 
      });
    }

    // Update agent request status to rejected and then delete the document
    await db.collection('agentRequests').doc(requestId).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: adminUid,
    });

    console.log('✅ Agent request status updated to rejected');

    // Delete the agent request document after rejection
    await db.collection('agentRequests').doc(requestId).delete();
    console.log('🗑️  Agent request document deleted from collection');

    res.json({
      success: true,
      message: `Agent request for ${requestData.name} has been rejected`,
      email: requestData.email
    });

  } catch (error) {
    console.error('❌ Error rejecting agent request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to reject agent request' 
    });
  }
});

// Image upload endpoint
app.post('/api/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const uploadedUrls = [];
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        const fileName = `listings/${Date.now()}-${index}-${file.originalname}`;
        const fileBuffer = file.buffer;
        
        const fileUpload = bucket.file(fileName);
        await fileUpload.save(fileBuffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });

        // Make the file publicly accessible
        await fileUpload.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        uploadedUrls.push(publicUrl);
        
        console.log(`✅ Image uploaded: ${fileName}`);
        return publicUrl;
      } catch (error) {
        console.error(`❌ Error uploading image ${index}:`, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
    
    res.json({ 
      success: true, 
      urls: uploadedUrls,
      message: `${uploadedUrls.length} images uploaded successfully` 
    });
  } catch (error) {
    console.error('❌ Error in image upload:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload images' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RoofRoot Backend Server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔧 Firebase Admin SDK: ${firebaseInitialized ? '✅ Initialized' : '❌ Not configured'}`);
  
  if (!firebaseInitialized) {
    console.log('');
    console.log('📝 To enable agent request management:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Generate new private key');
    console.log('3. Save as firebase-admin-key.json in the backend directory');
    console.log('4. Restart the server');
    console.log('');
  }
}); 