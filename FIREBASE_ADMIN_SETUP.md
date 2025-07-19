# Firebase Admin SDK Setup for Agent Request Management

This guide explains how to set up Firebase Admin SDK to securely handle agent account requests.

## Overview

The agent request management system uses Firebase Admin SDK on the backend to:
- Securely create Firebase Auth users
- Create Firestore user documents with proper roles
- Handle agent request approvals/rejections
- Ensure passwords are never stored permanently

## Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up
2. **Node.js Backend**: The backend server must be running
3. **Firebase Admin SDK**: Service account key file

## Step 1: Generate Firebase Admin SDK Service Account Key

### 1.1 Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`roofroot-2bdfb`)

### 1.2 Create Service Account
1. Go to **Project Settings** (gear icon)
2. Click on the **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file

### 1.3 Configure Service Account Key
1. Rename the downloaded file to `firebase-admin-key.json`
2. Place it in the `backend/` directory
3. Update the file with your actual project details:

```json
{
  "type": "service_account",
  "project_id": "roofroot-2bdfb",
  "private_key_id": "your-actual-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nyour-actual-private-key\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@roofroot-2bdfb.iam.gserviceaccount.com",
  "client_id": "your-actual-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40roofroot-2bdfb.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## Step 2: Install Backend Dependencies

Navigate to the backend directory and install required packages:

```bash
cd backend
npm install firebase-admin
```

## Step 3: Configure Firestore Security Rules

Update your Firestore security rules to allow agent request management:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anyone (public) to read all listings
    match /listings/{listingId} {
      allow read: if true;
      // Allow agents to write their own listings, admins to write all listings
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent' && 
         resource.data.agentId == request.auth.uid)
      );
    }
    
    // Allow authenticated users to read all images
    match /images/{imageId} {
      allow read: if request.auth != null;
      // Only allow admin users to write images
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow agent requests collection - only admins can write, authenticated users can read
    match /agentRequests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 4: Start the Backend Server

```bash
cd backend
node server.js
```

The server should start on port 3000 with the following endpoints:

- `GET /health` - Health check
- `POST /api/agent-requests/approve` - Approve agent request
- `POST /api/agent-requests/reject` - Reject agent request
- `POST /api/upload-images` - Upload listing images

## Step 5: Test the Setup

### 5.1 Test Backend Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "firebase": "initialized"
}
```

### 5.2 Test Agent Request Approval
```bash
curl -X POST http://localhost:3000/api/agent-requests/approve \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-request-id",
    "adminUid": "admin-user-uid"
  }'
```

## Security Features

### 1. **Secure User Creation**
- Uses Firebase Admin SDK for secure user creation
- Passwords are never stored permanently
- Admin authentication required for all operations

### 2. **Error Handling**
- Comprehensive error handling for all operations
- Graceful failure handling
- Detailed error messages for debugging

### 3. **Admin Authorization**
- All operations require admin privileges
- User authentication verified before operations
- Request validation and sanitization

### 4. **Data Integrity**
- Atomic operations where possible
- Rollback capabilities for failed operations
- Audit trail for all admin actions

## API Endpoints

### Approve Agent Request
```http
POST /api/agent-requests/approve
Content-Type: application/json

{
  "requestId": "agent-request-id",
  "adminUid": "admin-user-uid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent account created successfully for John Doe",
  "userUid": "created-user-uid",
  "email": "john@example.com"
}
```

### Reject Agent Request
```http
POST /api/agent-requests/reject
Content-Type: application/json

{
  "requestId": "agent-request-id",
  "adminUid": "admin-user-uid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent request for John Doe has been rejected",
  "email": "john@example.com"
}
```

## Troubleshooting

### Common Issues

1. **"Service account key not found"**
   - Ensure `firebase-admin-key.json` is in the backend directory
   - Verify the file contains valid JSON

2. **"Firebase not initialized"**
   - Check that the service account key is valid
   - Verify the project ID matches your Firebase project

3. **"Permission denied"**
   - Ensure the service account has proper permissions
   - Check Firestore security rules

4. **"User already exists"**
   - The system prevents duplicate user creation
   - Check if the email is already registered

### Debug Logging

The backend includes comprehensive logging:

```
🚀 Approving agent request: request-id-123
📋 Agent request data: { name: "John Doe", email: "john@example.com", ... }
✅ Firebase Auth user created: user-uid-456
✅ Firestore user document created
✅ Agent request status updated to approved
```

## Production Deployment

### 1. **Environment Variables**
Set up environment variables for production:

```bash
export FIREBASE_PROJECT_ID="roofroot-2bdfb"
export FIREBASE_STORAGE_BUCKET="roofroot-2bdfb.firebasestorage.app"
export PORT=3000
```

### 2. **Service Account Security**
- Never commit service account keys to version control
- Use environment variables or secure key management
- Rotate keys regularly

### 3. **Monitoring**
- Set up logging and monitoring
- Monitor API usage and errors
- Set up alerts for failed operations

## Next Steps

1. **Test the complete flow**:
   - Submit an agent request
   - Approve/reject as admin
   - Verify user creation

2. **Monitor and optimize**:
   - Check server logs
   - Monitor Firebase usage
   - Optimize performance as needed

3. **Security audit**:
   - Review access patterns
   - Verify admin permissions
   - Test error scenarios 