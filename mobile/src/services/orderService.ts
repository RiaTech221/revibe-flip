/**
 * Service de Gestion des Commandes Mobile ReVibe FliP
 * 
 * Gère le cycle des commandes et le suivi de livraison :
 *  * - createOrder : création d'une commande avec séquestre bancaire
 *  * - getOrders : historique des commandes achetées et reçues
 *  * - getOrderById : détails complets d'une commande (statut séquestre, expédition)
 *  * - confirmDelivery : validation de conformité par l'acheteur entraînant le déblocage des fonds au vendeur
 *  * - openDispute : ouverture d'un litige en cas de non-conformité
 */

import api from '../api';
import { Order } from '../types';

export interface CreateOrderPayload {
  productId: number;
  deliveryMode: 'HOME_DELIVERY' | 'DIRECT_HANDOVER';
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone?: string;
  deliveryNotes?: string;
}

export const orderService = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await api.post('/orders', payload);
    return res.data?.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const res = await api.get(`/orders/${id}`);
    return res.data?.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get('/orders/my-orders');
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.content || [];
  },

  getBuyerOrders: async (): Promise<Order[]> => {
    const res = await api.get('/orders/buyer');
    return res.data?.data || [];
  },

  getSellerOrders: async (): Promise<Order[]> => {
    const res = await api.get('/orders/seller');
    return res.data?.data || [];
  },

  confirmReceipt: async (orderId: number): Promise<Order> => {
    const res = await api.post(`/orders/${orderId}/confirm-receipt`);
    return res.data?.data;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const res = await api.post(`/orders/${orderId}/cancel`);
    return res.data?.data;
  },
};

export default orderService;
