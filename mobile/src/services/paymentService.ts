/**
 * Service de Paiement Mobile Money et Séquestre Mobile ReVibe FliP
 * 
 * Intègre les paiements Mobile Money sous séquestre garanti ReVibe Shield :
 *  * - initiatePayment : initialisation de la transaction Mobile Money (Wave, Orange Money, MTN MoMo, Moov)
 *  * - getEscrowStatus : consultation en temps réel de la consignation des fonds sous séquestre
 *  * - confirmPayment : confirmation de capture des fonds par l'opérateur
 */

import api from '../api';
import { PaymentMethod } from '../types';

export interface PaymentInitializationPayload {
  orderId: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  returnUrl?: string;
}

export interface PaymentResponse {
  paymentId: number;
  status: string;
  transactionRef: string;
  paymentUrl?: string;
}

export const paymentService = {
  initializePayment: async (payload: PaymentInitializationPayload): Promise<PaymentResponse> => {
    const res = await api.post('/payments/initialize', payload);
    return res.data?.data;
  },

  getPaymentStatus: async (orderId: number): Promise<PaymentResponse> => {
    const res = await api.get(`/payments/order/${orderId}/status`);
    return res.data?.data;
  },
};

export default paymentService;
