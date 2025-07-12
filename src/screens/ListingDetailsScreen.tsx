import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  FlatList,
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

const { width, height } = Dimensions.get('window');

// Optimized Image Component with lazy loading
const OptimizedImage = React.memo(({ 
  uri, 
  style, 
  onPress, 
  onError 
}: { 
  uri: string; 
  style: any; 
  onPress?: () => void; 
  onError?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 12, color: '#666' }}>Failed to load</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <Image
        source={{ uri }}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // Performance optimizations
        fadeDuration={0}
        progressiveRenderingEnabled={true}
        resizeMethod="resize"
      />
      {isLoading && (
        <View style={[style, { position: 'absolute', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 12, color: '#666' }}>Loading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Image Carousel Component
const ImageCarousel = React.memo(({ 
  images, 
  onImagePress, 
  onImageError, 
  colors 
}: { 
  images: string[]; 
  onImagePress: (imageUrl: string) => void; 
  onImageError: () => void; 
  colors: any;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const renderImage = useCallback(({ item }: { item: string }) => (
    <View style={styles.carouselImageContainer}>
      <OptimizedImage
        uri={item}
        style={styles.carouselImage}
        onPress={() => onImagePress(item)}
        onError={onImageError}
      />
    </View>
  ), [onImagePress, onImageError]);

  const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  if (images.length === 0) {
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: colors.tertiary }]}>
        <Text style={styles.placeholderText}>🖼️</Text>
        <Text style={[styles.placeholderMessage, { color: colors.textSecondary }]}>Image coming soon</Text>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        // Performance optimizations
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
      />
      
      {/* Navigation Arrows - Only show if more than one image */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          {currentIndex > 0 && (
            <TouchableOpacity 
              style={[styles.navArrow, styles.leftArrow, { backgroundColor: colors.overlay }]} 
              onPress={goToPrevious}
              activeOpacity={0.7}
            >
              <Text style={[styles.arrowText, { color: colors.textPrimary }]}>‹</Text>
            </TouchableOpacity>
          )}
          
          {/* Right Arrow */}
          {currentIndex < images.length - 1 && (
            <TouchableOpacity 
              style={[styles.navArrow, styles.rightArrow, { backgroundColor: colors.overlay }]} 
              onPress={goToNext}
              activeOpacity={0.7}
            >
              <Text style={[styles.arrowText, { color: colors.textPrimary }]}>›</Text>
            </TouchableOpacity>
          )}
          
          {/* Image Counter */}
          <View style={[styles.imageCounter, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.counterText, { color: colors.textPrimary }]}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
});

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

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const handleImageError = useCallback(() => {
    Alert.alert('Image Error', 'Failed to load the image. Please check the URL.');
  }, []);

  const handleRemoveImage = useCallback(async (imageUrl: string) => {
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
  }, [listing.id, onImageRemoved]);

  const handleImagePress = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Full-Width Image Carousel */}
        <View style={[styles.imageSection, { backgroundColor: colors.secondary }]}>
          <ImageCarousel
            images={listing.images || []}
            onImagePress={handleImagePress}
            onImageError={handleImageError}
            colors={colors}
          />
        </View>

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
        <View style={styles.modalOverlayFixed}>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={closeImageModal}
          >
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullscreenImageStandard}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  ), [colors, listing, handleImagePress, handleImageError, formatPrice, closeImageModal, selectedImage, isImageModalVisible]);

  return memoizedContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    marginBottom: 16,
  },
  carouselContainer: {
    position: 'relative',
    height: 200, // Reduced from 300px to 200px
  },
  carouselImageContainer: {
    width: width,
    height: 200, // Reduced from 300px to 200px
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // This will crop the image to fit the dimensions
  },
  placeholderContainer: {
    width: '100%',
    height: 200, // Reduced from 300px to 200px
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
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
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
  fullscreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed from 'cover' to 'contain' to show full image
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker background for better contrast
  },
  modalOverlayFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 9999,
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent background
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white', // White text for better visibility
  },
  fullscreenImageFixed: {
    flex: 1,
    width: undefined,
    height: undefined,
    resizeMode: 'contain',
    alignSelf: 'stretch',
  },
  fullscreenImageStandard: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default ListingDetailsScreen; 