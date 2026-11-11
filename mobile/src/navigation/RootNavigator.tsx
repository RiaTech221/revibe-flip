/**
 * Navigateur Racine (Stack Navigator) ReVibe FliP Mobile
 * 
 * Définit la pile principale d'écrans de l'application :
 *  * - Onglets principaux MainTabs (TabNavigator)
 *  * - Écrans de détails : fiche article (ProductDetail), fil de chat (Chat), tunnel d'achat (Checkout), commande (OrderDetail)
 *  * - Écrans d'authentification : connexion (Login), inscription (Register)
 *  * - Animations de transition fluide slide_from_right
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { TabNavigator } from './TabNavigator';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};
