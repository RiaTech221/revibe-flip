/**
 * Service de paiement PayTech Mobile — ReVibe FliP
 */

import api from '../api';
import { PaymentMethod } from '../types';

export interface PaymentInitializationPayload {
  orderId: number;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
}

export interface PaymentInitiationResponse {
  orderId: number;
  orderNumber: string;
  reference: string;
  token: string;
  redirectUrl: string;
  amount: number;
  currency: string;
}

export const paymentService = {
  initializePayment: async (payload: PaymentInitializationPayload): Promise<PaymentInitiationResponse> => {
    const res = await api.post('/payments/initiate', payload);
    return res.data?.data;
  },

  verifyPaymentStatus: async (orderId: number) => {
    const res = await api.get(`/payments/order/${orderId}/verify`);
    return res.data?.data;
  },

  getPaymentStatus: async (orderId: number) => {
    const res = await api.get(`/payments/order/${orderId}`);
    return res.data?.data;
  },
};

export default paymentService;
