/**
 * Section de Gestion Admin : AdminProductsSection
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminProductsSection).
 */

import React from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface AdminProductsSectionProps {
  products: Product[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  productStatusFilter: string;
  setProductStatusFilter: (st: string) => void;
  onSetProductStatus: (productId: number, status: string) => void;
  onDeleteProduct: (productId: number) => void;
  formatPrice: (amount: number) => string;
}

export const AdminProductsSection: React.FC<AdminProductsSectionProps> = ({
  products,
  productSearch,
  setProductSearch,
  productStatusFilter,
  setProductStatusFilter,
  onSetProductStatus,
  onDeleteProduct,
  formatPrice,
}) => {
  const filteredProducts = products.filter((p) => {
    if (productStatusFilter !== 'ALL' && p.status !== productStatusFilter) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Modération des Annonces</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {products.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, marque..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucun article trouvé pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Article</th>
                  <th className="p-4">Prix</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Vendeur</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.primaryImage ||
                            (p.images && p.images[0]) ||
                            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=100&q=80'
                          }
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate max-w-xs">{p.title}</h4>
                          <span className="text-[11px] text-gray-400">{p.brand || 'Sans marque'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-black text-purple-700">{formatPrice(p.price)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'SOLD'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{p.seller?.fullName || 'Vendeur'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => onSetProductStatus(p.id, 'INACTIVE')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSetProductStatus(p.id, 'ACTIVE')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                          >
                            Activer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
