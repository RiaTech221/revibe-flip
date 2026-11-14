/**
 * Écran Détail Produit (ProductDetailScreen) ReVibe FliP Mobile
 * 
 * Fiche descriptive complète d'une annonce d'article :
 *  * - Galerie d'images haute définition avec carrousel horizontal
 *  * - Informations produit : titre, prix FCFA, marque, taille, état certifié, localisation
 *  * - Badge Bouclier Séquestre ReVibe Shield rappelant la protection des fonds acheteur
 *  * - Barre d'actions inférieure : bouton "Acheter maintenant" et "Négocier / Faire une offre"
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Product } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { EscrowBadge } from '../components/common/EscrowBadge';
import { productService } from '../services';
import { Heart, MessageCircle, ShoppingBag, ShieldCheck, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const productId = route.params.productId || route.params.id;
  const [product, setProduct] = useState<Product | null>(route.params.product || null);
  const [loading, setLoading] = useState(!route.params.product);
  const [isLiked, setIsLiked] = useState(false);

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

  const imageUrl =
    product.primaryImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        title={product.title}
        rightAction={
          <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.likeBtn}>
            <Heart
              size={22}
              color={isLiked ? colors.danger : colors.textPrimary}
              fill={isLiked ? colors.danger : 'transparent'}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Product Image */}
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/logo.png')}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          {/* Price & Escrow Badge */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <EscrowBadge />
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
              <Text style={styles.tagText}>{product.condition}</Text>
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
                <Text style={styles.sellerCity}>{product.city || 'Dakar, Sénégal'}</Text>
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
                Votre argent est bloqué sur un compte séquestre. Le vendeur n'est payé que lorsque vous validez votre article.
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
          <MessageCircle size={20} color={colors.primary} />
          <Text style={styles.chatBtnText}>Négocier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('Checkout', { product })}
        >
          <ShoppingBag size={20} color="#ffffff" />
          <Text style={styles.buyBtnText}>Acheter (Séquestre)</Text>
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
    gap: 12,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    gap: 8,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  buyBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ProductDetailScreen;
