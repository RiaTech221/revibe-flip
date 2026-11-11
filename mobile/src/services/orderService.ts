import api from '../api';
import { Order, PaymentMethod } from '../types';

export interface CreateOrderPayload {
  productId: number;
  deliveryAddress: string;
  deliveryCity: string;
  paymentMethod: PaymentMethod;
  agreedPrice?: number;
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
    return res.data?.data || [];
  },

  confirmReceipt: async (orderId: number): Promise<Order> => {
    const res = await api.post(`/orders/${orderId}/confirm-receipt`);
    return res.data?.data;
  },
};

export default orderService;
