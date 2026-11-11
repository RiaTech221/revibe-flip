/**
 * Service d'Authentification Mobile ReVibe FliP
 * 
 * Gère les requêtes d'authentification et gestion de session :
 *  * - login : connexion par téléphone/email et récupération du token JWT
 *  * - register : inscription d'un nouvel utilisateur avec pays d'Afrique de l'Ouest/Centrale
 *  * - getProfile : récupération du profil complet (Trust Score, note, pays)
 */

import api from '../api';
import { User } from '../types';

export interface LoginCredentials {
  identifier?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface RegisterPayload {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  countryCode?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', credentials);
    return res.data?.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', payload);
    return res.data?.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data?.data;
  },
};

export default authService;
