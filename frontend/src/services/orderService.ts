/**
 * Service de Gestion des Commandes et Expéditions ReVibe FliP
 * 
 * Pilote le cycle de commande e-commerce sécurisé :
 *  * - Création de commande depuis le panier ou une offre négociée
 *  * - Suivi du cycle de vie de la commande (PENDING, PAID, SHIPPED, DELIVERED, COMPLETED)
 *  * - Confirmation de réception par l'acheteur et déblocage du séquestre
 *  * - Ouverture et traitement des litiges (DISPUTED)
 */

import api from './httpClient';
import { Order, Delivery } from '../types';

/**
 * Service de gestion des commandes d'achat, de vente et du suivi logistique.
 */
export const orderApi = {
  create: (data: any) =>
    api.post<{ success: boolean; data: Order }>('/orders', data),
  getById: (id: number) =>
    api.get<{ success: boolean; data: Order }>(`/orders/${id}`),
  getMyPurchases: () =>
    api.get<{ success: boolean; data: Order[] }>('/orders/buyer'),
  getMySales: () =>
    api.get<{ success: boolean; data: Order[] }>('/orders/seller'),
  confirmReceipt: (id: number) =>
    api.post<{ success: boolean; data: Order }>(`/orders/${id}/confirm-receipt`),
};

export const deliveryApi = {
  getByOrder: (orderId: number) =>
    api.get<{ success: boolean; data: Delivery }>(`/deliveries/order/${orderId}`),
  track: (trackingNumber: string) =>
    api.get<{ success: boolean; data: Delivery }>(`/deliveries/track/${trackingNumber}`),
  updateStatus: (deliveryId: number, data: any) =>
    api.put<{ success: boolean; data: Delivery }>(`/deliveries/${deliveryId}/status`, data),
};
