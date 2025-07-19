# Debugging Agent Request Approval Issues

## 🚨 Issue: "JSON Parse error: Unexpected character: <"

This error occurs when the backend server returns HTML instead of JSON, typically indicating:
1. **Backend server is not running**
2. **API endpoint doesn't exist**
3. **Server error returning HTML error page**
4. **Incorrect URL configuration**

## 🔍 Step-by-Step Debugging

### Step 1: Verify Backend Server is Running

1. **Check if backend is running:**
   ```bash
   cd backend
   node server.js
   ```

2. **Expected output:**
   ```
   🚀 RoofRoot Backend Server running on port 3000
   📊 Health check available at: http://localhost:3000/health
   ```

3. **Test backend health:**
   ```bash
   curl http://localhost:3000/health
   ```

   **Expected response:**
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "firebase": "initialized"
   }
   ```

### Step 2: Test Backend Endpoints

Run the test script to verify all endpoints:

```bash
node test-backend-endpoints.js
```

This will test:
- `/health` endpoint
- `/` root endpoint
- `/api/agent-requests/approve` endpoint
- `/api/agent-requests/reject` endpoint

### Step 3: Check API Configuration

1. **Verify API Base URL in the app:**
   ```typescript
   // Check the console logs for:
   console.log('📍 API Base URL:', API_BASE_URL);
   ```

2. **Expected URLs by platform:**
   - **Android Emulator**: `http://10.0.2.2:3000`
   - **iOS Simulator**: `http://localhost:3000`
   - **Physical Devices**: `http://192.168.0.249:3000`

3. **Test the URL manually:**
   ```bash
   # For Android emulator
   curl http://10.0.2.2:3000/health
   
   # For iOS simulator
   curl http://localhost:3000/health
   
   # For physical devices
   curl http://192.168.0.249:3000/health
   ```

### Step 4: Check Firebase Admin SDK Setup

1. **Verify Firebase Admin key exists:**
   ```bash
   ls backend/firebase-admin-key.json
   ```

2. **Check if the key is valid:**
   ```bash
   node backend/test-agent-requests.js
   ```

3. **Expected output:**
   ```
   🧪 Testing agent request management...
   ✅ Test agent request created with ID: ...
   ✅ Test user created in Firebase Auth: ...
   ✅ Test user document created in Firestore
   ✅ Test agent request status updated to approved
   🎉 All tests completed successfully!
   ```

### Step 5: Enhanced Error Logging

The updated admin service now provides detailed logging:

```
🚀 Approving agent request: request-id-123
📍 API Base URL: http://10.0.2.2:3000
📤 Request body: { requestId: "request-id-123", adminUid: "admin-uid" }
🌐 Making request to: http://10.0.2.2:3000/api/agent-requests/approve
📡 Response status: 200
📡 Response headers: { "content-type": "application/json" }
📄 Response text: {"success":true,"message":"Agent account created..."}
✅ Agent request approved successfully
```

## 🔧 Common Issues and Solutions

### Issue 1: "Backend server is not running"

**Symptoms:**
- Network error in console
- Cannot connect to backend

**Solution:**
```bash
cd backend
npm install  # Install dependencies if needed
node server.js
```

### Issue 2: "Firebase Admin SDK not initialized"

**Symptoms:**
- Server starts but Firebase operations fail
- Error: "Service account key not found"

**Solution:**
1. Generate Firebase Admin SDK key from Firebase Console
2. Save as `backend/firebase-admin-key.json`
3. Restart the server

### Issue 3: "Wrong API URL"

**Symptoms:**
- HTML response instead of JSON
- Network timeout errors

**Solution:**
1. Check the platform-specific URL in console logs
2. Update `src/config/apiConfig.ts` if needed
3. Restart the React Native app

### Issue 4: "CORS errors"

**Symptoms:**
- Browser console shows CORS errors
- Network requests blocked

**Solution:**
The backend already has CORS configured, but verify:
```javascript
// In backend/server.js
app.use(cors());
```

### Issue 5: "Firebase project not configured"

**Symptoms:**
- Firebase initialization errors
- "Project not found" errors

**Solution:**
1. Verify Firebase project ID in `backend/server.js`
2. Check service account has proper permissions
3. Ensure Firebase project exists and is accessible

## 🧪 Testing the Complete Flow

### 1. Test Backend Health
```bash
curl http://localhost:3000/health
```

### 2. Test Agent Request Creation
```bash
# Create a test agent request
curl -X POST http://localhost:3000/api/agent-requests/approve \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-request-id",
    "adminUid": "test-admin-uid"
  }'
```

### 3. Test from React Native App
1. Submit an agent request through the app
2. Try to approve it as admin
3. Check console logs for detailed error information

## 📱 React Native App Debugging

### 1. Add Debug Component
Temporarily add the `PlatformTest` component to see the current API URL:

```typescript
import PlatformTest from '../components/PlatformTest';

// In your screen
<PlatformTest />
```

### 2. Check Console Logs
Look for these log messages:
```
🚀 Approving agent request: request-id
📍 API Base URL: http://10.0.2.2:3000
📤 Request body: { requestId: "...", adminUid: "..." }
🌐 Making request to: http://10.0.2.2:3000/api/agent-requests/approve
📡 Response status: 200
📄 Response text: {"success":true,...}
```

### 3. Test Network Connectivity
Use the `BackendTest` component to test connectivity:

```typescript
import BackendTest from '../components/BackendTest';

// In your screen
<BackendTest />
```

## 🔄 Troubleshooting Checklist

- [ ] Backend server is running on port 3000
- [ ] Firebase Admin SDK key exists and is valid
- [ ] API URL is correct for your platform
- [ ] Network connectivity between app and backend
- [ ] Firebase project is properly configured
- [ ] Agent request exists in Firestore
- [ ] Admin user is authenticated
- [ ] No CORS issues
- [ ] No firewall blocking port 3000

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the console logs** for detailed error messages
2. **Run the test scripts** to verify each component
3. **Verify network connectivity** between app and backend
4. **Check Firebase Console** for any authentication issues
5. **Review the backend logs** for server-side errors

The enhanced error logging will now provide much more detailed information about what's going wrong, making it easier to identify and fix the issue. 