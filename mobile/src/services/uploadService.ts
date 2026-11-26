/** Téléversement des photos sélectionnées dans la galerie vers l'API ReVibe. */

import api from '../api';
import type { ImagePickerAsset } from 'expo-image-picker';

export const uploadService = {
  uploadProductImage: async (asset: ImagePickerAsset): Promise<string> => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (asset.mimeType && !supportedTypes.includes(asset.mimeType.toLowerCase())) {
      throw new Error('Format non pris en charge. Choisissez une image JPG, PNG ou WebP.');
    }
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      throw new Error('Chaque photo doit faire 5 Mo maximum.');
    }

    const formData = new FormData();
    formData.append(
      'file',
      {
        uri: asset.uri,
        name: asset.fileName || `article-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any,
    );
    formData.append('context', 'products');

    const response = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Les images sont validées et nettoyées côté serveur avant stockage ;
      // ce traitement peut dépasser le délai standard de 10 secondes de l'API.
      timeout: 60_000,
    });
    const imageUrl = response.data?.data;
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Le serveur n’a pas retourné l’adresse de la photo téléversée.');
    }
    return imageUrl;
  },
};

export default uploadService;
