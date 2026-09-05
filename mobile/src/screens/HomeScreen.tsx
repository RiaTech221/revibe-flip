import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import api from '../api';

export const HomeScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=10&sortBy=createdAt&sortDir=desc'),
      api.get('/categories')
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data?.data?.content) setProducts(prodRes.data.data.content);
        if (catRes.data?.data) setCategories(catRes.data.data);
      })
      .catch((err) => console.log('Err loading mobile home', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => navigation.navigate('Vendre')}
          >
            <Text style={styles.sellButtonText}>+ Vendre</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>🇸🇳 SÉNÉGAL • SECONDE MAIN</Text>
          <Text style={styles.heroTitle}>Redonner une seconde vie à vos articles</Text>
          <Text style={styles.heroSubtitle}>
            Achetez et vendez avec Wave, Orange Money & Free Money en toute sécurité (Escrow).
          </Text>
        </View>

        {/* Categories Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.categoryChip}
              onPress={() => navigation.navigate('Catalogue', { categoryId: c.id })}
            >
              <Text style={styles.categoryChipText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Escrow Banner */}
        <View style={styles.escrowCard}>
          <Text style={styles.escrowTitle}>🛡️ Protection Escrow (1% de frais)</Text>
          <Text style={styles.escrowDesc}>
            Vos paiements sont bloqués sous séquestre jusqu'à ce que vous confirmiez avoir bien reçu l'article.
          </Text>
        </View>

        {/* Products Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dernières annonces</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7e22ce" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.productGrid}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('Detail', { id: p.id })}
              >
                <Image
                  source={{ uri: p.primaryImage || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b' }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productPrice}>{Number(p.price).toLocaleString()} FCFA</Text>
                  <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.productSeller}>{p.seller?.fullName} • {p.locationCity || 'Dakar'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf5ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 140,
    height: 40,
  },
  sellButton: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sellButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  heroCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#3b0764',
  },
  heroTag: {
    color: '#f472b6',
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#e9d5ff',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b21a8',
  },
  escrowCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  escrowTitle: {
    color: '#065f46',
    fontWeight: 'bold',
    fontSize: 13,
  },
  escrowDesc: {
    color: '#047857',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  productInfo: {
    padding: 10,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7e22ce',
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  productSeller: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
});
