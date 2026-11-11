/**
 * Point d'Entrée Principal ReVibe FliP Mobile (React Native / Expo)
 * 
 * Composant racine de l'application mobile ReVibe FliP :
 *  * - Configure le conteneur SafeAreaProvider pour les encoches et barres système
 *  * - Enveloppe l'arbre dans le contexte d'authentification AuthProvider
 *  * - Initialise le conteneur de navigation principal NavigationContainer
 *  * - Affiche la StatusBar avec le style adapté à la charte graphique
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Point d'entrée principal de l'application ReVibe FliP Mobile (React Native / Expo).
 * Fournit le contexte d'authentification et l'arbre de navigation complet.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
