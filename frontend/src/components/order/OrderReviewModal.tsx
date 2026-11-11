/**
 * Composant Suivi de Commande : OrderReviewModal
 * 
 * Affiche une section spécifique du suivi de commande, séquestre ou avis (OrderReviewModal).
 */

import React from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  setRating: (r: number) => void;
  reviewComment: string;
  setReviewComment: (c: string) => void;
  reviewSubmitting: boolean;
  reviewSubmitted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  rating,
  setRating,
  reviewComment,
  setReviewComment,
  reviewSubmitting,
  reviewSubmitted,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-150 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900">Évaluer le vendeur</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {reviewSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-gray-900">Merci pour votre avis !</h4>
            <p className="text-xs text-gray-500">
              Votre évaluation contribue à renforcer la confiance et la réputation des vendeurs de notre communauté.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-purple-700 text-white font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-gray-700 mb-2 text-center">
                Note globale de l'expérience :
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Commentaire sur l'article et la livraison :
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Article parfaitement conforme, emballage soigné, vendeur réactif..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50 cursor-pointer"
              >
                {reviewSubmitting ? 'Publication...' : 'Publier mon avis'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
