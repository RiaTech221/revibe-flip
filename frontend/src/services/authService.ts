/**
 * Service d'Authentification et de Gestion des Utilisateurs ReVibe FliP
 * 
 * Gère le cycle de vie de la session utilisateur :
 *  * - Connexion par identifiant/mot de passe et échange de JWT token
 *  * - Inscription avec sélection du pays et devise d'Afrique de l'Ouest / Centrale
 *  * - Vérification OTP (SMS / Code de validation)
 *  * - Récupération et mise à jour du profil utilisateur connecté
 */

import api from './httpClient';
import { User } from '../types';

/**
 * Service d'authentification et gestion des sessions utilisateurs (JWT, OTP, Profil).
 */
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  verifyOtp: (data: { phone: string; otpCode: string }) => api.post('/auth/verify-otp', data),
  resendOtp: (phone: string) => api.post(`/auth/resend-otp?phone=${encodeURIComponent(phone)}`),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (phone: string) => api.post('/auth/forgot-password', { phone }),
  resetPassword: (data: { phone: string; otpCode: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};

export const userApi = {
  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; data: User }>('/users/profile', data),
  getProfile: (id: number) =>
    api.get<{ success: boolean; data: User }>(`/users/${id}`),
};
