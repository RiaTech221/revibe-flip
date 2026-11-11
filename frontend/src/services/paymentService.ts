import api from './httpClient';
import { Payment } from '../types';

/**
 * Service de traitement des transactions Mobile Money (Wave, Orange Money, Free Money) sous séquestre.
 */
export const paymentApi = {
  process: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: Payment }>('/payments/process', data),
  getByOrder: (orderId: number) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}`),
};
