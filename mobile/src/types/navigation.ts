/**
 * Types de Navigation React Navigation ReVibe FliP Mobile
 * 
 * Typage strict des routes et paramètres de navigation :
 *  * - RootStackParamList : écrans modaux et principaux (ProductDetail, Chat, Checkout, OrderDetail, Auth)
 *  * - MainTabParamList : 5 onglets de la barre inférieure (Home, Catalog, Sell, Messages, Profile)
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { Product, Order, Conversation } from './index';

export type MainTabParamList = {
  Accueil: undefined;
  Catalogue: { categoryId?: number; query?: string } | undefined;
  Vendre: undefined;
  Messages: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: { id: number; product?: Product };
  Chat: { conversationId?: number; productId?: number; sellerId?: number; conversation?: Conversation };
  Checkout: { product: Product; agreedPrice?: number };
  OrderDetail: { orderId: number; order?: Order };
  Login: { returnScreen?: keyof RootStackParamList } | undefined;
  Register: undefined;
};
