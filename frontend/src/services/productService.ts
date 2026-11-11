import api from './httpClient';
import { Product, Category, Country } from '../types';

/**
 * Service de gestion des articles, rayons (catégories) et pays supportés.
 */
export const productApi = {
  search: (params: any) =>
    api.get<{
      success: boolean;
      data: { content: Product[]; totalPages: number; totalElements: number };
    }>('/products', { params }),
  getById: (id: number) =>
    api.get<{ success: boolean; data: Product }>(`/products/${id}`),
  create: (data: any) =>
    api.post<{ success: boolean; data: Product }>('/products', data),
  update: (id: number, data: any) =>
    api.put<{ success: boolean; data: Product }>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getBySeller: (sellerId: number) =>
    api.get<{ success: boolean; data: Product[] }>(`/products/seller/${sellerId}`),
};

export const categoryApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Category[] }>('/categories'),
};

export const countryApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Country[] }>('/countries'),
};
