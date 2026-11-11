/**
 * Modèles de Données et Types TypeScript Mobile ReVibe FliP
 * 
 * Définit les interfaces et énumérations du modèle de données mobile :
 *  * - Entités : User, Product, Category, Order, EscrowTransaction, Review, Conversation, Message, Offer
 *  * - Énumérations de statuts : ProductCondition, ProductStatus, OrderStatus, EscrowStatus, OfferStatus, PaymentProvider
 *  * - DTOs de réponse et de pagination
 */

export interface User {
  id: number;
  phone: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email?: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  countryCode?: string;
  city?: string;
  address?: string;
  isSuspended?: boolean;
  avatarUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export type ProductCondition =
  | 'NEW_WITH_TAG'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'SATISFACTORY';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'PENDING_APPROVAL';
  condition: ProductCondition;
  conditionLabel?: string;
  brand?: string;
  size?: string;
  color?: string;
  primaryImage?: string;
  images?: string[];
  locationCity?: string;
  category?: Category;
  seller?: {
    id: number;
    fullName: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;
  };
  createdAt?: string;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export interface Delivery {
  id: number;
  trackingNumber: string;
  status: DeliveryStatus;
  carrierName?: string;
  deliveryAddress: string;
  recipientPhone: string;
  estimatedDeliveryDate?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  productTitle: string;
  itemPrice: number;
  agreedPrice?: number;
  originalPrice?: number;
  validationFee: number;
  deliveryFee: number;
  platformCommission: number;
  totalAmount: number;
  sellerPayout: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  escrowStatus?: string;
  buyer?: User;
  seller?: User;
  delivery?: Delivery;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  imageUrl?: string;
  sentAt: string;
  read: boolean;
}

export interface ChatOffer {
  id: number;
  conversationId: number;
  agreedPrice: number;
  deliveryMode: string;
  deliveryFee: number;
  validationFee: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'PAID' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  productId?: number;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  otherUserId: number;
  otherUserName: string;
  lastMessageContent?: string;
  lastMessageDate?: string;
  unreadCount?: number;
  activeOffer?: ChatOffer;
}
