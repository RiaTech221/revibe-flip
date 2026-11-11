import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Product, Category } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/common/ProductCard';
import { EscrowBadge } from '../components/common/EscrowBadge';
import { Sparkles, ArrowRight, Plus } from 'lucide-react-native';
import { productService } from '../services';

export const HomeScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productService.getProducts({ limit: 12, sortBy: 'createdAt', sortDir: 'desc' }),
        productService.getCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err) {
      console.warn('Error loading mobile home', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="ReVibe Sénégal"
        showSearch
        onSearchPress={() => navigation.navigate('Catalog')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Escrow Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={styles.heroBadgeText}>100% Sécurisé Wave & Orange Money</Text>
          </View>
          <Text style={styles.heroTitle}>Achetez & Vendez de la Seconde Main en toute confiance</Text>
          <Text style={styles.heroSubtitle}>
            Vos fonds restent consignés sous séquestre jusqu'à validation de votre commande.
          </Text>
          <EscrowBadge style={{ marginTop: 12 }} />
        </View>

        {/* Categories Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.seeAll}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Catalog', { categoryId: cat.id })}
            >
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nouveautés récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.seeAll}>Voir le feed</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.grid}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Sell Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('SellTab')}
      >
        <Plus size={24} color="#ffffff" />
        <Text style={styles.floatingButtonText}>Vendre un article</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroBanner: {
    backgroundColor: '#EEF2FF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default HomeScreen;
