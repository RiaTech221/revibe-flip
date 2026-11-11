import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface CatalogGridProps {
  products: Product[];
  loading: boolean;
  onResetFilters: () => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  products,
  loading,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-2xl aspect-[3/4] border border-gray-150 p-3 flex flex-col justify-between"
          >
            <div className="w-full h-2/3 bg-gray-100 rounded-xl" />
            <div className="space-y-2 mt-2">
              <div className="w-3/4 h-3 bg-gray-100 rounded" />
              <div className="w-1/2 h-3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 p-8 space-y-3">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-gray-900">Aucun article ne correspond à vos filtres</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Essayez d'élargir votre recherche, de supprimer certains filtres ou d'explorer nos sélections populaires.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95 cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((prod) => (
        <ProductCard key={prod.id} product={prod} />
      ))}
    </div>
  );
};
