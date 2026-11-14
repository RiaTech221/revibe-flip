/**
 * Configuration du Client API Axios Mobile ReVibe FliP
 * - En production (!__DEV__), impose HTTPS via EXPO_PUBLIC_API_URL
 * - Gestion des jetons en mémoire avec rafraîchissement automatique sur 401
 */

import axios from 'axios';
import { Platform } from 'react-native';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEV_FALLBACK_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

export const API_BASE_URL = ENV_API_URL || (__DEV__ ? DEV_FALLBACK_URL : '');

if (!__DEV__ && (!API_BASE_URL || !API_BASE_URL.startsWith('https://'))) {
  throw new Error('Configuration invalide : EXPO_PUBLIC_API_URL doit utiliser HTTPS en production.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let authToken: string | null = null;
let refreshTokenValue: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setRefreshToken = (token: string | null) => {
  refreshTokenValue = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry && refreshTokenValue) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshTokenValue,
        });
        const newToken = res.data?.data?.token;
        const nextRefresh = res.data?.data?.refreshToken;
        if (newToken) {
          authToken = newToken;
          if (nextRefresh) refreshTokenValue = nextRefresh;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        authToken = null;
        refreshTokenValue = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
