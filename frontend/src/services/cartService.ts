/**
 * Service de Gestion du Panier d'Achat ReVibe FliP
 * 
 * Gère la persistance et les opérations du panier côté client :
 *  * - Ajout, suppression et mise à jour des quantités d'articles
 *  * - Synchronisation avec le stockage local (localStorage)
 *  * - Calculs prévisionnels des totaux, frais de protection séquestre et livraison
 */

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
