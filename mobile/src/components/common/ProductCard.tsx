/**
 * Composant Carte Article (ProductCard) ReVibe FliP Mobile
 * 
 * Carte visuelle d'un produit optimisée pour les grilles mobiles à deux colonnes avec image, prix, marque, état et badge séquestre.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Product } from '../../types';
import { colors, formatPrice } from '../../theme/colors';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const imageUrl =
    product.primaryImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null) ||
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80';

  const conditionShort = product.conditionLabel
    ? product.conditionLabel.replace('avec étiquette', '').trim()
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        {product.locationCity ? (
          <View style={styles.cityBadge}>
            <Text style={styles.cityText}>{product.locationCity}</Text>
          </View>
        ) : null}
        {conditionShort ? (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{conditionShort}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.brandRow}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand || 'VÊTEMENT'}
          </Text>
          {product.size && <Text style={styles.size}>{product.size}</Text>}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  details: {
    padding: 10,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    flex: 1,
  },
  size: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
