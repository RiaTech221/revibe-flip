/**
 * Écran Détail Produit (ProductDetailScreen) ReVibe FliP Mobile
 * 
 * Fiche descriptive complète d'une annonce d'article :
 *  * - Galerie d'images haute définition avec carrousel horizontal
 *  * - Informations produit : titre, prix FCFA, marque, taille, état certifié, localisation
 *  * - Badge Bouclier Séquestre ReVibe Shield rappelant la protection des fonds acheteur
 *  * - Barre d'actions inférieure : bouton "Acheter maintenant" et "Négocier / Faire une offre"
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Product } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { EscrowBadge } from '../components/common/EscrowBadge';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { productService } from '../services';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, MessageCircle, ShoppingBag, ShieldCheck, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAG: 'Neuf avec étiquette',
  NEW_WITHOUT_TAG: 'Neuf sans étiquette',
  VERY_GOOD: 'Très bon état',
  GOOD: 'Bon état',
  FAIR: 'État satisfaisant',
  SATISFACTORY: 'État satisfaisant',
};

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const productId = route.params.productId || route.params.id;
  const [product, setProduct] = useState<Product | null>(route.params.product || null);
  const [loading, setLoading] = useState(!route.params.product);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef<ScrollView>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isLiked = product ? isFavorite(product.id) : false;

  useEffect(() => {
    if (productId) {
      productService
        .getProductById(productId)
        .then((data) => {
          if (data) setProduct(data);
        })
        .catch((err) => console.warn('Err fetching product detail', err))
        .finally(() => setLoading(false));
    }
  }, [productId]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack onBack={() => navigation.goBack()} title="Article" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const productImages = [
    ...(product.primaryImage ? [product.primaryImage] : []),
    ...(product.images || []).filter((image) => image !== product.primaryImage),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        title={product.title}
        rightAction={
          <TouchableOpacity onPress={() => toggleFavorite(product)} style={styles.likeBtn}>
            <Heart
              size={22}
              color={isLiked ? colors.danger : colors.textPrimary}
              fill={isLiked ? colors.danger : 'transparent'}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Galerie produit : balayage et miniatures comme sur le web */}
        <View style={styles.galleryContainer}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              setActiveImageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
            }}
          >
            {productImages.length > 0 ? productImages.map((image, index) => (
              <ImageWithFallback
                key={`${image}-${index}`}
                uri={image}
                label={product.title}
                style={styles.image}
              />
            )) : (
              <ImageWithFallback label={product.title} style={styles.image} />
            )}
          </ScrollView>
          {productImages.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{activeImageIndex + 1}/{productImages.length}</Text>
            </View>
          )}
        </View>

        {productImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          >
            {productImages.map((image, index) => (
              <TouchableOpacity
                key={`${image}-thumb-${index}`}
                onPress={() => {
                  galleryRef.current?.scrollTo({ x: index * width, animated: true });
                  setActiveImageIndex(index);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Afficher la photo ${index + 1}`}
                style={[styles.thumbnailButton, index === activeImageIndex && styles.thumbnailSelected]}
              >
                <ImageWithFallback uri={image} label={product.title} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Price & Escrow Badge */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <EscrowBadge compact />
          </View>

          <Text style={styles.title}>{product.title}</Text>

          {/* Details Row */}
          <View style={styles.tagsRow}>
            {product.brand && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.brand}</Text>
              </View>
            )}
            {product.size && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>Taille {product.size}</Text>
              </View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {product.conditionLabel || CONDITION_LABELS[product.condition] || product.condition}
              </Text>
            </View>
          </View>

          {/* Location & Seller */}
          <View style={styles.sellerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {product.seller?.fullName?.[0]?.toUpperCase() || 'V'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>
                {product.seller?.fullName || 'Vendeur vérifié ReVibe'}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.sellerCity}>{product.locationCity || product.city || 'Dakar, Sénégal'}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'Aucune description fournie.'}
          </Text>

          {/* Escrow Guarantee Info Card */}
          <View style={styles.guaranteeCard}>
            <ShieldCheck size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guaranteeTitle}>Achetez l'esprit tranquille</Text>
              <Text style={styles.guaranteeText}>
                Votre paiement est conservé par ReVibe FliP jusqu'à la confirmation de réception. Le vendeur n'est payé que lorsque vous validez votre article.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() =>
            navigation.navigate('Chat', {
              productId: product.id,
              sellerId: product.seller?.id,
            })
          }
        >
          <MessageCircle size={18} color={colors.primary} style={styles.actionIcon} />
          <Text style={styles.chatBtnText} allowFontScaling={false} numberOfLines={1}>
            Discuter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('Checkout', { product })}
        >
          <ShoppingBag size={18} color="#ffffff" style={styles.actionIcon} />
          <Text style={styles.buyBtnText} allowFontScaling={false} numberOfLines={1}>
            Acheter protégé
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  image: {
    width: width,
    height: width * 0.9,
    backgroundColor: colors.surface,
  },
  galleryContainer: { position: 'relative' },
  imageCountBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  imageCountText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  thumbnailList: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  thumbnailButton: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    opacity: 0.72,
  },
  thumbnailSelected: { borderColor: colors.primary, opacity: 1 },
  thumbnailImage: { width: '100%', height: '100%', backgroundColor: colors.surface },
  likeBtn: {
    padding: 6,
  },
  content: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerCity: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  guaranteeText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  chatBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    gap: 6,
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionIcon: {
    flexShrink: 0,
  },
  buyBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 6,
  },
  buyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ProductDetailScreen;
