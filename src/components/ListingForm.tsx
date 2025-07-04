import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Alert,
  Image
} from 'react-native';
import { RealEstateListing } from '../firebase/realEstateService';
import { launchImageLibrary, Asset as ImagePickerAsset } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

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
    });
    if (result.assets) {
      setImages([
        ...images,
        ...result.assets.map((asset: ImagePickerAsset) => asset.uri).filter(Boolean) as string[],
      ]);
    }
  };

  const uploadImages = async () => {
    const uploadPromises = images.map(async (uri) => {
      if (uri.startsWith('http')) {
        return uri; // Already uploaded
      }
      try {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const ref = storage().ref(`listing-images/${filename}`);
        await ref.putFile(uri);
        const url = await ref.getDownloadURL();
        return url;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Failed to upload image: ${error}`);
      }
    });
    
    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls.filter(Boolean);
    } catch (error) {
      console.error('Error uploading images:', error);
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
      Alert.alert('Error', `Failed to save listing: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Create New Listing' : 'Edit Listing'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter property title"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter property description"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price (e.g., 250,000)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter property location"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Images (up to 10, optional)</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImages}>
              <Text style={styles.imagePickerButtonText}>Pick Images</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => removeImage(idx)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : (mode === 'create' ? 'Create Listing' : 'Update Listing')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748B',
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
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  imagePickerButton: {
    backgroundColor: '#6366F1',
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

export default ListingForm; 