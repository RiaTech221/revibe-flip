import api from './httpClient';
import { Product, Order, Review, PageResponse } from '../types';

export interface SellerMetricWithChange {
  value: number;
  previousValue?: number;
  changePercentage?: number | null;
  sparkline?: number[];
  count?: number;
  activeCount?: number;
  soldCount?: number;
  inactiveCount?: number;
  draftCount?: number;
  disabledCount?: number;
}

export interface SellerActionItems {
  ordersToPrepare: number;
  pendingOffers: number;
  unreadConversations: number;
  disputedOrders: number;
  disabledListings: number;
  totalToHandle: number;
  hasItemsToHandle: boolean;
  disabledListingsDetails?: Array<{
    id: number;
    title: string;
    deactivationReason?: string;
    price: number;
    primaryImage?: string;
  }>;
  pendingOffersDetails?: Array<{
    id: number;
    productId: number;
    productTitle: string;
    buyerName: string;
    agreedPrice: number;
    expiresAt: string;
    remainingTimeLabel: string;
  }>;
}

export interface SellerRating {
  averageRating: number | null;
  totalReviews: number;
  hasReviews: boolean;
  displayRating: string;
  distribution: Record<number, number>;
}

export interface SellerTopProduct {
  id: number;
  title: string;
  primaryImage?: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
}

export interface SellerStagnantProduct {
  id: number;
  title: string;
  primaryImage?: string;
  price: number;
  viewCount: number;
  createdAt: string;
  daysSinceCreation: number;
  suggestion: string;
}

export interface SellerTip {
  id: string;
  type: 'WARNING' | 'SUGGESTION' | 'INFO';
  title: string;
  message: string;
  actionTab?: string;
  actionFilter?: string;
}

export interface SellerSalesTrendPoint {
  label: string;
  amount: number;
  orderCount: number;
}

export interface SellerDashboard {
  sellerId: number;
  sellerName: string;
  sellerFirstName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  isSuspended?: boolean;
  memberSince?: string;
  sellerSinceLabel?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  lastUpdated?: string;
  demoMode?: boolean;
  currency?: string;
  commissionRate?: number;
  validationFeeRate?: number;

  actionItems?: SellerActionItems;

  listings?: SellerMetricWithChange;
  orders?: SellerMetricWithChange;
  turnover?: SellerMetricWithChange;
  pendingEscrow?: SellerMetricWithChange;
  releasedEarnings?: SellerMetricWithChange;
  platformCommission?: SellerMetricWithChange;
  offerAcceptanceRate?: SellerMetricWithChange;
  averageBasket?: SellerMetricWithChange;
  rating?: SellerRating;
  unreadConversationsCount?: number;

  salesTrends?: SellerSalesTrendPoint[];
  orderFunnel?: Array<{
    status: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  topProducts?: SellerTopProduct[];
  stagnantProducts?: SellerStagnantProduct[];
  ratingDistribution?: Record<number, number>;
  ordersByStatus?: Record<string, number>;

  ordersToPrepare?: Order[];
  activeOffers?: any[];
  recentReviews?: Review[];
  recentNotifications?: any[];
  contextualTips?: SellerTip[];

  // Legacy
  totalProducts?: number;
  activeProducts?: number;
  soldProducts?: number;
  inactiveProducts?: number;
  draftProducts?: number;
  ordersToProcess?: number;
  ordersInDelivery?: number;
  completedOrders?: number;
  netEarnings?: number;
  pendingEscrowAmount?: number;
  averageRating?: number;
  reviewCount?: number;
  unreadMessagesCount?: number;
  recentOrders?: Order[];
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

/**
 * Service dédié à l'espace vendeur (Gestion du catalogue, commandes, finances et retraits).
 */
export const sellerApi = {
  getProfile: () =>
    api.get<{ success: boolean; data: SellerProfile }>('/seller/profile'),
  updateProfile: (data: any) =>
    api.put<{ success: boolean; data: SellerProfile }>('/seller/profile', data),
  getDashboard: (params?: { period?: string; from?: string; to?: string }) =>
    api.get<{ success: boolean; data: SellerDashboard }>('/seller/dashboard', { params }),
  getProducts: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Product> }>('/seller/products', { params }),
  getProductById: (id: number) =>
    api.get<{ success: boolean; data: Product }>(`/seller/products/${id}`),
  createProduct: (data: any) =>
    api.post<{ success: boolean; data: Product }>('/seller/products', data),
  updateProduct: (id: number, data: any) =>
    api.put<{ success: boolean; data: Product }>(`/seller/products/${id}`, data),
  toggleProductStatus: (id: number, status: string) =>
    api.put(`/seller/products/${id}/status?status=${status}`),
  deleteProduct: (id: number) => api.delete(`/seller/products/${id}`),
  getOrders: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Order> }>('/seller/orders', { params }),
  getOrderById: (id: number) =>
    api.get<{ success: boolean; data: Order }>(`/seller/orders/${id}`),
  acceptOrder: (id: number) => api.put(`/seller/orders/${id}/accept`),
  refuseOrder: (id: number, reason?: string) =>
    api.put(`/seller/orders/${id}/refuse${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`),
  markReadyForPickup: (id: number) =>
    api.put(`/seller/orders/${id}/ready-for-pickup`),
  getTransactions: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<SellerTransaction> }>('/seller/transactions', { params }),
  getTransactionSummary: () =>
    api.get<{ success: boolean; data: SellerTransactionSummary }>('/seller/transactions/summary'),
  getReviews: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Review> }>('/seller/reviews', { params }),
  reportReview: (reviewId: number, data: { reason: string; details?: string }) =>
    api.post(`/seller/reviews/${reviewId}/report`, data),
};
