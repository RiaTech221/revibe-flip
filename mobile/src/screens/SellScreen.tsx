/**
 * Écran de Mise en Vente (SellScreen) ReVibe FliP Mobile
 * 
 * Formulaire ergonomique pour publier un article en vente :
 *  * - Sélection des photos et informations clés (titre, description, catégorie, marque, état)
 *  * - Saisie du prix de vente en FCFA
 *  * - Carte de calcul instantané de la commission et du montant net versé au vendeur
 *  * - Validation des champs et soumission vers l'API
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Category, ProductCondition } from '../types';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  CommissionCalculatorCard,
  ConditionSelector,
  CategoryPicker,
} from '../components/sell';
import { productService, sellerService, SellerEligibility } from '../services';
import { AlertCircle, Camera, CheckCircle, MapPin, RefreshCw, Store } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const SellScreen = ({ navigation, route }: any) => {
  const { isAuthenticated, user, token, login } = useAuth();
  const openedFromSellerSpace = route?.params?.skipSellerSpaceRedirect === true;

  const [eligibility, setEligibility] = useState<SellerEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState('');
  const [eligibilityRetry, setEligibilityRetry] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const hasOpenedSellerSpace = useRef(false);
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
  const [imageUrl, setImageUrl] = useState('');
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
      if (openedFromSellerSpace) hasOpenedSellerSpace.current = true;

      sellerService
        .getEligibility()
        .then((result) => {
          if (!active) return;
          setEligibility(result);
          const sellerAccess = result.eligible || result.alreadySeller;
          navigation.setOptions({ tabBarLabel: sellerAccess ? 'Vendre' : 'Vendeur' });

          if (sellerAccess && !hasOpenedSellerSpace.current) {
            hasOpenedSellerSpace.current = true;
            navigation.navigate('SellerSpace', { eligible: result.eligible });
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
    }, [eligibilityRetry, isAuthenticated, navigation, openedFromSellerSpace]),
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

  const price = parseFloat(priceStr) || 0;

  const handleProfileSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !profileCity.trim() || address.trim().length < 5) {
      Alert.alert(
        'Coordonnées incomplètes',
        'Renseignez votre prénom, votre nom, votre ville et une adresse d’au moins 5 caractères.',
      );
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
      navigation.setOptions({ tabBarLabel: result.eligible || result.alreadySeller ? 'Vendre' : 'Vendeur' });

      if (result.eligible) {
        hasOpenedSellerSpace.current = true;
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

  const showSellerOnboarding = Boolean(
    eligibility && !eligibility.eligible && (!eligibility.alreadySeller || hasOpenedSellerSpace.current),
  );

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
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Votre nom" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

            <Text style={styles.label}>Email (facultatif)</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="vous@exemple.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>Ville de résidence *</Text>
            <TextInput style={styles.input} value={profileCity} onChangeText={setProfileCity} placeholder="Ex. Dakar" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

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
            Alert.alert('Téléversement photo', 'Sélectionnez une photo depuis votre galerie via le sélecteur de média.')
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
