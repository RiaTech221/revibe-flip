/**
 * Écran Espace Profil (ProfileScreen) ReVibe FliP Mobile
 * 
 * Gestion du compte et vue d'ensemble de l'activité utilisateur :
 *  * - En-tête de profil avec avatar, note moyenne, Trust Score et pays de résidence
 *  * - Raccourcis vers Mes Achats, Mes Ventes, Paramètres de sécurité, Aide & FAQ
 *  * - Bouton de déconnexion sécurisée
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import { UserProfileHeader, ProfileMenuItem, TransactionsSection } from '../components/profile';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  User,
} from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.navigate('Login');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Mon Profil" />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <User size={40} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Connectez-vous à ReVibe</Text>
          <Text style={styles.guestSubtitle}>
            Accédez à vos commandes, vos ventes et sécurisez vos transactions par séquestre.
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>Se connecter / S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Mon Profil" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* User Profile Header Subcomponent */}
        <UserProfileHeader user={user} />

        {/* Section dédiée : Mes commandes / Mes transactions (Acheteur & Vendeur) */}
        <TransactionsSection
          navigation={navigation}
          mode="both"
          refreshKey={refreshKey}
        />

        <Text style={styles.sectionTitle}>Favoris</Text>
        <ProfileMenuItem
          icon={<Heart size={20} color="#EC4899" />}
          label="Mes Favoris"
          onPress={() => navigation.navigate('Favorites')}
        />

        {/* Menu Section: Paramètres & Aide */}
        <Text style={styles.sectionTitle}>Support & Sécurité</Text>
        <ProfileMenuItem
          icon={<CreditCard size={20} color={colors.textSecondary} />}
          label="Comptes Wave & Orange Money"
          onPress={() => {}}
        />
        <ProfileMenuItem
          icon={<Settings size={20} color={colors.textSecondary} />}
          label="Paramètres du compte"
          onPress={() => {}}
        />
        <ProfileMenuItem
          icon={<HelpCircle size={20} color={colors.textSecondary} />}
          label="Centre d'aide ReVibe"
          onPress={() => {}}
        />

        {/* Logout */}
        <View style={styles.logoutWrapper}>
          <ProfileMenuItem
            icon={<LogOut size={20} color={colors.danger} />}
            label="Se déconnecter"
            onPress={handleLogout}
            isDestructive
          />
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
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutWrapper: {
    marginTop: 20,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
