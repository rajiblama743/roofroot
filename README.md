# RoofRoot - Real Estate Platform

A React Native mobile application for real estate management with automatic backend connectivity detection.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment
- Google Cloud Storage account

### 1. Install Dependencies
```bash
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

### 2. Start Backend Server
```bash
cd backend && npm install && npm start
```

### 3. Run the App
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 🔧 Automatic IP Detection

The app features an intelligent automatic IP detection system that eliminates manual configuration:

- **Zero Configuration**: No manual IP updates required
- **Network Agnostic**: Works across different WiFi networks
- **Device Smart**: Automatically detects iOS/Android, Physical/Simulator
- **Fallback System**: Multiple fallback mechanisms ensure connectivity

### How It Works
1. Backend server automatically detects its IP address
2. React Native app fetches the IP on startup
3. App uses the correct URL for each device type
4. Fallback to hardcoded IP if auto-detection fails

## 📱 Device Support

| Device Type | URL | Auto-Detection |
|-------------|-----|----------------|
| iOS Simulator | `localhost:3000` | Not needed |
| iOS Physical | Auto-detected IP | ✅ |
| Android Emulator | `10.0.2.2:3000` | Not needed |
| Android Physical | Auto-detected IP | ✅ |

## 🧪 Testing Connectivity

Use the BackendTest component to:
- View device information and detected API URL
- Test backend connectivity
- Debug network issues
- Verify auto-detection

## 📚 Documentation

- [Backend Setup Guide](./BACKEND_SETUP.md) - Complete backend setup instructions
- [Automatic IP Detection Architecture](./AUTOMATIC_IP_DETECTION_ARCHITECTURE.md) - Detailed architecture documentation
- [Debug Connectivity](./DEBUG_CONNECTIVITY.md) - Network troubleshooting guide
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Production setup guide

## 🛠️ Development

### Project Structure
```
RoofRoot/
├── src/
│   ├── components/     # React Native components
│   ├── screens/        # App screens
│   ├── firebase/       # Firebase configuration
│   ├── config/         # API configuration
│   └── context/        # React context providers
├── backend/            # Node.js/Express server
├── ios/               # iOS native code
└── android/           # Android native code
```

### Key Features
- **Real Estate Listings**: Create and manage property listings
- **Image Upload**: Upload and manage listing images
- **User Authentication**: Sign up, sign in, and user management
- **Role-Based Access**: Admin and customer roles
- **Firebase Integration**: Backend services and storage
- **Google Cloud Storage**: Image storage and management

## 🔍 Troubleshooting

### Find Your Computer's IP
```bash
./find-ip.sh
```

### Test Backend Connectivity
```bash
curl http://localhost:3000/health
```

### Common Issues
1. **Backend not running**: Start with `cd backend && npm start`
2. **Network issues**: Ensure devices are on same WiFi network
3. **Auto-detection fails**: Check BackendTest component for details

## 🚀 Production

For production deployment:
1. Update `src/config/apiConfig.ts` with production backend URL
2. Deploy backend to your preferred hosting service
3. Configure Firebase for production environment

## 📄 License

This project is licensed under the MIT License.

---

This is a [React Native](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

For more information about React Native, visit the [React Native Website](https://reactnative.dev).
