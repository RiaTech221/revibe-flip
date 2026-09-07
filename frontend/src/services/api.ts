import axios from 'axios';
import {
  User,
  Country,
  Category,
  Product,
  Order,
  Payment,
  Delivery,
  Conversation,
  Message,
  Review,
  Notification,
  AdminDashboard,
  InitiatePaymentResponse
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('revibeflip_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  verifyOtp: (data: { phone: string; otpCode: string }) => api.post('/auth/verify-otp', data),
  resendOtp: (phone: string) => api.post(`/auth/resend-otp?phone=${encodeURIComponent(phone)}`),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};

export const countryApi = {
  getAll: () => api.get<{ success: boolean; data: Country[] }>('/countries'),
};

export const categoryApi = {
  getAll: () => api.get<{ success: boolean; data: Category[] }>('/categories'),
};

export const productApi = {
  search: (params: any) => api.get<{ success: boolean; data: { content: Product[]; totalPages: number; totalElements: number } }>('/products', { params }),
  getById: (id: number) => api.get<{ success: boolean; data: Product }>(`/products/${id}`),
  create: (data: any) => api.post<{ success: boolean; data: Product }>('/products', data),
  update: (id: number, data: any) => api.put<{ success: boolean; data: Product }>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getBySeller: (sellerId: number) => api.get<{ success: boolean; data: Product[] }>(`/products/seller/${sellerId}`),
};

export const orderApi = {
  create: (data: any) => api.post<{ success: boolean; data: Order }>('/orders', data),
  getById: (id: number) => api.get<{ success: boolean; data: Order }>(`/orders/${id}`),
  getMyPurchases: () => api.get<{ success: boolean; data: Order[] }>('/orders/buyer'),
  getMySales: () => api.get<{ success: boolean; data: Order[] }>('/orders/seller'),
  confirmReceipt: (id: number) => api.post<{ success: boolean; data: Order }>(`/orders/${id}/confirm-receipt`),
};

export const paymentApi = {
  initiate: (data: { orderId: number; paymentMethod: string; phoneNumber?: string }) =>
    api.post<{ success: boolean; data: InitiatePaymentResponse }>('/payments/initiate', data),
  checkStatus: (reference: string) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/status/${reference}`),
  process: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: Payment }>('/payments/process', data),
  getByOrder: (orderId: number) => api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}`),
};

export const deliveryApi = {
  getByOrder: (orderId: number) => api.get<{ success: boolean; data: Delivery }>(`/deliveries/order/${orderId}`),
  track: (trackingNumber: string) => api.get<{ success: boolean; data: Delivery }>(`/deliveries/track/${trackingNumber}`),
  updateStatus: (deliveryId: number, data: any) =>
    api.put<{ success: boolean; data: Delivery }>(`/deliveries/${deliveryId}/status`, data),
};

export const chatApi = {
  getConversations: () => api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations'),
  getMessages: (conversationId: number) => api.get<{ success: boolean; data: Message[] }>(`/messages/conversations/${conversationId}`),
  startConversation: (data: { productId: number; initialMessage: string }) =>
    api.post<{ success: boolean; data: Conversation }>('/messages/conversations', data),
  sendMessage: (data: { conversationId: number; content: string }) =>
    api.post<{ success: boolean; data: Message }>('/messages/send', data),
};

export const reviewApi = {
  create: (data: { orderId: number; rating: number; comment?: string }) =>
    api.post<{ success: boolean; data: Review }>('/reviews', data),
  getUserReviews: (userId: number) => api.get<{ success: boolean; data: Review[] }>(`/reviews/user/${userId}`),
};

export const reportApi = {
  create: (data: any) => api.post('/reports', data),
};

export const notificationApi = {
  getAll: () => api.get<{ success: boolean; data: Notification[] }>('/notifications'),
  getUnreadCount: () => api.get<{ success: boolean; data: number }>('/notifications/unread-count'),
  markAllAsRead: () => api.put('/notifications/read-all'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
};

export const adminApi = {
  getDashboard: () => api.get<{ success: boolean; data: AdminDashboard }>('/admin/dashboard'),
  getUsers: (query?: string) => api.get<{ success: boolean; data: User[] }>('/admin/users', { params: { query } }),
  toggleSuspend: (id: number, suspend: boolean) => api.put(`/admin/users/${id}/suspend?suspend=${suspend}`),
  getProducts: (query?: string) => api.get<{ success: boolean; data: Product[] }>('/admin/products', { params: { query } }),
  setProductStatus: (id: number, status: string) => api.put(`/admin/products/${id}/status?status=${status}`),
  getReports: () => api.get<{ success: boolean; data: any[] }>('/admin/reports'),
  resolveReport: (id: number, status: string, adminNotes?: string) =>
    api.put(`/admin/reports/${id}/resolve?status=${status}&adminNotes=${encodeURIComponent(adminNotes || '')}`),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; data: string }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
