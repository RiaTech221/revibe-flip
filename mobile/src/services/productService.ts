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
