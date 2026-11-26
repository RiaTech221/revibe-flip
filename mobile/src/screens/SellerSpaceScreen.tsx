/** Espace vendeur mobile avec accès direct à la publication d'annonce. */

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AlertCircle, ArrowRight, BadgeCheck, PackagePlus, Pencil, Store } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Product } from '../types';
import { sellerService } from '../services';
import { colors, formatPrice } from '../theme/colors';

export const SellerSpaceScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const profileEligible = route.params?.eligible !== false;
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setProductsLoading(true);
      sellerService.getProducts()
        .then((items) => { if (active) setProducts(items); })
        .catch(() => { if (active) Alert.alert('Erreur', 'Impossible de charger vos annonces.'); })
        .finally(() => { if (active) setProductsLoading(false); });
      return () => { active = false; };
    }, []),
  );

  const openListingForm = () => {
    navigation.navigate('MainTabs', {
      screen: 'Vendre',
      params: { skipSellerSpaceRedirect: true, editProduct: undefined, formSessionId: Date.now() },
    });
  };

  const editProduct = (product: Product) => {
    navigation.navigate('EditProduct', { product });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Espace Vendeur" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.storeIcon}>
            <Store size={28} color={colors.primary} />
          </View>
          <Text style={styles.eyebrow}>VOTRE BOUTIQUE REVIBE</Text>
          <Text style={styles.title}>Bienvenue{user?.firstName ? `, ${user.firstName}` : ''} !</Text>
          <Text style={styles.description}>
            {profileEligible
              ? 'Votre espace vendeur est prêt. Publiez vos articles et donnez-leur une seconde vie.'
              : 'Consultez votre espace vendeur et complétez vos coordonnées avant de publier.'}
          </Text>
          <View style={[styles.readyBadge, !profileEligible && styles.incompleteBadge]}>
            {profileEligible ? <BadgeCheck size={16} color={colors.success} /> : <AlertCircle size={16} color="#B45309" />}
            <Text style={[styles.readyText, !profileEligible && styles.incompleteText]}>
              {profileEligible ? 'Profil vendeur complet' : 'Coordonnées à compléter avant de publier'}
            </Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <PackagePlus size={22} color={colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Mettre un article en vente</Text>
            <Text style={styles.actionDescription}>
              {profileEligible
                ? 'Ajoutez vos photos, décrivez l’article et fixez votre prix.'
                : 'Complétez les informations demandées avant de publier votre article.'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Vendre un article"
            style={styles.actionButton}
            onPress={openListingForm}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Vendre</Text>
            <ArrowRight size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.listingsSection}>
          <Text style={styles.listingsTitle}>Mes annonces</Text>
          {productsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.listingsLoading} />
          ) : products.length === 0 ? (
            <Text style={styles.emptyListings}>Vos articles publiés apparaîtront ici.</Text>
          ) : products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <ImageWithFallback
                uri={product.primaryImage || product.images?.[0]}
                label={product.title}
                style={styles.productImage}
              />
              <View style={styles.productCopy}>
                <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                <Text style={styles.productStatus}>{product.status === 'ACTIVE' ? 'En vente' : product.status === 'SOLD' ? 'Vendu' : product.status === 'DRAFT' ? 'Brouillon' : 'Indisponible'}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Modifier ${product.title}`}
                style={styles.editProductButton}
                onPress={() => editProduct(product)}
              >
                <Pencil size={17} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.75}
        >
          <Pencil size={17} color={colors.primary} />
          <Text style={styles.editProfileText}>Modifier mes coordonnées</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Un conseil pour bien commencer</Text>
          <Text style={styles.tipText}>
            Des photos lumineuses et une description précise aident les acheteurs à choisir votre article.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 36 },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  storeIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 310,
    textAlign: 'center',
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  incompleteBadge: { backgroundColor: colors.warningLight },
  incompleteText: { color: '#92400E' },
  actionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCopy: { marginBottom: 16 },
  actionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  actionDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 14,
  },
  actionButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  listingsSection: { marginTop: 22 },
  listingsTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  listingsLoading: { padding: 20 },
  emptyListings: { backgroundColor: colors.white, borderRadius: 14, color: colors.textSecondary, padding: 16 },
  productRow: {
    alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border,
    borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 9, padding: 10,
  },
  productImage: { backgroundColor: colors.background, borderRadius: 10, height: 64, width: 64 },
  productCopy: { flex: 1, minWidth: 0 },
  productTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  productPrice: { color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 3 },
  productStatus: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  editProductButton: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  editProfileButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  editProfileText: { color: colors.primary, flex: 1, fontSize: 13, fontWeight: '700' },
  tipCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
  },
  tipTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  tipText: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 5 },
});

export default SellerSpaceScreen;
