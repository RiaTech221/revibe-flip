/**
 * Services du parcours vendeur mobile : éligibilité et coordonnées de profil.
 */

import api from '../api';
import type { Product } from '../types';

export interface SellerEligibility {
  eligible: boolean;
  alreadySeller: boolean;
  missingFields: string[];
  invalidFields: Record<string, string>;
  message?: string;
}

export interface SellerProfileUpdate {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  address: string;
}

export interface SellerProductUpdate {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: number;
  condition: Product['condition'];
  brand?: string;
  size?: string;
  color?: string;
  defects?: string;
  measurements?: string;
  locationCity?: string;
  images: string[];
  isDraft?: boolean;
}

export const sellerService = {
  getEligibility: async (): Promise<SellerEligibility> => {
    const res = await api.get('/seller/eligibility');
    return res.data?.data;
  },

  updateProfile: async (profile: SellerProfileUpdate): Promise<void> => {
    await api.put('/users/profile', profile);
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await api.get('/seller/products', { params: { page: 0, size: 50 } });
    return res.data?.data?.content || [];
  },

  updateProduct: async (id: number, product: SellerProductUpdate): Promise<Product> => {
    const res = await api.put(`/seller/products/${id}`, product);
    return res.data?.data;
  },
};

export default sellerService;
