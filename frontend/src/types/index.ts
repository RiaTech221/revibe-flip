export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  isVerified: boolean;
  profilePicture?: string;
  address?: string;
  city?: string;
  trustScore: number;
  rating: number;
  reviewCount: number;
  isSuspended: boolean;
  createdAt: string;
}

export interface Country {
  id: number;
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  flagEmoji: string;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

export type ProductCondition = 'NEW_WITH_TAG' | 'VERY_GOOD' | 'GOOD' | 'SATISFACTORY';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'INACTIVE';
export type ReportReason = 'MISLEADING_LISTING' | 'COUNTERFEIT' | 'SCAM' | 'FAKE_PROFILE' | 'ABUSIVE_BEHAVIOR' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  brand?: string;
  size?: string;
  color?: string;
  condition: ProductCondition;
  conditionLabel: string;
  status: ProductStatus;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  locationCity: string;
  countryCode: string;
  countryName: string;
  currency: string;
  viewCount: number;
  seller: User;
  images: string[];
  primaryImage?: string;
  createdAt: string;
}

export type DeliveryMode = 'HOME_DELIVERY' | 'DIRECT_HANDOVER';
export type DeliveryStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID_ESCROW_LOCKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
export type EscrowStatus = 'LOCKED' | 'RELEASED_TO_SELLER' | 'REFUNDED_TO_BUYER';

export interface Delivery {
  id: number;
  orderId: number;
  trackingNumber: string;
  mode: DeliveryMode;
  modeLabel: string;
  status: DeliveryStatus;
  statusLabel: string;
  carrierName?: string;
  carrierPhone?: string;
  estimatedDelivery?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  transactionReference: string;
  amount: number;
  validationFee: number;
  status: string;
  escrowStatus: EscrowStatus;
  escrowStatusDescription: string;
  payerPhoneNumber?: string;
  paymentDate?: string;
  escrowReleasedDate?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  itemPrice: number;
  validationFee: number;
  deliveryFee: number;
  totalAmount: number;
  platformCommission: number;
  sellerPayout: number;
  deliveryMode: DeliveryMode;
  deliveryModeLabel: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPhone?: string;
  deliveryNotes?: string;
  status: OrderStatus;
  buyer: User;
  seller: User;
  delivery?: Delivery;
  payment?: Payment;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  id: number;
  productId?: number;
  productTitle?: string;
  productImageUrl?: string;
  productPrice?: string;
  buyer: User;
  seller: User;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Review {
  id: number;
  orderId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  targetUserId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalTransactionsAmount: number;
  totalCommissions: number;
  totalValidationFees: number;
  pendingReports: number;
}
