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
  ChatOffer,
  Review,
  Notification,
  AdminDashboard,
  AdminUserDetail,
  AdminPayment,
  PlatformSettings,
  AdminActionLog,
  PageResponse,
  CmsPage,
  PageVersion,
  FaqItem,
  ContactMessage,
  FooterConfig,
  AnnouncementBanner,
  MediaAsset
} from '../types';

/**
 * URL de base de l'API REST Backend Spring Boot.
 * Configurable via la variable d'environnement VITE_API_URL.
 */
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Client HTTP Axios centralisé pour la plateforme ReVibe FliP.
 * Gère l'injection automatique du token JWT d'authentification pour chaque requête.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur HTTP : injection automatique du Bearer Token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('revibeflip_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Services d'authentification et gestion de session (JWT, OTP, Inscription) */
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

/** Traitement des transactions et paiements Mobile Money sous séquestre */
export const paymentApi = {
  process: (data: { orderId: number; paymentMethod: string; phoneNumber: string }) =>
    api.post<{ success: boolean; data: Payment }>('/payments/process', data),
  getByOrder: (orderId: number) => api.get<{ success: boolean; data: Payment }>(`/payments/order/${orderId}`),
};

/** Suivi des expéditions et livraison (coursier moto Dakar & remise en main propre) */
export const deliveryApi = {
  getByOrder: (orderId: number) => api.get<{ success: boolean; data: Delivery }>(`/deliveries/order/${orderId}`),
  track: (trackingNumber: string) => api.get<{ success: boolean; data: Delivery }>(`/deliveries/track/${trackingNumber}`),
  updateStatus: (deliveryId: number, data: any) =>
    api.put<{ success: boolean; data: Delivery }>(`/deliveries/${deliveryId}/status`, data),
};

/** Messagerie instantanée et fils de discussion contextuels par article */
export const chatApi = {
  getConversations: () => api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations'),
  getMessages: (conversationId: number) => api.get<{ success: boolean; data: Message[] }>(`/messages/conversations/${conversationId}`),
  startConversation: (data: { productId?: number; productIds?: number[]; initialMessage?: string }) =>
    api.post<{ success: boolean; data: Conversation }>('/messages/conversations', data),
  sendMessage: (data: { conversationId: number; content?: string; imageUrl?: string }) =>
    api.post<{ success: boolean; data: Message }>('/messages/send', data),
};

/** Négociation d'offres de prix en direct dans le chat */
export const chatOfferApi = {
  createOffer: (data: {
    conversationId: number;
    productId: number;
    agreedPrice: number;
    deliveryMode: string;
    deliveryFee?: number;
    validityHours?: number;
  }) => api.post<{ success: boolean; data: ChatOffer }>('/chat-offers', data),
  acceptOffer: (id: number) => api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/accept`),
  declineOffer: (id: number) => api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/decline`),
  cancelOffer: (id: number) => api.post<{ success: boolean; data: ChatOffer }>(`/chat-offers/${id}/cancel`),
  getConversationOffers: (conversationId: number) =>
    api.get<{ success: boolean; data: ChatOffer[] }>(`/chat-offers/conversation/${conversationId}`),
  getSellerOffers: () => api.get<{ success: boolean; data: ChatOffer[] }>('/chat-offers/seller'),
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

export const userApi = {
  updateProfile: (data: Partial<User>) => api.put<{ success: boolean; data: User }>('/users/profile', data),
  getProfile: (id: number) => api.get<{ success: boolean; data: User }>(`/users/${id}`),
};

export const adminApi = {
  getDashboard: () => api.get<{ success: boolean; data: AdminDashboard }>('/admin/dashboard'),
  getUsers: (params?: { query?: string; role?: string; isSuspended?: boolean; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<User> }>('/admin/users', { params }),
  getUserDetails: (id: number) => api.get<{ success: boolean; data: AdminUserDetail }>(`/admin/users/${id}`),
  toggleSuspend: (id: number, suspend: boolean) => api.put(`/admin/users/${id}/suspend?suspend=${suspend}`),
  updateUserRole: (id: number, role: 'ROLE_USER' | 'ROLE_ADMIN') => api.put(`/admin/users/${id}/role`, { role }),
  getProducts: (params?: { query?: string; status?: string; categoryId?: number; sellerId?: number; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Product> }>('/admin/products', { params }),
  setProductStatus: (id: number, status: string) => api.put(`/admin/products/${id}/status?status=${status}`),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  createCategory: (data: { name: string; slug: string; icon?: string; description?: string; displayOrder?: number; active?: boolean }) =>
    api.post<{ success: boolean; data: Category }>('/admin/categories', data),
  updateCategory: (id: number, data: { name: string; slug: string; icon?: string; description?: string; displayOrder?: number; active?: boolean }) =>
    api.put<{ success: boolean; data: Category }>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  getOrders: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Order> }>('/admin/orders', { params }),
  getOrderDetails: (id: number) => api.get<{ success: boolean; data: Order }>(`/admin/orders/${id}`),
  updateDeliveryStatus: (id: number, deliveryStatus: string, notes?: string) =>
    api.put(`/admin/orders/${id}/delivery-status?deliveryStatus=${deliveryStatus}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`),
  getPayments: (params?: { query?: string; method?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<AdminPayment> }>('/admin/payments', { params }),
  getReports: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<any> }>('/admin/reports', { params }),
  resolveReport: (id: number, data: { status: string; action?: string; adminNotes?: string }) =>
    api.put(`/admin/reports/${id}/resolve`, data),
  getSettings: () => api.get<{ success: boolean; data: PlatformSettings }>('/admin/settings'),
  updateSettings: (data: Partial<PlatformSettings>) =>
    api.put<{ success: boolean; data: PlatformSettings }>('/admin/settings', data),
  getAuditLogs: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<AdminActionLog> }>('/admin/audit-logs', { params }),
  auditViewConversation: (id: number) =>
    api.get<{ success: boolean; data: { conversation: Conversation; messages: Message[] } }>(`/admin/conversations/${id}/audit-view`),
};

export interface SellerDashboard {
  sellerId: number;
  sellerName: string;
  totalProducts: number;
  activeProducts: number;
  soldProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  ordersToProcess: number;
  ordersInDelivery: number;
  turnover: number;
  platformCommission: number;
  netEarnings: number;
  commissionRate: number;
  validationFeeRate: number;
  pendingEscrowAmount: number;
  averageRating: number;
  totalReviews: number;
  unreadMessagesCount: number;
  recentOrders: Order[];
}

export interface SellerTransaction {
  orderId: number;
  orderNumber: string;
  productTitle: string;
  buyerName: string;
  itemPrice: number;
  validationFee: number;
  deliveryFee: number;
  platformCommission: number;
  sellerPayout: number;
  paymentMethod: string;
  paymentStatus: string;
  escrowStatus: string;
  createdAt: string;
}

export interface SellerTransactionSummary {
  totalTurnover: number;
  totalCommissionPaid: number;
  totalSellerPayout: number;
  pendingEscrowAmount: number;
  disclaimer: string;
}

export interface SellerProfile {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  countryCode: string;
  city?: string;
  address?: string;
  profilePictureUrl?: string;
  activeListingsCount: number;
  soldListingsCount: number;
  totalReviewsCount: number;
  averageRating: number;
  createdAt: string;
}

export const sellerApi = {
  getProfile: () => api.get<{ success: boolean; data: SellerProfile }>('/seller/profile'),
  updateProfile: (data: any) => api.put<{ success: boolean; data: SellerProfile }>('/seller/profile', data),
  getDashboard: () => api.get<{ success: boolean; data: SellerDashboard }>('/seller/dashboard'),
  getProducts: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Product> }>('/seller/products', { params }),
  getProductById: (id: number) => api.get<{ success: boolean; data: Product }>(`/seller/products/${id}`),
  createProduct: (data: any) => api.post<{ success: boolean; data: Product }>('/seller/products', data),
  updateProduct: (id: number, data: any) => api.put<{ success: boolean; data: Product }>(`/seller/products/${id}`, data),
  toggleProductStatus: (id: number, status: string) => api.put(`/seller/products/${id}/status?status=${status}`),
  deleteProduct: (id: number) => api.delete(`/seller/products/${id}`),
  getOrders: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Order> }>('/seller/orders', { params }),
  getOrderById: (id: number) => api.get<{ success: boolean; data: Order }>(`/seller/orders/${id}`),
  acceptOrder: (id: number) => api.put(`/seller/orders/${id}/accept`),
  refuseOrder: (id: number, reason?: string) =>
    api.put(`/seller/orders/${id}/refuse${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`),
  markReadyForPickup: (id: number) => api.put(`/seller/orders/${id}/ready-for-pickup`),
  getTransactions: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<SellerTransaction> }>('/seller/transactions', { params }),
  getTransactionSummary: () => api.get<{ success: boolean; data: SellerTransactionSummary }>('/seller/transactions/summary'),
  getReviews: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Review> }>('/seller/reviews', { params }),
  reportReview: (id: number, data: { reason: string; details?: string }) =>
    api.post(`/seller/reviews/${id}/report`, data),
  getConversations: () => api.get<{ success: boolean; data: any[] }>('/seller/conversations'),
  getConversationMessages: (id: number) => api.get<{ success: boolean; data: any[] }>(`/seller/conversations/${id}/messages`),
  sendMessage: (id: number, content: string) => api.post(`/seller/conversations/${id}/messages`, { conversationId: id, content }),
};

export const cartApi = {
  getCart: () => api.get<{ success: boolean; data: any }>('/cart'),
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

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; data: string }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const contentApi = {
  getFooter: () => api.get<{ success: boolean; data: FooterConfig }>('/content/footer'),
  getAnnouncement: () => api.get<{ success: boolean; data: AnnouncementBanner }>('/content/announcement'),
  getAllPages: () => api.get<{ success: boolean; data: CmsPage[] }>('/pages'),
  getPage: (slug: string) => api.get<{ success: boolean; data: CmsPage }>(`/pages/${slug}`),
  getFaq: () => api.get<{ success: boolean; data: FaqItem[] }>('/faq'),
  submitContact: (data: { fullName: string; email?: string; phone?: string; subject: string; message: string }) =>
    api.post<{ success: boolean; data: ContactMessage; message: string }>('/contact', data),
};

export const adminCmsApi = {
  // Pages
  getPages: (params?: { search?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<CmsPage> }>('/admin/cms/pages', { params }),
  getPageById: (id: number) => api.get<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}`),
  createPage: (data: any) => api.post<{ success: boolean; data: CmsPage }>('/admin/cms/pages', data),
  updatePage: (id: number, data: any) => api.put<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}`, data),
  deletePage: (id: number, force = false) => api.delete(`/admin/cms/pages/${id}?force=${force}`),
  getPageVersions: (id: number) => api.get<{ success: boolean; data: PageVersion[] }>(`/admin/cms/pages/${id}/versions`),
  restoreVersion: (id: number, versionNumber: number) =>
    api.post<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}/versions/${versionNumber}/restore`),

  // FAQ
  getFaq: () => api.get<{ success: boolean; data: FaqItem[] }>('/admin/cms/faq'),
  createFaq: (data: any) => api.post<{ success: boolean; data: FaqItem }>('/admin/cms/faq', data),
  updateFaq: (id: number, data: any) => api.put<{ success: boolean; data: FaqItem }>(`/admin/cms/faq/${id}`, data),
  deleteFaq: (id: number) => api.delete(`/admin/cms/faq/${id}`),

  // Footer & Settings
  getFooter: () => api.get<{ success: boolean; data: FooterConfig }>('/admin/cms/footer'),
  updateFooter: (data: any) => api.put<{ success: boolean; data: FooterConfig }>('/admin/cms/footer', data),

  // Announcement
  getAnnouncement: () => api.get<{ success: boolean; data: AnnouncementBanner }>('/admin/cms/announcement'),
  updateAnnouncement: (data: any) => api.put<{ success: boolean; data: AnnouncementBanner }>('/admin/cms/announcement', data),

  // Contact Messages
  getContactMessages: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<ContactMessage> }>('/admin/cms/contact-messages', { params }),
  updateContactMessage: (id: number, data: { status: string; adminNotes?: string }) =>
    api.put<{ success: boolean; data: ContactMessage }>(`/admin/cms/contact-messages/${id}`, data),

  // Media
  getMedia: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<MediaAsset> }>('/admin/cms/media', { params }),
  uploadMedia: (file: File, altText?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    return api.post<{ success: boolean; data: MediaAsset }>('/admin/cms/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteMedia: (id: number) => api.delete(`/admin/cms/media/${id}`),
};

export default api;
