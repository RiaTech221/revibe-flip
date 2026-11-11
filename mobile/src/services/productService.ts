/**
 * Service Catalogue et Annonces Mobile ReVibe FliP
 * 
 * Gère la consultation et publication des articles :
 *  * - getProducts : recherche multi-critères et pagination du catalogue
 *  * - getProductById : fiche détaillée d'un article et profil vendeur
 *  * - getCategories : liste des catégories de mode et accessoires
 *  * - createProduct : publication d'une nouvelle annonce avec photos et caractéristiques
 */

import api from '../api';
import { Product, Category, ProductCondition } from '../types';

export interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  condition: ProductCondition;
  brand?: string;
  size?: string;
  city?: string;
  images?: string[];
}

export const productService = {
  getProducts: async (params?: Record<string, any>): Promise<Product[]> => {
    const res = await api.get('/products', { params });
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (data?.content && Array.isArray(data.content)) return data.content;
    return [];
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await api.get(`/products/${id}`);
    return res.data?.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data?.data || [];
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await api.post('/products', payload);
    return res.data?.data;
  },
};

export default productService;
