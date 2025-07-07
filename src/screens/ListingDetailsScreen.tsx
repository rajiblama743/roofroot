import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { RealEstateListing } from '../firebase/realEstateService';
import { realEstateService } from '../firebase/realEstateService';
import { authService } from '../firebase/authService';
import { useTheme } from '../context/ThemeContext';

interface ListingDetailsScreenProps {
  listing: RealEstateListing;
  onBack?: () => void;
  onImageRemoved?: () => void;
}

const { width } = Dimensions.get('window');

const ListingDetailsScreen: React.FC<ListingDetailsScreenProps> = ({ listing, onBack, onImageRemoved }) => {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user on component mount
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const userData = await authService.getUserData(user.uid);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getUser();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleImageError = () => {
    Alert.alert('Image Error', 'Failed to load the image. Please check the URL.');
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!listing.id) return;
    
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await realEstateService.removeListingImage(listing.id!, imageUrl);
              Alert.alert('Success', 'Image removed successfully');
              onImageRemoved?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove image');
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 ? (
          <View style={[styles.imageGallery, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.galleryTitle, { color: colors.textPrimary }]}>Property Images ({listing.images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {listing.images.map((imageUrl, index) => (
                <View key={index} style={styles.galleryImageContainer}>
                  <TouchableOpacity 
                    onPress={() => handleImagePress(imageUrl)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
                  </TouchableOpacity>
                  {isAdmin && (
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => handleRemoveImage(imageUrl)}
                    >
                      <Text style={styles.removeImageButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
            <View style={[styles.placeholderImage, { backgroundColor: colors.tertiary }]}>
              <Text style={styles.placeholderText}>🖼️</Text>
              <Text style={[styles.placeholderMessage, { color: colors.textSecondary }]}>Image coming soon</Text>
            </View>
          </View>
        )}

        {/* Content Section */}
        <View style={[styles.detailsContainer, { backgroundColor: colors.secondary }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.buttonSuccess }]}>{formatPrice(listing.price)}</Text>
          </View>

          {/* Location */}
          {listing.location && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📍 Location</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.location}</Text>
            </View>
          )}

          {/* Bedrooms */}
          {listing.bedrooms && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>🛏️ Bedrooms</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.bedrooms}</Text>
            </View>
          )}

          {/* Bathrooms */}
          {listing.bathrooms && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>🚿 Bathrooms</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.bathrooms}</Text>
            </View>
          )}

          {/* Square Feet */}
          {listing.squareFeet && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📐 Square Feet</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.squareFeet.toLocaleString()} sq ft</Text>
            </View>
          )}

          {/* Description */}
          <View style={[styles.descriptionContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.descriptionLabel, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{listing.description}</Text>
          </View>

          {/* Created Date */}
          {listing.createdAt && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📅 Listed</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {listing.createdAt.toDate ? 
                  listing.createdAt.toDate().toLocaleDateString() : 
                  'Recently'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableOpacity 
            style={[styles.modalCloseButton, { backgroundColor: colors.secondary }]} 
            onPress={closeImageModal}
          >
            <Text style={[styles.modalCloseButtonText, { color: colors.iconPrimary }]}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  pageTitleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderMessage: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  imageGallery: {
    padding: 20,
    marginBottom: 16,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  imageScroll: {
    marginBottom: 8,
  },
  galleryImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ListingDetailsScreen; 