import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Search,
  Check,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Product } from '../../../types';

interface EasyProductsSectionProps {
  products: Product[];
  onSetProductStatus: (productId: number, status: string) => void;
  onDeleteProduct: (productId: number) => void;
  formatPrice: (amount?: number | null) => string;
}

export const EasyProductsSection: React.FC<EasyProductsSectionProps> = ({
  products,
  onSetProductStatus,
  onDeleteProduct,
  formatPrice,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'ACTIVE' && p.status === 'ACTIVE') ||
      (filter === 'INACTIVE' && p.status !== 'ACTIVE');

    const matchesSearch =
      searchTerm.trim() === '' ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.seller?.fullName && p.seller.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.locationCity && p.locationCity.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const pendingCount = products.filter((p) => p.status !== 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EN-TÊTE FACILE & EXPLICATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Gestion facile des articles</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Vérifier et Valider les Vêtements
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Vous décidez quels vêtements sont visibles par les acheteurs sur le site.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              🟢 {activeCount} en ligne
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                ⏳ {pendingCount} masqué(s)
              </span>
            )}
          </div>
        </div>

        {/* 2. RECHERCHE & FILTRES SIMPLES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, ville ou vendeur..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tous ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              En ligne ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'INACTIVE' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Masqués ({pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTE DES CARTES ARTICLES (GRANDE TAILLE ET CLAIRE) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-150">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-800">Aucun vêtement trouvé</h4>
          <p className="text-xs text-gray-400 mt-1">
            Essayez de modifier votre recherche ou de changer de filtre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const isActive = p.status === 'ACTIVE';
            const isSold = p.status === 'SOLD';
            const isReserved = p.status === 'RESERVED';
            const imageUrl = p.images && p.images.length > 0 ? p.images[0] : null;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Photo de l'article */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-purple-50">
                        <ShoppingBag className="w-10 h-10 text-purple-300 mb-1" />
                        <span className="text-xs font-medium">Pas de photo</span>
                      </div>
                    )}

                    {/* Pastille Statut */}
                    <div className="absolute top-3 left-3">
                      {isActive ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Visible sur le site</span>
                        </span>
                      ) : isSold ? (
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-white text-[11px] font-black shadow-md flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Vendu</span>
                        </span>
                      ) : isReserved ? (
                        <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black shadow-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Réservé (en paiement)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black shadow-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Masqué du site</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white font-black text-xs shadow-md">
                      {formatPrice(p.price)}
                    </div>
                  </div>

                  {/* Détails de l'article */}
                  <div className="p-5 space-y-2">
                    <h4 className="text-sm font-black text-gray-900 line-clamp-1">
                      {p.title}
                    </h4>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Vendeur :{' '}
                        <strong className="text-gray-800">
                          {p.seller?.fullName || 'Vendeur'}
                        </strong>
                      </div>
                      <div>
                        Ville : <strong className="text-gray-700">{p.locationCity || 'Dakar'}</strong>
                      </div>
                      {p.categoryName && (
                        <div>
                          Rayon : <span className="text-purple-700 font-bold">{p.categoryName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action clairs */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                  {isSold || isReserved ? (
                    <div className="flex-1 h-10 px-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                      {isSold ? 'Article déjà vendu' : 'Commande en attente de paiement'}
                    </div>
                  ) : isActive ? (
                    <button
                      type="button"
                      onClick={() => onSetProductStatus(p.id, 'INACTIVE')}
                      className="flex-1 h-10 px-3 rounded-2xl bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Masquer du site</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetProductStatus(p.id, 'ACTIVE')}
                      className="flex-1 h-10 px-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Valider & Mettre en ligne</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteProduct(p.id)}
                    className="w-10 h-10 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
                    title="Supprimer définitivement l'article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
