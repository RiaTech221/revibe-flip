/**
 * Composant Tableau de Bord Vendeur : SellerRatingBreakdown
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerRatingBreakdown).
 */

import React from 'react';
import { Star } from 'lucide-react';
import { SellerRating } from '../../../services/sellerService';

interface SellerRatingBreakdownProps {
  rating?: SellerRating;
  onNavigateTab: (tab: string) => void;
  disabled?: boolean;
}

export const SellerRatingBreakdown: React.FC<SellerRatingBreakdownProps> = ({
  rating,
  onNavigateTab,
  disabled = false,
}) => {
  const hasReviews = !!rating && rating.hasReviews && rating.totalReviews > 0;
  const distribution = rating?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = rating?.totalReviews || 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Avis & Réputation
        </h3>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onNavigateTab('reviews')}
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer min-h-[32px] flex items-center"
        >
          Voir tous les avis
        </button>
      </div>

      {hasReviews ? (
        <div className="space-y-3 pt-1">
          {/* Note globale */}
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {rating.displayRating}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 5</span>
            </div>

            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    (rating.averageRating || 0) >= s
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>

            <span className="text-xs text-slate-400 ml-auto font-medium">
              {total} avis vérifié(s)
            </span>
          </div>

          {/* Barres de répartition 5 à 1 étoiles */}
          <div className="space-y-1.5 text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-6 text-[11px] font-bold text-slate-600 flex items-center gap-0.5">
                    {stars} <Star className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-600">Pas encore d'avis</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Vos premiers avis apparaîtront ici dès que vos acheteurs auront confirmé la réception de leurs commandes.
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerRatingBreakdown;
