// Google Cloud Storage service for React Native
// This service will handle image uploads to Google Cloud Storage

import { Platform } from 'react-native';
import { API_BASE_URL, getFallbackUrls } from '../config/apiConfig';

// Environment configuration
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

// Enhanced error handling and connectivity check with fallback URLs
const checkBackendConnectivity = async (): Promise<boolean> => {
  const urlsToTry = [API_BASE_URL, ...getFallbackUrls()];
  
  console.log('🔍 Checking backend connectivity...');
  console.log('🌐 Platform:', Platform.OS);
  console.log('🏗️ Environment:', isDevelopment ? 'Development' : 'Production');
  console.log('📍 URLs to try:', urlsToTry);
  
  for (const url of urlsToTry) {
    try {
      console.log(`🔍 Trying URL: ${url}`);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log(`📡 Response status for ${url}:`, response.status);
      console.log(`📡 Response ok for ${url}:`, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Backend health check successful for ${url}:`, result);
        return true;
      } else {
        console.error(`❌ Backend health check failed for ${url}:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Backend connectivity check failed for ${url}:`, error);
      console.error('🔍 Error details:', {
        url,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  console.error('❌ All backend connectivity attempts failed');
  return false;
};
const BUCKET_NAME = 'roofroot-storage'; // Your Google Cloud Storage bucket name

// Test function for debugging connectivity
export const testBackendConnectivity = async (): Promise<{ success: boolean; details: any }> => {
  try {
    console.log('🧪 Testing backend connectivity...');
    console.log('📍 API Base URL:', API_BASE_URL);
    console.log('🌐 Platform:', Platform.OS);
    console.log('🏗️ Environment:', isDevelopment ? 'Development' : 'Production');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log('📡 Health response status:', healthResponse.status);
    
    // Test ping endpoint
    const pingResponse = await fetch(`${API_BASE_URL}/ping`);
    console.log('📡 Ping response status:', pingResponse.status);
    
    if (healthResponse.ok && pingResponse.ok) {
      const healthData = await healthResponse.json();
      const pingData = await pingResponse.json();
      
      console.log('✅ Backend connectivity test successful');
      console.log('📊 Health data:', healthData);
      console.log('📊 Ping data:', pingData);
      
      return {
        success: true,
        details: {
          health: healthData,
          ping: pingData,
          apiBaseUrl: API_BASE_URL,
          platform: Platform.OS,
          environment: isDevelopment ? 'Development' : 'Production'
        }
      };
    } else {
      console.error('❌ Backend connectivity test failed');
      console.error('Health status:', healthResponse.status);
      console.error('Ping status:', pingResponse.status);
      
      return {
        success: false,
        details: {
          healthStatus: healthResponse.status,
          pingStatus: pingResponse.status,
          apiBaseUrl: API_BASE_URL
        }
      };
    }
  } catch (error) {
    console.error('❌ Backend connectivity test error:', error);
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        apiBaseUrl: API_BASE_URL
      }
    };
  }
};

// Upload image to Google Cloud Storage via backend API
export const uploadImageToGCS = async (uri: string, filename: string): Promise<string> => {
  try {
    console.log(`Uploading ${filename} to Google Cloud Storage...`);
    
    // Check backend connectivity first
    console.log('🔍 Starting backend connectivity check...');
    const isBackendAvailable = await checkBackendConnectivity();
    if (!isBackendAvailable) {
      console.error('❌ Backend connectivity check failed');
      console.error('🔧 Troubleshooting steps:');
      console.error('1. Ensure backend server is running: cd backend && npm start');
      console.error('2. Check if the IP address is correct for your network');
      console.error('3. Verify the backend is accessible from your device');
      throw new Error(`Backend server is not accessible at ${API_BASE_URL}. Please ensure the backend server is running and the IP address is correct.`);
    }
    
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    formData.append('filename', filename);
    formData.append('bucket', BUCKET_NAME);
    
    console.log('Sending upload request to backend...');
    
    // Upload to your backend API
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload response error:', response.status, response.statusText, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Successfully uploaded ${filename} to Google Cloud Storage`);
    console.log('Download URL:', result.downloadUrl);
    return result.downloadUrl;
    
  } catch (error) {
    console.error('Error uploading to Google Cloud Storage:', error);
    
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Backend server is not running')) {
        throw new Error('Backend server is not running. Please start the backend server with: cd backend && npm start');
      } else if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
      } else if (error.message.includes('Upload failed: 500')) {
        throw new Error('Server error during upload. Please check the backend logs for details.');
      } else if (error.message.includes('Upload failed: 413')) {
        throw new Error('File too large. Please select a smaller image (max 10MB).');
      }
    }
    
    throw error;
  }
};

// Get download URL for an image
export const getImageDownloadURL = async (filename: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-download-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        bucket: BUCKET_NAME,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.downloadUrl;
    
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Delete image from Google Cloud Storage
export const deleteImageFromGCS = async (filename: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        bucket: BUCKET_NAME,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.status} ${response.statusText}`);
    }
    
    console.log(`Successfully deleted ${filename} from Google Cloud Storage`);
    
  } catch (error) {
    console.error('Error deleting from Google Cloud Storage:', error);
    throw error;
  }
};

// Alternative approach: Direct upload using signed URLs
export const getSignedUploadURL = async (filename: string): Promise<{ uploadUrl: string; downloadUrl: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        bucket: BUCKET_NAME,
        contentType: 'image/jpeg',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      uploadUrl: result.uploadUrl,
      downloadUrl: result.downloadUrl,
    };
    
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

// Upload image using signed URL
export const uploadImageWithSignedURL = async (uri: string, filename: string): Promise<string> => {
  try {
    console.log(`Getting signed URL for ${filename}...`);
    const { uploadUrl, downloadUrl } = await getSignedUploadURL(filename);
    
    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    console.log(`Successfully uploaded ${filename} using signed URL`);
    return downloadUrl;
    
  } catch (error) {
    console.error('Error uploading with signed URL:', error);
    throw error;
  }
}; 