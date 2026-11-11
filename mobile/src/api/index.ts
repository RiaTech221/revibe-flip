/**
 * Configuration du Client API Axios Mobile ReVibe FliP
 * 
 * Configure les requêtes HTTP de l'application mobile vers le backend Spring Boot :
 *  * - Détection automatique de l'environnement : IP 10.0.2.2 pour émulateur Android, localhost pour iOS/Web
 *  * - Gestionnaire central du token d'authentification JWT (setAuthToken)
 *  * - Intercepteur de requête pour l'injection automatique de l'en-tête Authorization Bearer
 *  * - Délais d'expiration (timeout 10s) et types MIME JSON
 */

import axios from 'axios';
import { Platform } from 'react-native';

// Android emulator: 10.0.2.2, iOS simulator: localhost, or device local IP
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default api;
