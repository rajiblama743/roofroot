# Backend Connectivity Debugging Guide

## 🚨 Issue: "Backend server is not running" Error

Even though the backend server is running on `http://localhost:3000`, the React Native app can't connect to it.

## 🔍 Root Cause Analysis

### 1. **Network Configuration Issue**
- React Native apps running on physical devices or simulators can't access `localhost`
- They need to use your computer's **local IP address** (e.g., `192.168.0.249`)
- The app is configured to use `http://192.168.0.249:3000` for iOS devices

### 2. **Platform-Specific URLs**
- **Android Emulator**: `http://10.0.2.2:3000` (special Android emulator address)
- **iOS Simulator**: `http://192.168.0.249:3000` (your computer's IP)
- **Physical Devices**: `http://192.168.0.249:3000` (your computer's IP)

## 🛠️ Debugging Steps

### Step 1: Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check if backend is accessible from IP
curl http://192.168.0.249:3000/health
```

### Step 2: Test from React Native App
1. **Add the BackendTest component** to your app temporarily
2. **Run the connectivity test** to see detailed logs
3. **Check the console output** for specific error messages

### Step 3: Check Network Configuration
```bash
# Find your computer's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test if your device can reach the backend
ping 192.168.0.249
```

## 🔧 Solutions

### Solution 1: Update IP Address (if needed)
If your computer's IP address is different from `192.168.0.249`, update it in:
```typescript
// src/firebase/googleCloudStorage.ts
const getApiBaseUrl = () => {
  // ... existing code ...
  return 'http://YOUR_ACTUAL_IP:3000'; // Update this
};
```

### Solution 2: Use the BackendTest Component
1. Import the BackendTest component in your app
2. Add it to a screen temporarily
3. Run the test to see detailed connectivity information

### Solution 3: Check Firewall/Network Settings
- Ensure your computer's firewall allows connections on port 3000
- Make sure your device and computer are on the same network
- Try disabling firewall temporarily for testing

## 📱 Testing the Fix

### Option 1: Use BackendTest Component
```typescript
import BackendTest from './src/components/BackendTest';

// Add to your screen temporarily
<BackendTest />
```

### Option 2: Check Console Logs
Look for these log messages in your React Native console:
- `🔍 Checking backend connectivity...`
- `📍 URLs to try: [...]`
- `✅ Backend health check successful for [URL]`
- `❌ Backend connectivity check failed for [URL]`

## 🎯 Expected Behavior

### Successful Connection:
```
🔍 Checking backend connectivity...
📍 URLs to try: ["http://192.168.0.249:3000", "http://localhost:3000", "http://127.0.0.1:3000"]
🔍 Trying URL: http://192.168.0.249:3000
📡 Response status for http://192.168.0.249:3000: 200
✅ Backend health check successful for http://192.168.0.249:3000
```

### Failed Connection:
```
🔍 Checking backend connectivity...
📍 URLs to try: ["http://192.168.0.249:3000", "http://localhost:3000", "http://127.0.0.1:3000"]
🔍 Trying URL: http://192.168.0.249:3000
❌ Backend connectivity check failed for http://192.168.0.249:3000
❌ All backend connectivity attempts failed
```

## 🚀 Quick Fix

If you're still having issues:

1. **Restart the backend server**:
   ```bash
   cd backend && npm start
   ```

2. **Check your IP address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Update the IP in the code** if it's different from `192.168.0.249`

4. **Test the connection** using the BackendTest component

## 📞 Common Issues

### Issue: "Network request failed"
- **Cause**: Device can't reach the backend IP
- **Solution**: Check if IP address is correct and device is on same network

### Issue: "Connection refused"
- **Cause**: Backend server not running or wrong port
- **Solution**: Start backend server with `cd backend && npm start`

### Issue: "Timeout"
- **Cause**: Network latency or firewall blocking
- **Solution**: Check firewall settings and network configuration 