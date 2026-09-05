import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DummyScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#7e22ce' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' }}>
        Écran ReVibe FliP Mobile connecté à l'API Spring Boot
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Catalogue" children={() => <DummyScreen title="Catalogue d'articles" />} />
      <Tab.Screen name="Vendre" children={() => <DummyScreen title="Publier une annonce" />} />
      <Tab.Screen name="Messages" children={() => <DummyScreen title="Messagerie Acheteur-Vendeur" />} />
      <Tab.Screen name="Profil" children={() => <DummyScreen title="Mon Compte & Commandes" />} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Detail" children={() => <DummyScreen title="Fiche Produit" />} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
