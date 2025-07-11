import { Platform } from 'react-native';

// Environment configuration
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

// Device detection helpers
const isSimulator = () => {
  // iOS Simulator detection
  if (Platform.OS === 'ios') {
    return __DEV__ && !require('react-native').NativeModules.RCTDeviceInfo?.isPhysicalDevice;
  }
  // Android Emulator detection
  if (Platform.OS === 'android') {
    return __DEV__ && require('react-native').NativeModules.RCTDeviceInfo?.isEmulator;
  }
  return false;
};

const isPhysicalDevice = () => {
  return !isSimulator();
};

// Smart caching with 24-hour expiration
interface CachedIP {
  ip: string;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let cachedServerIP: CachedIP | null = null;
let isFetchingIP = false;
let ipFetchPromise: Promise<string> | null = null;

// Load cached IP from storage (simplified - in real app, use AsyncStorage)
const loadCachedIP = (): string | null => {
  if (cachedServerIP && Date.now() < cachedServerIP.expiresAt) {
    console.log('📦 Using cached IP:', cachedServerIP.ip);
    return cachedServerIP.ip;
  }
  return null;
};

// Save IP to cache
const saveCachedIP = (ip: string) => {
  cachedServerIP = {
    ip,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION,
  };
  console.log('💾 Cached IP:', ip, 'expires in 24 hours');
};

// Function to fetch server IP with reduced timeouts and parallel requests
const fetchServerIP = async (): Promise<string> => {
  if (isFetchingIP && ipFetchPromise) {
    return ipFetchPromise;
  }

  isFetchingIP = true;
  ipFetchPromise = new Promise(async (resolve, reject) => {
    try {
      // Try URLs in parallel with reduced timeouts (2 seconds each)
      const urls = [
        'http://localhost:3000/server-info',
        'http://10.0.2.2:3000/server-info', // Android emulator
        'http://127.0.0.1:3000/server-info',
      ];

      console.log('🔍 Starting parallel IP detection...');
      
      // Create promises with 2-second timeouts
      const promises = urls.map(async (url) => {
        try {
          console.log(`🔍 Trying: ${url}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ IP detected from:', url, '->', data.serverIP);
            return data.serverIP;
          }
        } catch (error) {
          console.log(`❌ Failed: ${url} - ${(error as Error).message}`);
        }
        return null;
      });

      // Wait for first successful response or all to fail
      const results = await Promise.all(promises);
      const validIP = results.find(ip => ip !== null);

      if (validIP) {
        saveCachedIP(validIP);
        resolve(validIP);
      } else {
        // If all attempts fail, use fallback
        console.log('⚠️ All IP detection attempts failed, using fallback');
        const fallbackIP = '192.168.0.249';
        saveCachedIP(fallbackIP);
        resolve(fallbackIP);
      }
    } catch (error) {
      console.error('Error in IP detection:', error);
      const fallbackIP = '192.168.0.249';
      saveCachedIP(fallbackIP);
      resolve(fallbackIP);
    } finally {
      isFetchingIP = false;
      ipFetchPromise = null;
    }
  });

  return ipFetchPromise;
};

// Centralized API configuration with progressive loading
export const getApiBaseUrl = async (): Promise<string> => {
  if (isProduction) {
    // Production: Use deployed backend URL
    return 'https://roofroot-backend-xxxxx-uc.a.run.app';
  }
  
  // Development: Use local backend based on platform and device type
  if (Platform.OS === 'android') {
    if (isPhysicalDevice()) {
      // Android Physical Device - Use cached IP or fetch with fallback
      const cachedIP = loadCachedIP();
      if (cachedIP) {
        return `http://${cachedIP}:3000`;
      }
      const serverIP = await fetchServerIP();
      return `http://${serverIP}:3000`;
    } else {
      // Android Emulator - Use 10.0.2.2 (special Android emulator localhost)
      return 'http://10.0.2.2:3000';
    }
  } else if (Platform.OS === 'ios') {
    if (isPhysicalDevice()) {
      // iOS Physical Device - Use cached IP or fetch with fallback
      const cachedIP = loadCachedIP();
      if (cachedIP) {
        return `http://${cachedIP}:3000`;
      }
      const serverIP = await fetchServerIP();
      return `http://${serverIP}:3000`;
    } else {
      // iOS Simulator - Use localhost
      return 'http://localhost:3000';
    }
  }
  
  // Fallback
  return 'http://localhost:3000';
};

// Synchronous version for immediate use (progressive loading)
export const getApiBaseUrlSync = (): string => {
  if (isProduction) {
    return 'https://roofroot-backend-xxxxx-uc.a.run.app';
  }
  
  // Use cached IP immediately if available
  const cachedIP = loadCachedIP();
  
  if (Platform.OS === 'android') {
    if (isPhysicalDevice()) {
      return cachedIP ? `http://${cachedIP}:3000` : 'http://192.168.0.249:3000';
    } else {
      return 'http://10.0.2.2:3000';
    }
  } else if (Platform.OS === 'ios') {
    if (isPhysicalDevice()) {
      return cachedIP ? `http://${cachedIP}:3000` : 'http://192.168.0.249:3000';
    } else {
      return 'http://localhost:3000';
    }
  }
  
  return 'http://localhost:3000';
};

// Fallback URLs for different network configurations
export const getFallbackUrls = () => {
  return [
    'http://192.168.0.249:3000', // Computer's IP (for physical devices)
    'http://10.0.2.2:3000',      // Android emulator
    'http://localhost:3000',      // iOS simulator
    'http://127.0.0.1:3000',     // Loopback
  ];
};

// Initialize API base URL (progressive loading approach)
let API_BASE_URL = getApiBaseUrlSync();

// Function to initialize the API URL in background (progressive loading)
export const initializeApiUrl = async (): Promise<string> => {
  try {
    console.log('🚀 Starting background IP detection...');
    const newApiUrl = await getApiBaseUrl();
    
    // Only update if the URL actually changed
    if (newApiUrl !== API_BASE_URL) {
      console.log('🔄 Updating API URL:', API_BASE_URL, '->', newApiUrl);
      API_BASE_URL = newApiUrl;
    } else {
      console.log('✅ API URL unchanged, using cached value');
    }
    
    return API_BASE_URL;
  } catch (error) {
    console.error('Failed to initialize API URL:', error);
    API_BASE_URL = getApiBaseUrlSync();
    return API_BASE_URL;
  }
};

// Export the configured API base URL
export { API_BASE_URL };

// Device information for debugging
const getDeviceInfo = () => {
  const deviceType = isPhysicalDevice() ? 'Physical Device' : 'Simulator/Emulator';
  return {
    platform: Platform.OS,
    deviceType,
    isDevelopment,
    isProduction,
  };
};

// Log configuration for debugging
const deviceInfo = getDeviceInfo();
console.log('🔧 API Configuration:');
console.log('Environment:', deviceInfo.isDevelopment ? 'Development' : 'Production');
console.log('Platform:', deviceInfo.platform);
console.log('Device Type:', deviceInfo.deviceType);
console.log('Initial API Base URL:', API_BASE_URL);
console.log('Cached IP:', loadCachedIP() || 'None'); 