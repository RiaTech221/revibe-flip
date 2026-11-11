/**
 * Onglet / Vue Vendeur : SellerListingsTab
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerListingsTab).
 */

import React from 'react';
import { Search, PlusCircle, Edit2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface SellerListingsTabProps {
  products: Product[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  productFilterStatus: string;
  setProductFilterStatus: (st: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  formatPrice: (amount: number) => string;
}

export const SellerListingsTab: React.FC<SellerListingsTabProps> = ({
  products,
  productSearch,
  setProductSearch,
  productFilterStatus,
  setProductFilterStatus,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onDeleteProduct,
  formatPrice,
}) => {
  const statusTabs = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'ACTIVE', label: 'En vente' },
    { id: 'DRAFT', label: 'Brouillons / Masquées' },
    { id: 'SOLD', label: 'Vendues' },
  ];

  const filteredProducts = products.filter((p) => {
    if (productFilterStatus !== 'ALL' && p.status !== productFilterStatus) return false;
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mes Annonces</h1>
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

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-700/20 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publier un article</span>
          </button>
        </div>
      </div>

      {/* Onglets Filtres Statut */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-150 pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setProductFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              productFilterStatus === tab.id
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tableau des annonces */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucune annonce trouvée pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Article</th>
                  <th className="p-4">Prix</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Taille / État</th>
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
                          alt={p.title}
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
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'SOLD'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status === 'ACTIVE' ? 'EN VENTE' : p.status === 'SOLD' ? 'VENDU' : p.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      <span>{p.size || 'Unique'}</span> • <span>{p.condition || 'Bon état'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                          title={p.status === 'ACTIVE' ? 'Masquer' : 'Activer'}
                        >
                          {p.status === 'ACTIVE' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer"
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
