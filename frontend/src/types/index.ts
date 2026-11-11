/**
 * Définitions des Types et Interfaces TypeScript ReVibe FliP
 * 
 * Modèle de données centralisé de l'application frontend :
 *  * - Entités métier : User, Product, Category, Order, EscrowTransaction, Review, Conversation
 *  * - Énumérations de statuts : OrderStatus, ProductStatus, EscrowStatus, PaymentProvider
 *  * - DTOs de pagination, requêtes et réponses de filtrage
 */

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

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
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'SOLD' | 'INACTIVE';
export type ReportReason = 'MISLEADING_LISTING' | 'COUNTERFEIT' | 'SCAM' | 'FAKE_PROFILE' | 'ABUSIVE_BEHAVIOR' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export type OfferStatus = 'OFFER_SENT' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'OFFER_EXPIRED' | 'OFFER_CANCELLED';
export type MessageType = 'TEXT' | 'IMAGE' | 'OFFER' | 'SYSTEM';

export interface ChatOffer {
  id: number;
  conversationId: number;
  sellerId: number;
  sellerName: string;
  buyerId: number;
  buyerName: string;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  productCondition?: string;
  initialPrice: number;
  agreedPrice: number;
  deliveryMode: DeliveryMode;
  deliveryModeLabel?: string;
  deliveryFee: number;
  validationFee: number;
  totalAmount: number;
  validityHours: number;
  expiresAt: string;
  status: OfferStatus;
  orderId?: number;
  orderNumber?: string;
  isExpired: boolean;
  secondsRemaining: number;
  createdAt: string;
}

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
  defects?: string;
  measurements?: string;
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
export type OrderStatus = 'AWAITING_PAYMENT' | 'PENDING_PAYMENT' | 'PAID_ESCROW_LOCKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'EXPIRED';
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

export interface OrderItem {
  id: number;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  productId: number;
  productTitle: string;
  productImageUrl?: string;
  itemPrice: number;
  originalPrice?: number;
  agreedPrice?: number;
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
  deliveryStatus?: DeliveryStatus;
  deliveryStatusLabel?: string;
  buyer: User;
  seller: User;
  delivery?: Delivery;
  payment?: Payment;
  items?: OrderItem[];
  itemCount?: number;
  chatOfferId?: number;
  reservationExpiresAt?: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType?: MessageType;
  imageUrl?: string;
  offer?: ChatOffer;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  id: number;
  productId?: number;
  productTitle?: string;
  productImageUrl?: string;
  productPrice?: string;
  productCondition?: string;
  buyer: User;
  seller: User;
  referencedProducts?: Product[];
  activeOffer?: ChatOffer;
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

export interface MetricWithChange {
  value: number;
  previousValue: number;
  changePercentage: number;
  sparkline?: number[];
}

export interface UserMetrics {
  total: number;
  active: number;
  suspended: number;
  newInPeriod: number;
  previousNewInPeriod: number;
  changePercentage: number;
  sparkline?: number[];
}

export interface ProductMetrics {
  total: number;
  active: number;
  sold: number;
  inactive: number;
  draft: number;
  newInPeriod: number;
  previousNewInPeriod: number;
  changePercentage: number;
  sparkline?: number[];
}

export interface ReportMetrics {
  pending: number;
  inProgress: number;
  resolved: number;
  totalInPeriod: number;
  previousTotalInPeriod: number;
  changePercentage: number;
}

export interface ActionItems {
  pendingReportsAndDisputes: number;
  pendingModerationProducts: number;
  disputedOrders: number;
  deliveredAwaitingConfirmationOrders: number;
  unreadContactMessages: number;
  totalToHandle: number;
  hasItemsToHandle: boolean;
}

export interface OrderFunnelStep {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface RecentOrderSummary {
  id: number;
  orderNumber: string;
  productTitle: string;
  buyerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface RecentReportSummary {
  id: number;
  reason: string;
  reporterName: string;
  targetType: string;
  status: string;
  createdAt: string;
}

export interface RecentAuditLogSummary {
  id: number;
  actionType: string;
  adminName: string;
  targetType: string;
  details: string;
  createdAt: string;
}

export interface AdminDashboard {
  period?: string;
  startDate?: string;
  endDate?: string;
  lastUpdated?: string;
  demoMode?: boolean;
  currency?: string;
  commissionRate?: number;
  validationFeeRate?: number;

  actionItems?: ActionItems;

  revenue?: MetricWithChange;
  earnedCommissions?: MetricWithChange;
  escrowLockedFunds?: MetricWithChange;
  pendingCommissions?: MetricWithChange;
  validationFees?: MetricWithChange;
  orders?: MetricWithChange;
  transactions?: MetricWithChange;
  averageBasket?: MetricWithChange;
  users?: UserMetrics;
  products?: ProductMetrics;
  reports?: ReportMetrics;

  salesTrends?: { date?: string; label: string; amount: number; orderCount: number }[];
  userRegistrationTrends?: { date: string; label: string; count: number }[];
  topCategories?: { name: string; productCount: number; orderCount?: number; totalAmount?: number; percentage: number }[];
  topCategoriesBySales?: { name: string; productCount: number; orderCount?: number; totalAmount?: number; percentage: number }[];
  topCategoriesByProducts?: { name: string; productCount: number; orderCount?: number; totalAmount?: number; percentage: number }[];
  paymentDistributions?: { paymentMethod: string; count: number; totalAmount: number; percentage: number }[];
  orderFunnel?: OrderFunnelStep[];
  ordersByStatus?: Record<string, number>;

  recentOrders?: RecentOrderSummary[];
  recentReports?: RecentReportSummary[];
  recentAuditLogs?: RecentAuditLogSummary[];

  // Rétrocompatibilité widgets legacy
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalProducts: number;
  activeProducts: number;
  soldProducts: number;
  inactiveProducts: number;
  totalOrders: number;
  totalTransactions: number;
  totalTransactionsAmount: number;
  totalCommissions: number;
  totalValidationFees: number;
  pendingReports: number;
}

export interface AdminUserDetail {
  user: User;
  products: Product[];
  purchases: Order[];
  sales: Order[];
  reviews: Review[];
  totalSpent: number;
  totalEarned: number;
  averageRating: number;
  totalReviews: number;
}

export interface AdminPayment {
  id: number;
  transactionReference: string;
  orderId: number;
  orderNumber: string;
  productTitle: string;
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  sellerPhone: string;
  itemPrice: number;
  validationFee: number;
  deliveryFee: number;
  totalAmount: number;
  platformCommission: number;
  sellerPayout: number;
  paymentMethod: string;
  paymentMethodName: string;
  status: string;
  escrowStatus: string;
  escrowStatusDescription: string;
  payerPhoneNumber?: string;
  paymentDate?: string;
  createdAt: string;
}

export interface PlatformSettings {
  id: number;
  commissionRate: number;
  validationFeeRate: number;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  offerValidityHours?: number;
  reservationDurationHours?: number;
  demoMode?: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AdminActionLog {
  id: number;
  adminName: string;
  adminPhone: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

// --- CMS & Dynamic Content Types ---

export type PageStatus = 'DRAFT' | 'PUBLISHED';
export type FooterColumn = 'HELP' | 'LEGAL' | 'NONE';

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  status: PageStatus;
  showInFooter: boolean;
  footerColumn: FooterColumn;
  sortOrder: number;
  isSystemPage: boolean;
  pdfUrl?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: number;
}

export interface PageVersion {
  id: number;
  pageId: number;
  versionNumber: number;
  title: string;
  content: string;
  pdfUrl?: string;
  status: PageStatus;
  changeSummary?: string;
  createdByName?: string;
  createdAt: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContactMessageStatus = 'NEW' | 'READ' | 'RESOLVED' | 'ARCHIVED';

export interface ContactMessage {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  ipAddress?: string;
  status: ContactMessageStatus;
  adminNotes?: string;
  handledByName?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface FooterConfig {
  platformName: string;
  catchphrase: string;
  copyright: string;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  supportHours: string;
  demoMode: boolean;
  logoDarkBgUrl?: string;
  logoLightBgUrl?: string;
  socialLinks: Record<string, string>;
  helpPages: CmsPage[];
  legalPages: CmsPage[];
}

export interface AnnouncementBanner {
  enabled: boolean;
  message: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isCurrentlyActive: boolean;
}

export interface MediaAsset {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  url: string;
  altText: string;
  uploadedByName: string;
  createdAt: string;
}
