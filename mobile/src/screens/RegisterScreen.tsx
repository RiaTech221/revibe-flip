import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { Phone, Lock, User, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

export const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = phone.startsWith('+') ? phone.trim() : `+221${phone.replace(/^0+/, '').trim()}`;
      const data = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        email: email.trim() || undefined,
        password,
        confirmPassword: password,
        countryCode: 'SN',
      });

      if (data?.token) {
        login(data.token, data.user);
        Alert.alert('Compte créé !', 'Bienvenue sur ReVibe FliP.', [
          { text: 'Commencer', onPress: () => navigation.navigate('MainTabs') },
        ]);
      } else {
        Alert.alert('Inscription réussie', 'Vous pouvez maintenant vous connecter.', [
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || "L'inscription a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack onBack={() => navigation.goBack()} title="Créer un compte" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
              secureTextEntry
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
  header: {
    marginBottom: 24,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
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
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
