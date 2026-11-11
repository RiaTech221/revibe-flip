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
