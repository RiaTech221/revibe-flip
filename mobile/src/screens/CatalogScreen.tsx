import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Product, Category } from '../types';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { SearchBar } from '../components/common/SearchBar';
import { ProductCard } from '../components/common/ProductCard';
import { productService } from '../services';

export const CatalogScreen = ({ route, navigation }: any) => {
  const initialCatId = route.params?.categoryId;
  const initialQuery = route.params?.query || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCatId || null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 24 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (conditionFilter) params.condition = conditionFilter;

      const [prodList, catList] = await Promise.all([
        productService.getProducts(params),
        categories.length === 0 ? productService.getCategories() : Promise.resolve(categories),
      ]);

      setProducts(prodList);
      if (categories.length === 0) setCategories(catList);
    } catch (err) {
      console.warn('Error fetching catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, conditionFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Explorer le dressing" />

      {/* Search Input Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={fetchCatalog}
        onClear={() => {
          setSearchQuery('');
          fetchCatalog();
        }}
      />

      {/* Category Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, selectedCategory === null && styles.filterPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterText, selectedCategory === null && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedCategory(isSelected ? null : c.id)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucun vêtement trouvé</Text>
          <Text style={styles.emptySubtitle}>
            Modifiez vos filtres ou effectuez une autre recherche.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 40,
  },
});

export default CatalogScreen;
