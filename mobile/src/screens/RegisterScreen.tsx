/**
 * Écran d'Inscription (RegisterScreen) ReVibe FliP Mobile
 *
 * Inscription par numéro de téléphone sénégalais (+221) uniquement
 * suivie de l'écran de validation OTP à 2 boutons (Passer / Valider le code).
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
import { Phone, ShieldCheck } from 'lucide-react-native';
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
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [fullPhoneForOtp, setFullPhoneForOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
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
        {!isOtpStep ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Rejoignez la communauté</Text>
              <Text style={styles.subtitle}>
                Entrez votre numéro sénégalais pour recevoir votre code de vérification par SMS.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de téléphone *</Text>
              <View style={styles.phoneInputWrap}>
                <View style={styles.prefixBadge}>
                  <Text style={styles.prefixText}>🇸🇳 +221</Text>
                </View>
                <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phoneDisplay}
                  onChangeText={(txt) => setPhoneDisplay(formatSenegalPhone(txt))}
                  placeholder="7X XXX XX XX"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={12}
                />
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
                <Text style={styles.buttonText}>Continuer</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Déjà inscrit ?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.otpIconWrap}>
                <ShieldCheck size={28} color={colors.primary} />
              </View>
              <Text style={styles.title}>Validation SMS</Text>
              <Text style={styles.subtitle}>
                Saisissez le code à 6 chiffres envoyé au {fullPhoneForOtp}.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Code OTP</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpCode}
                  onChangeText={(txt) => setOtpCode(txt.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.twoBtnRow}>
              <TouchableOpacity
                style={[styles.skipButton, loading && styles.buttonDisabled]}
                onPress={handleSkipOtp}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Passer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.validateButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Valider le code</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resendWrap} onPress={handleResend} disabled={loading}>
              <Text style={styles.footerLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          </>
        )}
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
