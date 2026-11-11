/**
 * Service API Administration et Modération ReVibe FliP
 * 
 * Expose l'ensemble des opérations réservées aux administrateurs :
 *  * - Métriques KPI globales de la plateforme (ventes, utilisateurs, séquestre)
 *  * - Modération des annonces et résolutions de signalements de produits/utilisateurs
 *  * - Gestion des catégories et configuration des frais de service et de livraison
 *  * - Audit des conversations et historique des transactions sous séquestre
 */

import api from './httpClient';
import {
  AdminDashboard,
  User,
  AdminUserDetail,
  Product,
  Category,
  Order,
  AdminPayment,
  PlatformSettings,
  AdminActionLog,
  Conversation,
  Message,
  PageResponse,
  CmsPage,
  PageVersion,
  FaqItem,
  FooterConfig,
  AnnouncementBanner,
  ContactMessage,
  MediaAsset,
} from '../types';

/**
 * Service d'administration et modération globale de la plateforme (KPIs, Utilisateurs, Litiges, Paramètres).
 */
export const adminApi = {
  getDashboard: (params?: { period?: string; from?: string; to?: string }) =>
    api.get<{ success: boolean; data: AdminDashboard }>('/admin/dashboard', { params }),
  reseedDevData: (forceReset = true) =>
    api.post<{ success: boolean; data: string }>(`/admin/dev/reseed?forceReset=${forceReset}`),
  getUsers: (params?: { query?: string; role?: string; isSuspended?: boolean; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<User> }>('/admin/users', { params }),
  getUserDetails: (id: number) =>
    api.get<{ success: boolean; data: AdminUserDetail }>(`/admin/users/${id}`),
  toggleSuspend: (id: number, suspend: boolean) =>
    api.put(`/admin/users/${id}/suspend?suspend=${suspend}`),
  updateUserRole: (id: number, role: 'ROLE_USER' | 'ROLE_ADMIN') =>
    api.put(`/admin/users/${id}/role`, { role }),
  getProducts: (params?: { query?: string; status?: string; categoryId?: number; sellerId?: number; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Product> }>('/admin/products', { params }),
  setProductStatus: (id: number, status: string) =>
    api.put(`/admin/products/${id}/status?status=${status}`),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  createCategory: (data: { name: string; slug: string; icon?: string; description?: string; displayOrder?: number; active?: boolean }) =>
    api.post<{ success: boolean; data: Category }>('/admin/categories', data),
  updateCategory: (id: number, data: { name: string; slug: string; icon?: string; description?: string; displayOrder?: number; active?: boolean }) =>
    api.put<{ success: boolean; data: Category }>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  getOrders: (params?: { query?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<Order> }>('/admin/orders', { params }),
  getOrderDetails: (id: number) =>
    api.get<{ success: boolean; data: Order }>(`/admin/orders/${id}`),
  updateDeliveryStatus: (id: number, deliveryStatus: string, notes?: string) =>
    api.put(`/admin/orders/${id}/delivery-status?deliveryStatus=${deliveryStatus}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`),
  getPayments: (params?: { query?: string; method?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<AdminPayment> }>('/admin/payments', { params }),
  getReports: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<any> }>('/admin/reports', { params }),
  resolveReport: (id: number, data: { status: string; action?: string; adminNotes?: string }) =>
    api.put(`/admin/reports/${id}/resolve`, data),
  getSettings: () =>
    api.get<{ success: boolean; data: PlatformSettings }>('/admin/settings'),
  updateSettings: (data: Partial<PlatformSettings>) =>
    api.put<{ success: boolean; data: PlatformSettings }>('/admin/settings', data),
  getAuditLogs: (params?: { page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<AdminActionLog> }>('/admin/audit-logs', { params }),
  auditViewConversation: (id: number) =>
    api.get<{ success: boolean; data: { conversation: Conversation; messages: Message[] } }>(`/admin/conversations/${id}/audit-view`),
};

/**
 * Service de gestion de contenu CMS par les administrateurs (Pages, FAQ, Bannières, Médias).
 */
export const adminCmsApi = {
  // Pages
  getPages: (params?: { search?: string; status?: string; page?: number; size?: number }) =>
    api.get<{ success: boolean; data: PageResponse<CmsPage> }>('/admin/cms/pages', { params }),
  getPageById: (id: number) =>
    api.get<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}`),
  createPage: (data: any) =>
    api.post<{ success: boolean; data: CmsPage }>('/admin/cms/pages', data),
  updatePage: (id: number, data: any) =>
    api.put<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}`, data),
  deletePage: (id: number, force = false) =>
    api.delete(`/admin/cms/pages/${id}?force=${force}`),
  getPageVersions: (id: number) =>
    api.get<{ success: boolean; data: PageVersion[] }>(`/admin/cms/pages/${id}/versions`),
  restoreVersion: (id: number, versionNumber: number) =>
    api.post<{ success: boolean; data: CmsPage }>(`/admin/cms/pages/${id}/versions/${versionNumber}/restore`),

  // FAQ
  getFaq: () =>
    api.get<{ success: boolean; data: FaqItem[] }>('/admin/cms/faq'),
  createFaq: (data: any) =>
    api.post<{ success: boolean; data: FaqItem }>('/admin/cms/faq', data),
  updateFaq: (id: number, data: any) =>
    api.put<{ success: boolean; data: FaqItem }>(`/admin/cms/faq/${id}`, data),
  deleteFaq: (id: number) => api.delete(`/admin/cms/faq/${id}`),

  // Footer & Settings
  getFooter: () =>
    api.get<{ success: boolean; data: FooterConfig }>('/admin/cms/footer'),
  updateFooter: (data: any) =>
    api.put<{ success: boolean; data: FooterConfig }>('/admin/cms/footer', data),

  // Announcement
  getAnnouncement: () =>
    api.get<{ success: boolean; data: AnnouncementBanner }>('/admin/cms/announcement'),
  updateAnnouncement: (data: any) =>
    api.put<{ success: boolean; data: AnnouncementBanner }>('/admin/cms/announcement', data),

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
