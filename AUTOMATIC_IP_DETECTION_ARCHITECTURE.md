# Automatic IP Detection Architecture

## 🎯 Overview

The RoofRoot app implements an intelligent automatic IP detection system that eliminates the need for manual IP configuration when developing with physical devices. This system automatically detects the backend server's IP address and configures the mobile app accordingly.

## 🏗️ Architecture Components

### 1. Backend Server (`server.js`)

#### IP Detection Logic
```javascript
const getServerIP = () => {
  const interfaces = os.networkInterfaces();
  
  // Look for the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost'; // Fallback
};
```

#### Server Info Endpoint
```javascript
app.get('/server-info', (req, res) => {
  res.json({
    serverIP: SERVER_IP,
    port: PORT,
    fullUrl: `http://${SERVER_IP}:${PORT}`,
    timestamp: new Date().toISOString(),
    platform: os.platform(),
    hostname: os.hostname(),
  });
});
```

### 2. React Native App (`apiConfig.ts`)

#### Device Detection
```typescript
const isSimulator = () => {
  if (Platform.OS === 'ios') {
    return __DEV__ && !require('react-native').NativeModules.RCTDeviceInfo?.isPhysicalDevice;
  }
  if (Platform.OS === 'android') {
    return __DEV__ && require('react-native').NativeModules.RCTDeviceInfo?.isEmulator;
  }
  return false;
};
```

#### IP Fetching Logic
```typescript
const fetchServerIP = async (): Promise<string> => {
  // Try different URLs to reach the server
  const urls = [
    'http://localhost:3000/server-info',
    'http://10.0.2.2:3000/server-info', // Android emulator
    'http://127.0.0.1:3000/server-info',
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.serverIP;
      }
    } catch (error) {
      console.log(`Failed to fetch from ${url}`);
    }
  }
  
  return '192.168.0.249'; // Fallback IP
};
```

## 🔄 Data Flow

### 1. Server Startup
```
1. Backend server starts
2. OS network interfaces are scanned
3. First non-internal IPv4 address is detected
4. Server IP is cached and exposed via /server-info endpoint
```

### 2. App Startup
```
1. React Native app starts
2. Device type is detected (iOS/Android, Physical/Simulator)
3. App attempts to fetch server IP from multiple URLs
4. Server responds with its actual IP address
5. App caches the IP and uses it for all API calls
```

### 3. Fallback Mechanism
```
If auto-detection fails:
1. App uses hardcoded fallback IP (192.168.0.249)
2. User can manually update IP in apiConfig.ts
3. App continues to work with manual configuration
```

## 📱 Device-Specific Behavior

### iOS Simulator
- **URL**: `http://localhost:3000`
- **Detection**: Not needed (direct localhost)
- **Behavior**: Immediate connection

### iOS Physical Device
- **URL**: `http://{auto-detected-ip}:3000`
- **Detection**: Fetches from server on startup
- **Behavior**: Automatic IP discovery

### Android Emulator
- **URL**: `http://10.0.2.2:3000`
- **Detection**: Not needed (Android emulator localhost)
- **Behavior**: Immediate connection

### Android Physical Device
- **URL**: `http://{auto-detected-ip}:3000`
- **Detection**: Fetches from server on startup
- **Behavior**: Automatic IP discovery

## 🛠️ Implementation Details

### Caching Strategy
```typescript
let cachedServerIP: string | null = null;
let isFetchingIP = false;
let ipFetchPromise: Promise<string> | null = null;
```

- **Single Request**: Multiple simultaneous requests share the same promise
- **Cache Duration**: IP is cached for the entire app session
- **Cache Invalidation**: Cache is cleared on app restart

### Error Handling
```typescript
try {
  // Attempt auto-detection
  const serverIP = await fetchServerIP();
  return `http://${serverIP}:3000`;
} catch (error) {
  // Fallback to hardcoded IP
  return 'http://192.168.0.249:3000';
}
```

### Network Timeout
- **Timeout**: 5 seconds per URL attempt
- **Retry Strategy**: Try multiple URLs sequentially
- **Graceful Degradation**: Fallback to hardcoded IP

## 🔧 Configuration

### Environment Variables
```typescript
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;
```

### Production vs Development
- **Development**: Uses auto-detection and fallback IPs
- **Production**: Uses hardcoded production URLs

### Fallback URLs
```typescript
export const getFallbackUrls = () => {
  return [
    'http://192.168.0.249:3000', // Computer's IP
    'http://10.0.2.2:3000',      // Android emulator
    'http://localhost:3000',      // iOS simulator
    'http://127.0.0.1:3000',     // Loopback
  ];
};
```

## 🧪 Testing

### BackendTest Component
The `BackendTest` component provides comprehensive testing capabilities:

1. **Device Information Display**
   - Shows current platform (iOS/Android)
   - Shows device type (Physical/Simulator)
   - Shows detected API URL

2. **Connectivity Testing**
   - Tests backend connectivity
   - Shows detailed error information
   - Validates auto-detection

3. **Debug Information**
   - Logs all detection attempts
   - Shows fallback behavior
   - Displays network configuration

### Manual Testing
```bash
# Test server info endpoint
curl http://localhost:3000/server-info

# Test health endpoint
curl http://localhost:3000/health

# Test ping endpoint
curl http://localhost:3000/ping
```

## 🚀 Benefits

### For Developers
- **Zero Configuration**: No manual IP updates required
- **Network Agnostic**: Works across different WiFi networks
- **Time Saving**: Eliminates manual configuration steps
- **Error Reduction**: Reduces configuration-related bugs

### For Users
- **Seamless Experience**: App works immediately after setup
- **Network Flexibility**: Works when switching WiFi networks
- **Reliability**: Multiple fallback mechanisms ensure connectivity

### For Teams
- **Consistency**: Same behavior across different development machines
- **Documentation**: Self-documenting through logging
- **Maintainability**: Centralized configuration logic

## 🔍 Troubleshooting

### Common Issues

1. **Auto-Detection Fails**
   - Check if backend is running
   - Verify network connectivity
   - Check firewall settings

2. **Wrong IP Detected**
   - Multiple network interfaces may cause confusion
   - Check network interface priority
   - Use manual IP if needed

3. **Fallback Not Working**
   - Verify hardcoded IP is correct
   - Check if devices are on same network
   - Test with BackendTest component

### Debug Commands
```bash
# Find your computer's IP
./find-ip.sh

# Test server connectivity
curl http://localhost:3000/server-info

# Check network interfaces
ifconfig | grep "inet "
```

## 📈 Performance Considerations

### Optimization Strategies
- **Caching**: IP is cached for app session
- **Single Request**: Multiple calls share same promise
- **Timeout**: 5-second timeout prevents hanging
- **Fallback**: Quick fallback to hardcoded IP

### Memory Usage
- **Minimal**: Only caches IP string
- **Cleanup**: Cache cleared on app restart
- **No Leaks**: Proper promise handling

## 🔮 Future Enhancements

### Potential Improvements
1. **Network Change Detection**: Automatically update IP when network changes
2. **Multiple Server Support**: Support for multiple backend servers
3. **Advanced Fallback**: More sophisticated fallback strategies
4. **Metrics**: Track detection success rates
5. **Configuration UI**: Allow manual IP override in app settings

### Scalability Considerations
- **Microservices**: Architecture supports multiple backend services
- **Load Balancing**: Can be extended for load balancer support
- **Service Discovery**: Foundation for service discovery implementation

## 📚 Related Documentation

- [Backend Setup Guide](./BACKEND_SETUP.md)
- [Network Configuration](./DEBUG_CONNECTIVITY.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Testing Guide](./__tests__/README.md) 