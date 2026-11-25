import React from 'react';
import { Tag, MessageSquare, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { ChatOffer } from '../../types';
import { formatImageUrl } from '../../utils/imageUrl';

interface SellerOffersTabProps {
  offers: ChatOffer[];
  onCancelOffer: (offerId: number) => void;
  onOpenConversation: (conversationId: number) => void;
  formatPrice: (amount: number) => string;
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  OFFER_SENT: { label: 'En attente', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  OFFER_ACCEPTED: { label: 'Acceptée', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OFFER_DECLINED: { label: 'Refusée', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  OFFER_CANCELLED: { label: 'Annulée', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  OFFER_EXPIRED: { label: 'Expirée', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  PAID_ESCROW: { label: 'Payée (Séquestre)', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const SellerOffersTab: React.FC<SellerOffersTabProps> = ({
  offers,
  onCancelOffer,
  onOpenConversation,
  formatPrice,
}) => {
  return (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offres Directes</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {offers.length}
          </span>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-gray-150 shadow-xs text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-gray-900">Aucune offre directe pour le moment</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Lorsque vous négociez un prix avec un acheteur dans la messagerie, vos offres directes apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const meta = STATUS_META[offer.status] || {
              label: offer.status,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const isPending = offer.status === 'OFFER_SENT' && !offer.isExpired;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {offer.productImageUrl ? (
                    <img
                      src={formatImageUrl(offer.productImageUrl)}
                      alt={offer.productTitle}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-gray-100 border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-sm text-gray-900 truncate">{offer.productTitle}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}>
                        {offer.isExpired && offer.status === 'OFFER_SENT' ? 'Expirée' : meta.label}
                      </span>
                    </div>
                    <p className="text-gray-500">
                      Acheteur : <span className="font-semibold text-gray-800">{offer.buyerName}</span>
                      {' · '}
                      Prix initial : <span className="line-through">{formatPrice(offer.initialPrice)}</span>
                    </p>
                    <p className="text-gray-700 font-semibold">
                      Offre : <span className="text-purple-700 font-black">{formatPrice(offer.agreedPrice)}</span>
                      {' · '}
                      Livraison : {formatPrice(offer.deliveryFee)}
                      {' · '}
                      Total : <span className="font-black">{formatPrice(offer.totalAmount)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenConversation(offer.conversationId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discussion</span>
                  </button>
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => onCancelOffer(offer.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Annuler l'offre</span>
                    </button>
                  )}
                  {offer.status === 'OFFER_ACCEPTED' && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold px-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Validée
                    </span>
                  )}
                  {offer.status === 'OFFER_DECLINED' && (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold px-2">
                      <XCircle className="w-4 h-4" />
                      Refusée
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold px-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.max(0, Math.floor((offer.secondsRemaining || 0) / 3600))}h rest.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
