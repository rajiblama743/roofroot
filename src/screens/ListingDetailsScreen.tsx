import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { RealEstateListing } from '../firebase/realEstateService';

interface ListingDetailsScreenProps {
  listing: RealEstateListing;
  onBack?: () => void;
}

const { width } = Dimensions.get('window');

const ListingDetailsScreen: React.FC<ListingDetailsScreenProps> = ({ listing, onBack }) => {
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>🖼️</Text>
              <Text style={styles.placeholderMessage}>Image coming soon</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.detailsContainer}>
          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          </View>

          {/* Location */}
          {listing.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Location</Text>
              <Text style={styles.infoValue}>{listing.location}</Text>
            </View>
          )}

          {/* Bedrooms */}
          {listing.bedrooms && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🛏️ Bedrooms</Text>
              <Text style={styles.infoValue}>{listing.bedrooms}</Text>
            </View>
          )}

          {/* Bathrooms */}
          {listing.bathrooms && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🚿 Bathrooms</Text>
              <Text style={styles.infoValue}>{listing.bathrooms}</Text>
            </View>
          )}

          {/* Square Feet */}
          {listing.squareFeet && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📐 Square Feet</Text>
              <Text style={styles.infoValue}>{listing.squareFeet.toLocaleString()} sq ft</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Created Date */}
          {listing.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Listed</Text>
              <Text style={styles.infoValue}>
                {listing.createdAt.toDate ? 
                  listing.createdAt.toDate().toLocaleDateString() : 
                  'Recently'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  pageTitleContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderMessage: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#059669',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
});

export default ListingDetailsScreen; 