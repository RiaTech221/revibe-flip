/** Modification des coordonnées personnelles et de livraison du compte. */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle, MapPin } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { sellerService } from '../services';
import { colors } from '../theme/colors';

export const EditProfileScreen = ({ navigation }: any) => {
  const { isAuthenticated, user, token, login } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setCity(user?.city || '');
    setAddress(user?.address || '');
  }, [user]);

  const handleSave = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2 || city.trim().length < 2 || address.trim().length < 5) {
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

    setSaving(true);
    const updatedProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      city: city.trim(),
      address: address.trim(),
    };

    try {
      await sellerService.updateProfile(updatedProfile);
      if (user && token) {
        login(token, {
          ...user,
          ...updatedProfile,
          email: updatedProfile.email || undefined,
          fullName: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
        });
      }
      Alert.alert('Profil mis à jour', 'Vos coordonnées ont bien été enregistrées.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de mettre à jour vos coordonnées.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Modifier mon profil" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerState}>
          <Text style={styles.description}>Connectez-vous pour modifier vos coordonnées.</Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.saveButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Modifier mon profil" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.title}>Coordonnées personnelles & livraison</Text>
            <Text style={styles.description}>
              Ces informations servent à votre profil et préremplissent les détails de livraison. L’adresse est requise pour publier un article.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Votre prénom"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={60}
            />

            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Votre nom"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={60}
            />

            <Text style={styles.label}>Email (facultatif)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={120}
            />

            <Text style={styles.label}>Ville de résidence *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex. Dakar"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={100}
            />

            <Text style={styles.label}>Adresse par défaut *</Text>
            <View style={styles.addressWrap}>
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
            <Text style={styles.hint}>L’adresse doit contenir au moins 5 caractères pour vendre.</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color={colors.white} /> : <CheckCircle size={19} color={colors.white} />}
            <Text style={styles.saveButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer mes coordonnées'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  intro: { marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  formCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addressWrap: {
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
    minHeight: 48,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  hint: { color: colors.textSecondary, fontSize: 11, marginTop: 6 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 15,
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

export default EditProfileScreen;
