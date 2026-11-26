/**
 * Écran de Réinitialisation de Mot de Passe (ForgotPasswordScreen) ReVibe FliP Mobile
 *
 * Flux en 2 étapes aligné avec le backend :
 *  1. Saisie du numéro de téléphone et envoi du code OTP SMS (/auth/forgot-password)
 *  2. Saisie du code OTP + nouveau mot de passe (/auth/reset-password)
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
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Phone, Lock, KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { authService } from '../services';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const normalizePhone = (raw: string): string => {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (/^7\d{8}$/.test(cleaned)) {
    return `+221${cleaned}`;
  }
  return cleaned;
};

export const ForgotPasswordScreen = ({ route, navigation }: any) => {
  const initialIdentifier: string = route?.params?.initialIdentifier || '';
  const initialPhone = initialIdentifier.includes('@') ? '' : initialIdentifier;

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [phone, setPhone] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    const normalized = normalizePhone(phone.trim());
    if (!normalized || normalized.length < 8) {
      Alert.alert('Numéro requis', 'Veuillez saisir le numéro de téléphone associé à votre compte.');
      return;
    }

    setLoading(true);
    try {
      const msg = await authService.forgotPassword(normalized);
      setPhone(normalized);
      setStep('reset');
      Alert.alert(
        'Code envoyé',
        msg || 'Si ce numéro est associé à un compte, un code de réinitialisation a été envoyé par SMS.'
      );
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.response?.data?.message || "Impossible d'envoyer le code de réinitialisation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalized = normalizePhone(phone.trim());
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length < 4) {
      Alert.alert('Code requis', 'Veuillez saisir le code OTP reçu par SMS.');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      Alert.alert(
        'Mot de passe invalide',
        'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        phone: normalized,
        otpCode: cleanOtp,
        newPassword,
      });
      Alert.alert(
        'Mot de passe réinitialisé',
        'Votre nouveau mot de passe a été enregistré. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Login', { prefilledIdentifier: normalized }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.response?.data?.message || 'Code OTP invalide ou expiré.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => (step === 'reset' ? setStep('request') : navigation.goBack())}
        title="Mot de passe oublié"
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
            <Text style={styles.title}>
              {step === 'request' ? 'Récupérer votre accès' : 'Nouveau mot de passe'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'request'
                ? 'Entrez votre numéro de téléphone pour recevoir un code de réinitialisation par SMS (valable 10 minutes).'
                : `Saisissez le code reçu au ${phone} puis choisissez votre nouveau mot de passe.`}
            </Text>
          </View>

          {step === 'request' ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <View style={styles.inputWrap}>
                  <Phone size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+221 77 000 00 00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Envoyer le code par SMS</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Code OTP reçu par SMS</Text>
                <View style={styles.inputWrap}>
                  <KeyRound size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/\D/g, ''))}
                    placeholder="123456"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={styles.inputWrap}>
                  <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min. 8 car., 1 maj., 1 min., 1 chiffre"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((visible) => !visible)}
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

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.inputWrap}>
                  <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>Renvoyer un code par SMS</Text>
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
  keyboardArea: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  otpInput: {
    fontWeight: '800',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
