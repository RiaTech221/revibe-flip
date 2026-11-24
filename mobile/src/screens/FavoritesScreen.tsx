import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, Search } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/common/ProductCard';
import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../theme/colors';

export const FavoritesScreen = ({ navigation }: any) => {
  const { favorites } = useFavorites();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Mes Favoris" />
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Heart size={30} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Votre sélection, au même endroit</Text>
          <Text style={styles.emptyText}>
            Touchez le cœur d’un article pour le garder ici et le retrouver facilement.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Catalogue' })}
            activeOpacity={0.85}
          >
            <Search size={18} color={colors.white} />
            <Text style={styles.browseButtonText}>Explorer le catalogue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.count}>{favorites.length} article{favorites.length > 1 ? 's' : ''} enregistré{favorites.length > 1 ? 's' : ''}</Text>
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                />
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  browseButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 16, marginTop: 22,
  },
  browseButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  count: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12 },
  listContent: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 32 },
  cardWrap: { flex: 1, marginBottom: 8 },
});

export default FavoritesScreen;
