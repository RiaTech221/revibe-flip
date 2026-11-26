/**
 * Écran de Mise en Vente (SellScreen) ReVibe FliP Mobile
 * 
 * Formulaire ergonomique pour publier un article en vente :
 *  * - Sélection des photos et informations clés (titre, description, catégorie, marque, état)
 *  * - Saisie du prix de vente en FCFA
 *  * - Carte de calcul instantané de la commission et du montant net versé au vendeur
 *  * - Validation des champs et soumission vers l'API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Category, Product, ProductCondition } from '../types';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import {
  CommissionCalculatorCard,
  ConditionSelector,
  CategoryPicker,
} from '../components/sell';
import { productService, sellerService, uploadService, SellerEligibility } from '../services';
import { AlertCircle, Camera, CheckCircle, MapPin, RefreshCw, Store, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

type ListingImage = { uri: string; asset?: ImagePicker.ImagePickerAsset };

export const SellScreen = ({ navigation, route }: any) => {
  const { isAuthenticated, user, token, login } = useAuth();
  const openedFromSellerSpace = route?.params?.skipSellerSpaceRedirect === true;
  const editingProduct: Product | undefined = route?.params?.product || route?.params?.editProduct;

  const [eligibility, setEligibility] = useState<SellerEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState('');
  const [eligibilityRetry, setEligibilityRetry] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileCity, setProfileCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [city, setCity] = useState(user?.city || 'Dakar');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState<ProductCondition>('VERY_GOOD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImages, setSelectedImages] = useState<ListingImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        navigation.navigate('Login');
        return undefined;
      }

      let active = true;
      setEligibilityLoading(true);
      setEligibilityError('');
      setEligibility(null);
      sellerService
        .getEligibility()
        .then((result) => {
          if (!active) return;
          setEligibility(result);
          if (!editingProduct) {
            navigation.setOptions({
              tabBarLabel: result.eligible ? 'Vendre' : result.alreadySeller ? 'Compléter' : 'Vendeur',
            });
          }
        })
        .catch((err: any) => {
          if (!active) return;
          setEligibilityError(err.response?.data?.message || 'Impossible de vérifier votre profil vendeur.');
        })
        .finally(() => {
          if (active) setEligibilityLoading(false);
        });

      return () => {
        active = false;
      };
    }, [eligibilityRetry, editingProduct?.id, isAuthenticated, navigation, openedFromSellerSpace]),
  );

  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
      })
      .catch((err) => console.warn('Error loading categories', err));
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setDescription(editingProduct.description || '');
      setPriceStr(String(editingProduct.price));
      setBrand(editingProduct.brand || '');
      setSize(editingProduct.size || '');
      setCity(editingProduct.locationCity || user?.city || 'Dakar');
      setSelectedCategoryId(editingProduct.categoryId || editingProduct.category?.id || null);
      setCondition(editingProduct.condition);
      const imageUrls = editingProduct.images?.length
        ? editingProduct.images
        : editingProduct.primaryImage
          ? [editingProduct.primaryImage]
          : [];
      setSelectedImages(imageUrls.map((uri) => ({ uri })));
      return;
    }

    if (openedFromSellerSpace) {
      setTitle('');
      setDescription('');
      setPriceStr('');
      setBrand('');
      setSize('');
      setCity(user?.city || 'Dakar');
      setCondition('VERY_GOOD');
      setSelectedCategoryId(null);
      setSelectedImages([]);
    }
  }, [editingProduct?.id, openedFromSellerSpace, route?.params?.formSessionId, user?.city]);

  const price = parseFloat(priceStr) || 0;
  const maxPhotos = 5;

  const handlePickImages = async () => {
    const remainingSlots = maxPhotos - selectedImages.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu’à ${maxPhotos} photos.`);
      return;
    }

    setUploadingImages(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Accès aux photos refusé',
          'Autorisez ReVibe FliP à accéder à vos photos dans les réglages pour ajouter des images à votre article.',
          permission.canAskAgain
            ? [{ text: 'Compris', style: 'cancel' }]
            : [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Réglages', onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (!result.canceled) {
        setSelectedImages((current) => [
          ...current,
          ...result.assets.map((asset) => ({ uri: asset.uri, asset })),
        ].slice(0, maxPhotos));
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d’ouvrir votre galerie.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (uri: string) => {
    setSelectedImages((current) => current.filter((image) => image.uri !== uri));
  };

  const handleProfileSave = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2 || profileCity.trim().length < 2 || address.trim().length < 5) {
      Alert.alert(
        'Coordonnées incomplètes',
        'Le prénom et le nom doivent contenir au moins 2 caractères, la ville au moins 2 caractères et l’adresse au moins 5 caractères.',
      );
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Email invalide', 'Vérifiez le format de votre adresse e-mail.');
      return;
    }

    setProfileSaving(true);
    try {
      const updatedProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        city: profileCity.trim(),
        address: address.trim(),
      };
      await sellerService.updateProfile(updatedProfile);
      setCity(updatedProfile.city);

      if (token && user) {
        login(token, {
          ...user,
          ...updatedProfile,
          email: updatedProfile.email || undefined,
          fullName: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
        });
      }

      const result = await sellerService.getEligibility();
      setEligibility(result);
      navigation.setOptions({
        tabBarLabel: result.eligible ? 'Vendre' : result.alreadySeller ? 'Compléter' : 'Vendeur',
      });

      if (result.eligible) {
        navigation.navigate('SellerSpace', { eligible: result.eligible });
      } else {
        const details = [
          ...(result.missingFields || []).map((field) => `Champ manquant : ${field}`),
          ...Object.values(result.invalidFields || {}),
        ].join('\n');
        Alert.alert('Informations à vérifier', details || result.message || 'Votre profil doit être complété.');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d’enregistrer vos coordonnées.');
    } finally {
      setProfileSaving(false);
    }
  };

  const showSellerOnboarding = Boolean(eligibility && !eligibility.eligible && !editingProduct);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Espace vendeur" />
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Connectez-vous pour vendre</Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.submitButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (eligibilityLoading || !eligibility) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Vérification du profil" />
        <View style={styles.centerState}>
          {eligibilityError ? (
            <>
              <AlertCircle size={30} color={colors.warning} />
              <Text style={styles.stateTitle}>{eligibilityError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setEligibilityRetry((retry) => retry + 1)}
              >
                <RefreshCw size={17} color={colors.primary} />
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.stateTitle}>Vérification de vos coordonnées…</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (showSellerOnboarding) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Coordonnées vendeur" />
        <ScrollView
          contentContainerStyle={styles.onboardingContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.onboardingIntro}>
            <View style={styles.onboardingIcon}>
              <Store size={24} color={colors.primary} />
            </View>
            <Text style={styles.onboardingTitle}>Préparez votre espace vendeur</Text>
            <Text style={styles.onboardingDescription}>
              Complétez vos coordonnées pour publier vos articles et faciliter la livraison.
            </Text>
          </View>

          {(eligibility.missingFields?.length > 0 || Object.keys(eligibility.invalidFields || {}).length > 0) && (
            <View style={styles.missingFieldsCard}>
              <AlertCircle size={18} color={colors.warning} />
              <View style={styles.missingFieldsCopy}>
                <Text style={styles.missingFieldsTitle}>Informations à compléter</Text>
                {!!eligibility.missingFields?.length && (
                  <Text style={styles.missingFieldsText}>{eligibility.missingFields.join(', ')}</Text>
                )}
                {Object.values(eligibility.invalidFields || {}).map((message, index) => (
                  <Text key={`${index}-${message}`} style={styles.missingFieldsText}>{message}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.profileCard}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" placeholderTextColor={colors.textMuted} autoCapitalize="words" maxLength={60} />

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Votre nom" placeholderTextColor={colors.textMuted} autoCapitalize="words" maxLength={60} />

            <Text style={styles.label}>Email (facultatif)</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="vous@exemple.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={120} />

            <Text style={styles.label}>Ville de résidence *</Text>
            <TextInput style={styles.input} value={profileCity} onChangeText={setProfileCity} placeholder="Ex. Dakar" placeholderTextColor={colors.textMuted} autoCapitalize="words" maxLength={100} />

            <Text style={styles.label}>Adresse par défaut *</Text>
            <View style={styles.addressInputWrap}>
              <MapPin size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Quartier, rue, numéro…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="sentences"
                multiline
                maxLength={200}
              />
            </View>
            <Text style={styles.fieldHint}>Indiquez au moins 5 caractères pour votre adresse.</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, profileSaving && styles.btnDisabled]}
            onPress={handleProfileSave}
            disabled={profileSaving}
            activeOpacity={0.85}
          >
            {profileSaving ? <ActivityIndicator color={colors.white} /> : <CheckCircle size={19} color={colors.white} />}
            <Text style={styles.submitButtonText}>{profileSaving ? 'Enregistrement…' : 'Enregistrer et continuer'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || price <= 0 || !selectedCategoryId) {
      Alert.alert('Champs requis', 'Veuillez renseigner un titre, un prix et une catégorie.');
      return;
    }
    if (editingProduct && description.trim().length < 10) {
      Alert.alert('Description trop courte', 'La description doit contenir au moins 10 caractères.');
      return;
    }
    if (editingProduct && selectedImages.length === 0) {
      Alert.alert('Photo obligatoire', 'Conservez ou ajoutez au moins une photo pour cette annonce.');
      return;
    }

    setLoading(true);
    try {
      const imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        for (const image of selectedImages) {
          imageUrls.push(image.asset ? await uploadService.uploadProductImage(image.asset) : image.uri);
        }
      }

      if (editingProduct) {
        await sellerService.updateProduct(editingProduct.id, {
          title: title.trim(),
          description: description.trim(),
          price,
          originalPrice: editingProduct.originalPrice,
          categoryId: selectedCategoryId,
          condition,
          brand: brand.trim() || undefined,
          size: size.trim() || undefined,
          color: editingProduct.color,
          defects: editingProduct.defects,
          measurements: editingProduct.measurements,
          locationCity: city,
          images: imageUrls,
          isDraft: editingProduct.status === 'DRAFT',
        });
        Alert.alert('Annonce modifiée', 'Les changements ont été enregistrés.', [
          { text: 'Terminé', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const created = await productService.createProduct({
        title: title.trim(),
        description: description.trim(),
        price,
        categoryId: selectedCategoryId,
        condition,
        brand: brand.trim() || undefined,
        size: size.trim() || undefined,
        locationCity: city,
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });

      Alert.alert('Succès !', 'Votre annonce a été publiée avec succès.', [
        {
          text: 'Voir mon article',
          onPress: () => {
            navigation.navigate('ProductDetail', { id: created.id });
          },
        },
      ]);
    } catch (err: any) {
      const responseData = err.response?.data;
      const validationMessages = responseData?.data && typeof responseData.data === 'object'
        ? Object.values(responseData.data).filter((message): message is string => typeof message === 'string')
        : [];
      const message = validationMessages.length
        ? validationMessages.join('\n')
        : responseData?.message || err.message || (editingProduct
          ? 'Impossible d’enregistrer les modifications.'
          : 'Impossible de créer votre annonce.');
      const trackingId = responseData?.trackingId;
      Alert.alert(
        'Erreur',
        trackingId ? `${message}\n\nRéférence : ${trackingId}` : message,
      );
    } finally {
      setUploadingImages(false);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={editingProduct ? 'Modifier l’annonce' : 'Déposer une annonce'}
        showBack={!!editingProduct}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Box */}
        <View style={styles.photoSection}>
          <View style={styles.photoSectionHeader}>
            <Text style={styles.photoSectionTitle}>Photos de l’article</Text>
            <Text style={styles.photoCount}>{selectedImages.length}/{maxPhotos}</Text>
          </View>
          <TouchableOpacity
            style={[styles.photoBox, (uploadingImages || loading) && styles.btnDisabled]}
            onPress={handlePickImages}
            disabled={uploadingImages || loading}
            activeOpacity={0.8}
          >
            {uploadingImages ? <ActivityIndicator color={colors.primary} /> : <Camera size={26} color={colors.primary} />}
            <Text style={styles.photoText}>
              {uploadingImages ? 'Préparation des photos…' : 'Ouvrir la galerie'}
            </Text>
            <Text style={styles.photoHint}>JPEG, PNG ou WebP • jusqu’à 5 photos</Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoPreviewList}>
              {selectedImages.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.photoPreviewWrap}>
                  <ImageWithFallback uri={image.uri} label={title} style={styles.photoPreview} />
                  {index === 0 && (
                    <View style={styles.primaryPhotoBadge}>
                      <Text style={styles.primaryPhotoText}>Principale</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemoveImage(image.uri)}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer la photo ${index + 1}`}
                  >
                    <X size={15} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

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
            {loading
              ? (uploadingImages ? 'Envoi des photos…' : editingProduct ? 'Enregistrement…' : 'Publication…')
              : editingProduct ? 'Enregistrer les modifications' : 'Mettre en vente avec Séquestre'}
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  onboardingContainer: { padding: 16, paddingBottom: 40 },
  onboardingIntro: { alignItems: 'center', marginBottom: 18, paddingHorizontal: 12, paddingTop: 6 },
  onboardingIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  onboardingTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  onboardingDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  missingFieldsCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    padding: 13,
  },
  missingFieldsCopy: { flex: 1 },
  missingFieldsTitle: { color: '#92400E', fontSize: 13, fontWeight: '800', marginBottom: 3 },
  missingFieldsText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  profileCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
    padding: 16,
  },
  addressInputWrap: {
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  addressInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 42,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  fieldHint: { color: colors.textSecondary, fontSize: 11, marginTop: 6 },
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
  photoSection: { marginBottom: 8 },
  photoSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photoSectionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  photoCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  photoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  photoHint: { color: colors.textSecondary, fontSize: 11 },
  photoPreviewList: { gap: 10, paddingBottom: 14, paddingTop: 2 },
  photoPreviewWrap: { height: 88, position: 'relative', width: 88 },
  photoPreview: { backgroundColor: colors.borderLight, borderRadius: 12, height: 88, width: 88 },
  primaryPhotoBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 7,
    bottom: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
  },
  primaryPhotoText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  removePhotoButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.white,
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    top: -5,
    width: 26,
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
