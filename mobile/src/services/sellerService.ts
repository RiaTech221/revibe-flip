/**
 * Services du parcours vendeur mobile : éligibilité et coordonnées de profil.
 */

import api from '../api';

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

export const sellerService = {
  getEligibility: async (): Promise<SellerEligibility> => {
    const res = await api.get('/seller/eligibility');
    return res.data?.data;
  },

  updateProfile: async (profile: SellerProfileUpdate): Promise<void> => {
    await api.put('/users/profile', profile);
  },
};

export default sellerService;
