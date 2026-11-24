/**
 * Écran d'Inscription (RegisterScreen) ReVibe FliP Mobile
 *
 * Formulaire de création de compte membre sur l'application mobile :
 *  * - Choix du pays de résidence et saisie des informations d'identité
 *  * - Création du mot de passe avec règles de complexité
 *  * - Envoi du code de vérification OTP
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { Phone, Lock, User, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

const formatSenegalPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ]
    .filter(Boolean)
    .join(' ');
};

export const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const digits = phoneDisplay.replace(/\D/g, '');
    if (!/^7\d{8}$/.test(digits)) {
      Alert.alert('Numéro invalide', 'Veuillez saisir un numéro sénégalais au format 7X XXX XX XX.');
      return;
    }

    const fullPhone = `+221${digits}`;
    setLoading(true);
    try {
      await authService.register({
        phone: fullPhone,
        countryCode: 'SN',
      });
      setFullPhoneForOtp(fullPhone);
      setIsOtpStep(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || "L'inscription a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      Alert.alert('Code requis', 'Veuillez saisir le code OTP reçu par SMS.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyOtp({
        phone: fullPhoneForOtp,
        otpCode: cleanOtp,
      });
      if (data?.token && data?.user) {
        login(data.token, data.user);
      }
      navigation.navigate('MainTabs');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Code OTP invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOtp = async () => {
    setLoading(true);
    try {
      const data = await authService.skipOtp(fullPhoneForOtp);
      if (data?.token && data?.user) {
        login(data.token, data.user);
      }
      navigation.navigate('MainTabs');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de passer la vérification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await authService.resendOtp(fullPhoneForOtp);
      Alert.alert('Code envoyé', 'Un nouveau code OTP a été envoyé par SMS.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible de renvoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => (isOtpStep ? setIsOtpStep(false) : navigation.goBack())}
        title={isOtpStep ? 'Vérification OTP' : 'Créer un compte'}
      />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rejoignez la communauté</Text>
            <Text style={styles.subtitle}>
              Achetez et vendez vos articles avec la protection du séquestre ReVibe Garanti.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>Prénom *</Text>
              <View style={styles.inputWrap}>
                <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ex: Amina"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>Nom *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Ex: Diallo"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Numéro de téléphone * (Wave / OM)</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="77 000 00 00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email (optionnel)</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="amina@exemple.sn"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                hitSlop={10}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  keyboardArea: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  otpIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefixBadge: {
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginLeft: 10,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  twoBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  validateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resendWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RegisterScreen;
