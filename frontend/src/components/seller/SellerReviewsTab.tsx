/**
 * Onglet / Vue Vendeur : SellerReviewsTab
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerReviewsTab).
 */

import React from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { Review } from '../../types';

interface SellerReviewsTabProps {
  reviews: Review[];
  onOpenReportModal: (reviewId: number) => void;
}

export const SellerReviewsTab: React.FC<SellerReviewsTabProps> = ({
  reviews,
  onOpenReportModal,
}) => {
  return (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Avis & Évaluations</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {reviews.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucun avis reçu pour le moment. Ils apparaîtront dès que vos acheteurs auront confirmé leur commande.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{rev.reviewerName || 'Client vérifié'}</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className={`w-3.5 h-3.5 ${
                            st <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{rev.comment || 'Sans commentaire écrit.'}</p>
                  <span className="text-[10px] text-gray-400 block">
                    {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenReportModal(rev.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  title="Signaler cet avis"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
