# Platform-Specific API Configuration

## Overview

The RoofRoot app uses different API base URLs depending on the platform (Android vs iOS) and environment (development vs production). This ensures proper connectivity between the React Native app and the backend server.

## Configuration

### Development Environment

The app automatically detects the platform and uses the appropriate URL:

- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://192.168.0.249:3000`
- **Physical Devices**: `http://192.168.0.249:3000`

### Production Environment

- **All Platforms**: `https://roofroot-backend-xxxxx-uc.a.run.app`

## Implementation

### Centralized Configuration

The configuration is centralized in `src/config/apiConfig.ts`:

```typescript
import { Platform } from 'react-native';

export const getApiBaseUrl = () => {
  if (isProduction) {
    return 'https://roofroot-backend-xxxxx-uc.a.run.app';
  }
  
  // Development: Use local backend
  if (Platform.OS === 'android') {
    // For Android emulator
    return 'http://10.0.2.2:3000';
  }
  // For iOS simulator and physical devices
  return 'http://192.168.0.249:3000';
};
```

### Usage in Components

All components now import the centralized configuration:

```typescript
import { API_BASE_URL } from '../config/apiConfig';

// Use API_BASE_URL for all API calls
const response = await fetch(`${API_BASE_URL}/health`);
```

## Why Different URLs?

### Android Emulator (`10.0.2.2:3000`)

- Android emulators run in a virtual machine
- `10.0.2.2` is a special IP that maps to the host machine's `localhost`
- This allows the Android emulator to access your computer's localhost

### iOS Simulator (`192.168.0.249:3000`)

- iOS simulators run directly on your Mac
- They can access `localhost` directly, but for consistency with physical devices, we use the computer's IP
- `192.168.0.249` is your computer's local IP address

### Physical Devices (`192.168.0.249:3000`)

- Physical devices need to use your computer's IP address
- They cannot access `localhost` or `10.0.2.2`
- Must be on the same WiFi network as your computer

## Testing the Configuration

### Using PlatformTest Component

Add the `PlatformTest` component to any screen to test connectivity:

```typescript
import PlatformTest from '../components/PlatformTest';

// In your screen component
<PlatformTest />
```

### Manual Testing

1. **Check the console logs** when the app starts:
   ```
   Environment: Development
   Platform: android
   API Base URL: http://10.0.2.2:3000
   ```

2. **Test backend connectivity**:
   ```bash
   # For Android
   curl http://10.0.2.2:3000/health
   
   # For iOS
   curl http://192.168.0.249:3000/health
   ```

## Troubleshooting

### Common Issues

#### 1. "Network request failed" on Android
- **Cause**: Android emulator can't reach `10.0.2.2`
- **Solution**: Ensure backend is running on `localhost:3000`

#### 2. "Network request failed" on iOS
- **Cause**: Wrong IP address or device not on same network
- **Solution**: 
  - Check your computer's IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
  - Update `apiConfig.ts` with the correct IP
  - Ensure device is on same WiFi network

#### 3. "Backend server is not running"
- **Cause**: Backend server not started
- **Solution**: Start the backend:
  ```bash
  cd backend && npm start
  ```

### Debugging Steps

1. **Check platform detection**:
   ```typescript
   console.log('Platform:', Platform.OS);
   console.log('API URL:', API_BASE_URL);
   ```

2. **Test backend directly**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check network connectivity**:
   ```bash
   # From your computer
   ping 192.168.0.249
   
   # From device (if possible)
   ping 192.168.0.249
   ```

4. **Use the BackendTest component**:
   ```typescript
   import BackendTest from '../components/BackendTest';
   <BackendTest />
   ```

## Updating IP Address

If your computer's IP address changes:

1. **Find your new IP**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Update the configuration** in `src/config/apiConfig.ts`:
   ```typescript
   return 'http://YOUR_NEW_IP:3000';
   ```

3. **Restart the app** to pick up the new configuration

## Fallback URLs

The system includes fallback URLs for different network configurations:

```typescript
export const getFallbackUrls = () => {
  return [
    'http://192.168.0.249:3000', // Current IP
    'http://localhost:3000',      // Localhost
    'http://127.0.0.1:3000',     // Loopback
  ];
};
```

These are tried automatically if the primary URL fails.

## Production Deployment

For production, update the URL in `src/config/apiConfig.ts`:

```typescript
if (isProduction) {
  return 'https://your-actual-deployed-backend.com';
}
```

## Security Considerations

- **Development**: Uses HTTP for local development
- **Production**: Uses HTTPS for security
- **CORS**: Backend is configured to allow all origins in development
- **Authentication**: Production should implement proper authentication

## Best Practices

1. **Always use the centralized configuration** - don't hardcode URLs in components
2. **Test on both platforms** - ensure connectivity works on Android and iOS
3. **Use the test components** - `PlatformTest` and `BackendTest` for debugging
4. **Monitor console logs** - check for connectivity issues during development
5. **Update IP address** - when your network configuration changes

## Quick Reference

| Platform | Environment | URL |
|----------|-------------|-----|
| Android Emulator | Development | `http://10.0.2.2:3000` |
| iOS Simulator | Development | `http://192.168.0.249:3000` |
| Physical Devices | Development | `http://192.168.0.249:3000` |
| All Platforms | Production | `https://roofroot-backend-xxxxx-uc.a.run.app` | 