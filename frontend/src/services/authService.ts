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
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};

export const userApi = {
  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; data: User }>('/users/profile', data),
  getProfile: (id: number) =>
    api.get<{ success: boolean; data: User }>(`/users/${id}`),
};
