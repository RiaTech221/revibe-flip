/**
 * Service d'Authentification et de Gestion des Utilisateurs ReVibe FliP
 * 
 * Gère le cycle de vie de la session utilisateur :
 *  * - Connexion par identifiant/mot de passe et échange de JWT token
 *  * - Inscription avec sélection du pays et devise d'Afrique de l'Ouest / Centrale
 *  * - Vérification OTP (SMS / Code de validation)
 *  * - Récupération et mise à jour du profil utilisateur connecté
 */

import api, { turnstileConfig } from './httpClient';
import { User } from '../types';

/**
 * Service d'authentification et gestion des sessions utilisateurs (JWT, OTP, Profil).
 */
export const authApi = {
  register: (data: any, turnstileToken?: string) =>
    api.post('/auth/register', data, turnstileConfig(turnstileToken)),
  verifyOtp: (data: { phone: string; otpCode: string }) => api.post('/auth/verify-otp', data),
  skipOtp: (phone: string) => api.post(`/auth/skip-otp?phone=${encodeURIComponent(phone)}`),
  resendOtp: (phone: string, turnstileToken?: string) =>
    api.post(`/auth/resend-otp?phone=${encodeURIComponent(phone)}`, undefined, turnstileConfig(turnstileToken)),
  login: (data: any, turnstileToken?: string) =>
    api.post('/auth/login', data, turnstileConfig(turnstileToken)),
  forgotPassword: (phone: string, turnstileToken?: string) =>
    api.post('/auth/forgot-password', { phone }, turnstileConfig(turnstileToken)),
  resetPassword: (data: { phone: string; otpCode: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  refresh: () => api.post('/auth/refresh', {}),
  logout: () => api.post('/auth/logout', {}),
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};

export const userApi = {
  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; data: User; message?: string }>('/users/profile', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; data: User; message?: string }>(
      '/users/profile/picture',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  getProfile: (id: number) =>
    api.get<{ success: boolean; data: User }>(`/users/${id}`),
};
