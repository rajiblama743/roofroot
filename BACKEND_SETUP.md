# Backend Setup Guide

## Overview

The RoofRoot backend is a Node.js/Express server that handles file uploads, image management, and provides API endpoints for the React Native mobile app.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Google Cloud Storage
- Create a `service-account-key.json` file in the `backend/` directory
- This file should contain your Google Cloud service account credentials

### 3. Start the Server
```bash
npm start
```

The server will start on port 3000 and automatically detect your computer's IP address.

## 🔧 Automatic IP Detection Architecture

### How It Works

The backend server automatically detects and exposes its IP address, eliminating the need for manual IP configuration:

1. **Server IP Detection**: When the server starts, it automatically detects the computer's network IP address
2. **API Endpoint**: The server exposes a `/server-info` endpoint that returns the detected IP
3. **Client Auto-Discovery**: The React Native app automatically fetches this IP on startup
4. **Fallback System**: If auto-detection fails, the app falls back to hardcoded IPs

### Server Endpoints

#### GET `/server-info`
Returns the server's network information:
```json
{
  "serverIP": "192.168.1.100",
  "port": 3000,
  "fullUrl": "http://192.168.1.100:3000",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "platform": "darwin",
  "hostname": "your-computer-name"
}
```

#### GET `/health`
Health check endpoint for connectivity testing.

#### GET `/ping`
Simple ping endpoint for debugging.

### File Upload Endpoints

#### POST `/upload-image`
Uploads an image to Google Cloud Storage.

**Request:**
- `file`: Image file (multipart/form-data)
- `filename`: Optional custom filename

**Response:**
```json
{
  "success": true,
  "filename": "image-1234567890.jpg",
  "downloadUrl": "https://storage.googleapis.com/..."
}
```

#### POST `/get-signed-url`
Generates signed URLs for direct upload to Google Cloud Storage.

#### POST `/get-download-url`
Generates signed download URLs for images.

#### DELETE `/delete-image`
Deletes an image from Google Cloud Storage.

## 🌐 Network Configuration

### Device-Specific URLs

The system automatically uses the correct URL based on device type:

| Device Type | URL | Description |
|-------------|-----|-------------|
| iOS Simulator | `localhost:3000` | Direct localhost connection |
| iOS Physical | Auto-detected IP | Fetched from server on startup |
| Android Emulator | `10.0.2.2:3000` | Android emulator localhost |
| Android Physical | Auto-detected IP | Fetched from server on startup |

### Network Requirements

- **Same WiFi Network**: Both computer and mobile device must be on the same WiFi network
- **Port 3000**: Ensure port 3000 is not blocked by firewall
- **Backend Running**: Server must be started before testing connectivity

## 🔍 Troubleshooting

### Find Your Computer's IP Address

Run the helper script:
```bash
./find-ip.sh
```

Or manually:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### Common Issues

1. **Connection Refused**
   - Ensure backend server is running: `cd backend && npm start`
   - Check if port 3000 is available

2. **Cannot Reach Server**
   - Verify both devices are on same WiFi network
   - Check firewall settings
   - Try the BackendTest component in the app

3. **Auto-Detection Fails**
   - The app will fall back to hardcoded IP addresses
   - Check console logs for detailed error messages

## 📱 Testing Connectivity

Use the BackendTest component in the React Native app to:
- View detected device type and API URL
- Test backend connectivity
- See detailed error information
- Verify auto-detection is working

## 🔄 Development Workflow

1. **Start Backend**: `cd backend && npm start`
2. **Run App**: `npx react-native run-ios` or `npx react-native run-android`
3. **Auto-Detection**: App automatically detects server IP on startup
4. **Test**: Use BackendTest component to verify connectivity

## 🚀 Production Deployment

For production, the app uses hardcoded URLs:
- Update `apiConfig.ts` with your production backend URL
- Deploy backend to your preferred hosting service
- Update CORS settings for production domains 