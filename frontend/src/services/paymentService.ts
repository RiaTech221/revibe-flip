/**
 * Service de paiement PayTech (Wave, Orange Money, Free Money) — ReVibe FliP
 */

import api from './httpClient';
import { Payment } from '../types';

export interface PaymentInitiationResponse {
  orderId: number;
  orderNumber: string;
  reference: string;
  token: string;
  redirectUrl: string;
  amount: number;
  currency: string;
}

export const paymentApi = {
  initiate: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: PaymentInitiationResponse }>('/payments/initiate', data),
  process: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: PaymentInitiationResponse }>('/payments/initiate', data),
  verifyByOrder: (orderId: number) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}/verify`),
  getByOrder: (orderId: number) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}`),
};
