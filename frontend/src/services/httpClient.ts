import axios from 'axios';

/**
 * URL de base de l'API REST Backend Spring Boot.
 * Configurable via la variable d'environnement VITE_API_URL.
 */
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Client HTTP Axios centralisé pour la plateforme ReVibe FliP.
 * Gère l'injection automatique du token JWT d'authentification pour chaque requête.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur HTTP : injection automatique du Bearer Token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('revibeflip_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
