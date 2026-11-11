/**
 * Barre de Navigation par Onglets Inférieurs ReVibe FliP Mobile
 * 
 * Configure la barre d'onglets tactile permanente (Bottom Tab Navigator) :
 *  * - Accueil : découverte des pépites et sélections phares
 *  * - Explorer : recherche et filtrage multi-critères du catalogue
 *  * - Vendre : bouton central surélevé pour publier une annonce
 *  * - Messages : accès direct aux discussions et négociations d'offres
 *  * - Profil : espace compte, commandes et paramètres
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { SellScreen } from '../screens/SellScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Catalogue"
        component={CatalogScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Vendre"
        component={SellScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PlusCircle size={size + 2} color={colors.secondary} />,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '900',
            color: colors.secondary,
          },
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
