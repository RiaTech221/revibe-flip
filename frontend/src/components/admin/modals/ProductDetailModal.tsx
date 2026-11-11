/**
 * Modale d'Action Administration : ProductDetailModal
 * 
 * Permet aux modérateurs et administrateurs d'exécuter des actions ciblées (ProductDetailModal).
 */

import React from 'react';
import { X } from 'lucide-react';
import { Product } from '../../../types';

interface ProductDetailModalProps {
  productDetail: Product | null;
  onClose: () => void;
  onDeleteProduct: (id: number) => void;
  onProductStatus: (id: number, newStatus: string) => void;
  formatPrice: (price?: number | null) => string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productDetail,
  onClose,
  onDeleteProduct,
  onProductStatus,
  formatPrice,
}) => {
  if (!productDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-150 pb-3">
          <h3 className="text-base font-black text-gray-900 truncate">
            Détail de l'Annonce #{productDetail.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 items-start">
          <img
            src={
              productDetail.primaryImage ||
              (productDetail.images && productDetail.images[0])
            }
            alt={productDetail.title}
            className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm shrink-0"
          />
          <div className="space-y-1 text-xs">
            <h4 className="font-black text-sm text-gray-900">{productDetail.title}</h4>
            <p className="text-purple-700 font-black text-base">{formatPrice(productDetail.price)}</p>
            <p className="text-gray-500">
              Vendeur : <strong>{productDetail.seller?.fullName}</strong>
            </p>
            <p className="text-gray-500">Ville : {productDetail.locationCity}</p>
            <p className="text-gray-500">
              État : {productDetail.conditionLabel || productDetail.condition}
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
          {productDetail.description || 'Aucune description fournie.'}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-150">
          <button
            onClick={() => onDeleteProduct(productDetail.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            Supprimer définitivement
          </button>

          <button
            onClick={() =>
              onProductStatus(
                productDetail.id,
                productDetail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
              )
            }
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 cursor-pointer"
          >
            {productDetail.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>
    </div>
  );
};
