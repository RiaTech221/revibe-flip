import api from './httpClient';
import { Conversation } from '../types';

/**
 * Service de gestion du panier d'achat et préparation des commandes groupées.
 */
export const cartApi = {
  getCart: () =>
    api.get<{ success: boolean; data: any }>('/cart'),
  addToCart: (productId: number, forceReplaceSeller = false) =>
    api.post<{ success: boolean; data: any }>('/cart/items', { productId, forceReplaceSeller }),
  removeFromCart: (productId: number) =>
    api.delete<{ success: boolean; data: any }>(`/cart/items/${productId}`),
  clearCart: () =>
    api.delete<{ success: boolean; data: any }>('/cart'),
  startDiscussion: () =>
    api.post<{ success: boolean; data: Conversation }>('/cart/discuss'),
  checkout: (data: any) =>
    api.post<{ success: boolean; data: any }>('/cart/checkout', data),
};
