/**
 * Service de Gestion des Contenus, Avis et Médias ReVibe FliP
 * 
 * Fournit les fonctionnalités de contenu dynamique et communautaire :
 *  * - Pages CMS et articles d'aide (FAQ, CGU, Comment ça marche)
 *  * - Dépôt et consultation des avis et évaluations vérifiées
 *  * - Signalement d'annonces frauduleuses ou d'utilisateurs suspects
 *  * - Téléversement d'images produits vers le stockage de la plateforme
 */

import api from './httpClient';
import {
  FooterConfig,
  AnnouncementBanner,
  CmsPage,
  FaqItem,
  ContactMessage,
  Review,
  Notification,
} from '../types';

/**
 * Service de gestion des contenus publics, avis clients, signalements, notifications et uploads.
 */
export const contentApi = {
  getFooter: () =>
    api.get<{ success: boolean; data: FooterConfig }>('/content/footer'),
  getAnnouncement: () =>
    api.get<{ success: boolean; data: AnnouncementBanner }>('/content/announcement'),
  getAllPages: () =>
    api.get<{ success: boolean; data: CmsPage[] }>('/pages'),
  getPage: (slug: string) =>
    api.get<{ success: boolean; data: CmsPage }>(`/pages/${slug}`),
  getFaq: () =>
    api.get<{ success: boolean; data: FaqItem[] }>('/faq'),
  submitContact: (data: { fullName: string; email?: string; phone?: string; subject: string; message: string }) =>
    api.post<{ success: boolean; data: ContactMessage; message: string }>('/contact', data),
};

export const reviewApi = {
  create: (data: { orderId: number; rating: number; comment?: string }) =>
    api.post<{ success: boolean; data: Review }>('/reviews', data),
  getUserReviews: (userId: number) =>
    api.get<{ success: boolean; data: Review[] }>(`/reviews/user/${userId}`),
};

export const reportApi = {
  create: (data: any) => api.post('/reports', data),
};

export const notificationApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Notification[] }>('/notifications'),
  getUnreadCount: () =>
    api.get<{ success: boolean; data: number }>('/notifications/unread-count'),
  markAllAsRead: () => api.put('/notifications/read-all'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
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
