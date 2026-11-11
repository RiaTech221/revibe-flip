import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Category, ProductCondition } from '../types';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  CommissionCalculatorCard,
  ConditionSelector,
  CategoryPicker,
} from '../components/sell';
import { productService } from '../services';
import { Camera, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const SellScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [city, setCity] = useState('Dakar');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState<ProductCondition>('VERY_GOOD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
      })
      .catch((err) => console.warn('Error loading categories', err));
  }, []);

  const price = parseFloat(priceStr) || 0;

  const handleSubmit = async () => {
    if (!title.trim() || price <= 0 || !selectedCategoryId) {
      Alert.alert('Champs requis', 'Veuillez renseigner un titre, un prix et une catégorie.');
      return;
    }

    setLoading(true);
    try {
      const created = await productService.createProduct({
        title: title.trim(),
        description: description.trim(),
        price,
        categoryId: selectedCategoryId,
        condition,
        brand: brand.trim() || undefined,
        size: size.trim() || undefined,
        city,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      });

      Alert.alert('Succès !', 'Votre annonce a été publiée avec succès.', [
        {
          text: 'Voir mon article',
          onPress: () => {
            navigation.navigate('Catalog');
            navigation.navigate('ProductDetail', { productId: created.id });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de créer votre annonce.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Déposer une annonce" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Box */}
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() =>
            setImageUrl(
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'
            )
          }
        >
          <Camera size={28} color={colors.primary} />
          <Text style={styles.photoText}>
            {imageUrl ? 'Photo ajoutée avec succès ✓' : 'Ajouter des photos du vêtement'}
          </Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Titre de l'annonce *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Veste en jean vintage Levi's"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Prix de vente (FCFA) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 15000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={priceStr}
            onChangeText={setPriceStr}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Détaillez la coupe, la matière, l'usure éventuelle..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Marque</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Zara"
                placeholderTextColor={colors.textSecondary}
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Taille</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: M / 38"
                placeholderTextColor={colors.textSecondary}
                value={size}
                onChangeText={setSize}
              />
            </View>
          </View>
        </View>

        {/* Category Picker Subcomponent */}
        <CategoryPicker
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        {/* Condition Selector Subcomponent */}
        <ConditionSelector
          selectedCondition={condition}
          onSelect={setCondition}
        />

        {/* Commission Calculator Subcomponent */}
        {price > 0 && <CommissionCalculatorCard price={price} />}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <CheckCircle size={20} color="#ffffff" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Publication...' : 'Mettre en vente avec Séquestre'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  photoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  photoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  inputCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SellScreen;
