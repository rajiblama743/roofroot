import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, Asset as ImagePickerAsset } from 'react-native-image-picker';
import { uploadImageToGCS } from '../firebase/googleCloudStorage';
import { RealEstateListing } from '../firebase/realEstateService';
import { API_BASE_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

interface ListingFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (listing: Omit<RealEstateListing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  listing?: RealEstateListing | null;
  mode: 'create' | 'edit';
}

const ListingForm: React.FC<ListingFormProps> = ({
  visible,
  onClose,
  onSubmit,
  listing,
  mode
}) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (listing && mode === 'edit') {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPrice(listing.price ? listing.price.toLocaleString() : '');
      setLocation(listing.location || '');
      setImages(listing.images || []);
    } else {
      // Reset form for create mode
      setTitle('');
      setDescription('');
      setPrice('');
      setLocation('');
      setImages([]);
    }
  }, [listing, mode, visible]);

  const handlePickImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10,
      quality: 0.8, // Compress images for better upload performance
      includeBase64: false, // Don't include base64 to avoid memory issues
      includeExtra: false, // Don't include extra metadata
    });
    if (result.assets) {
      const validUris = result.assets
        .map((asset: ImagePickerAsset) => asset.uri)
        .filter(Boolean) as string[];

      console.log(`Selected ${validUris.length} images`);
      setImages([...images, ...validUris]);
    }
  };

  const testNetworkConnectivity = async () => {
    try {
      console.log('Testing network connectivity...');
      const response = await fetch('https://www.google.com', {
        method: 'HEAD'
      });
      console.log('Network connectivity test successful');
      return true;
    } catch (error) {
      console.error('Network connectivity test failed:', error);
      return false;
    }
  };

  const testGoogleCloudStorage = async () => {
    try {
      console.log('Testing Google Cloud Storage connectivity...');
      console.log('API Base URL:', API_BASE_URL);
      console.log('Attempting to connect to:', `${API_BASE_URL}/health`);

      // Test the backend API connectivity with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Backend API not accessible: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      console.log('Google Cloud Storage test successful');
      return true;
    } catch (error) {
      console.error('Google Cloud Storage test failed:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });

      // Provide specific guidance based on error
      if ((error as any)?.message?.includes('Backend API not accessible')) {
        console.error('Backend API is not running or not accessible.');
        console.error('Make sure your backend server is running and the API_BASE_URL is correct.');
      } else if ((error as any)?.message?.includes('fetch')) {
        console.error('Network connectivity issue. Please check your internet connection.');
      } else if ((error as any)?.name === 'AbortError') {
        console.error('Request timeout. Backend server might be slow or not responding.');
      }

      return false;
    }
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      return [];
    }

    console.log(`Starting upload of ${images.length} images to Firebase Storage...`);

    // Test network connectivity first
    const networkTest = await testNetworkConnectivity();
    if (!networkTest) {
      throw new Error('No internet connection detected. Please check your network connection and try again.');
    }

    // Test Google Cloud Storage connectivity first
    const storageTest = await testGoogleCloudStorage();
    if (!storageTest) {
      throw new Error('Backend server is not accessible. Please ensure the backend server is running with: cd backend && npm start');
    }

    console.log('Google Cloud Storage backend is properly initialized');

    const uploadPromises = images.map(async (uri, index) => {
      if (!uri) {
        console.warn(`Image ${index + 1}: Empty URI, skipping`);
        return null;
      }

      if (uri.startsWith('http')) {
        console.log(`Image ${index + 1}: Already uploaded (URL)`, uri);
        return uri; // Already uploaded
      }

      // Skip local URIs that aren't from Google Cloud Storage
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        console.log(`Image ${index + 1}: Local URI detected, attempting Google Cloud Storage upload...`);
      }

      try {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        console.log(`Image ${index + 1}: Uploading to Google Cloud Storage...`);
        console.log(`Image ${index + 1}: URI: ${uri}`);
        console.log(`Image ${index + 1}: Filename: ${filename}`);

        // Use the Google Cloud Storage upload function
        const url = await uploadImageToGCS(uri, filename);
        console.log(`Image ${index + 1}: Successfully uploaded to Google Cloud Storage`);
        console.log(`Image ${index + 1}: Download URL: ${url}`);
        return url;
      } catch (error) {
        console.error(`Image ${index + 1}: Failed to upload to Google Cloud Storage:`, error);
        console.error(`Image ${index + 1}: Error details:`, {
          message: (error as any)?.message,
          stack: (error as any)?.stack
        });
        // Don't fall back to local URI - throw error instead
        throw new Error(`Failed to upload image ${index + 1} to Google Cloud Storage: ${(error as any)?.message || error}`);
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(Boolean);
      console.log(`Successfully processed ${validUrls.length} images`);
      return validUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      // Don't fall back to local images - let the error propagate
      throw error;
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (title, description, price)');
      return;
    }
    const priceNumber = parseFloat(price.replace(/,/g, ''));
    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const listingData: any = {
        title: title.trim(),
        description: description.trim(),
        price: priceNumber,
        images: imageUrls,
      };
      if (location.trim()) {
        listingData.location = location.trim();
      }
      await onSubmit(listingData);
      onClose();
    } catch (error) {
      console.error('Error saving listing:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific guidance based on error type
        if (error.message.includes('Backend server is not running')) {
          errorMessage = 'Backend server is not running. Please start it with: cd backend && npm start';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Network connection issue. Please check your internet connection.';
        } else if (error.message.includes('File too large')) {
          errorMessage = 'Selected image is too large. Please choose a smaller image (max 10MB).';
        } else if (error.message.includes('Server error')) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      }
      
      Alert.alert(
        'Upload Error',
        `Failed to upload images.\n\n${errorMessage}\n\nPlease ensure the backend server is running and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onClose();
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: colors.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      backgroundColor: colors.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.buttonSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.buttonPrimary,
    },
    disabledButton: {
      backgroundColor: colors.textTertiary,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    imagePickerButton: {
      backgroundColor: colors.buttonPrimary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    imagePickerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    imagePreviewRow: {
      marginTop: 8,
      marginBottom: 20,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginRight: 8,
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeImageButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>
            {mode === 'create' ? 'Create New Listing' : 'Edit Listing'}
          </Text>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={handleCancel}>
            <Text style={dynamicStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>Title *</Text>
            <TextInput
              style={dynamicStyles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter property title"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>Description *</Text>
            <TextInput
              style={[dynamicStyles.input, dynamicStyles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter property description"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>Price *</Text>
            <TextInput
              style={dynamicStyles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price (e.g., 250,000)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>Location</Text>
            <TextInput
              style={dynamicStyles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter property location"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.label}>Images (up to 10, optional)</Text>
            <TouchableOpacity style={dynamicStyles.imagePickerButton} onPress={handlePickImages}>
              <Text style={dynamicStyles.imagePickerButtonText}>Pick Images</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.imagePreviewRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={dynamicStyles.imagePreviewContainer}>
                  <Image source={{ uri }} style={dynamicStyles.imagePreview} />
                  <TouchableOpacity
                    style={dynamicStyles.removeImageButton}
                    onPress={() => removeImage(idx)}
                  >
                    <Text style={dynamicStyles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={dynamicStyles.footer}>
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.submitButton, loading && dynamicStyles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={dynamicStyles.submitButtonText}>
              {loading ? 'Saving...' : (mode === 'create' ? 'Create Listing' : 'Update Listing')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};



export default ListingForm; 