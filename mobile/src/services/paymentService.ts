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
