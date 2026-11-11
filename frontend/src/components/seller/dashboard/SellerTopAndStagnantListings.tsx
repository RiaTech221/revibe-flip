/**
 * Composant Tableau de Bord Vendeur : SellerTopAndStagnantListings
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerTopAndStagnantListings).
 */

import React, { useState } from 'react';
import { Tag, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { SellerTopProduct, SellerStagnantProduct } from '../../../services/sellerService';

interface SellerTopAndStagnantListingsProps {
  topProducts?: SellerTopProduct[];
  stagnantProducts?: SellerStagnantProduct[];
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string, filter?: string) => void;
  disabled?: boolean;
}

export const SellerTopAndStagnantListings: React.FC<SellerTopAndStagnantListingsProps> = ({
  topProducts = [],
  stagnantProducts = [],
  formatPrice,
  onNavigateTab,
  disabled = false,
}) => {
  const [viewMode, setViewMode] = useState<'top' | 'stagnant'>('top');

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      {/* Header avec bascule */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Performance des annonces
        </h3>

        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setViewMode('top')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer min-h-[32px] ${
              viewMode === 'top'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Meilleures ventes
          </button>
          <button
            type="button"
            onClick={() => setViewMode('stagnant')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer min-h-[32px] ${
              viewMode === 'stagnant'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            À booster
          </button>
        </div>
      </div>

      {/* Contenu : Top Ventes */}
      {viewMode === 'top' && (
        <div className="space-y-2 pt-1">
          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune vente enregistrée</p>
          ) : (
            topProducts.slice(0, 5).map((p, idx) => (
              <div
                key={p.id}
                onClick={!disabled ? () => onNavigateTab('listings') : undefined}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-400 font-bold text-[11px] w-4">#{idx + 1}</span>
                  {p.primaryImage ? (
                    <img
                      src={p.primaryImage}
                      alt={p.title}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[180px]">
                    {p.title}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 block">
                    {formatPrice(p.totalRevenue)}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {p.salesCount} vendue(s)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contenu : Annonces stagnantes à booster */}
      {viewMode === 'stagnant' && (
        <div className="space-y-2 pt-1">
          {stagnantProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune annonce inactive</p>
          ) : (
            stagnantProducts.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={!disabled ? () => onNavigateTab('listings') : undefined}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                    {p.title}
                  </span>
                  <span className="font-bold text-slate-700 shrink-0">
                    {formatPrice(p.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{p.viewCount} vue(s) • il y a {p.daysSinceCreation} j</span>
                  <span className="text-purple-700 font-medium">{p.suggestion}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SellerTopAndStagnantListings;
