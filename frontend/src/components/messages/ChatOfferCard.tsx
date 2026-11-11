/**
 * Composant Messagerie & Négociation : ChatOfferCard
 * 
 * Gère les échanges de chat, propositions d'offres et modales associées (ChatOfferCard).
 */

import React from 'react';
import { ChatOffer } from '../../types';
import { Tag, Truck, Handshake, Check, X, CreditCard } from 'lucide-react';

interface ChatOfferCardProps {
  offer: ChatOffer;
  isBuyer: boolean;
  isSeller: boolean;
  onAccept: (offer: ChatOffer) => void;
  onDecline: (offerId: number) => void;
  onCancel: (offerId: number) => void;
  onPay: (offer: ChatOffer) => void;
  formatPrice: (amount: number) => string;
}

export const ChatOfferCard: React.FC<ChatOfferCardProps> = ({
  offer,
  isBuyer,
  isSeller,
  onAccept,
  onDecline,
  onCancel,
  onPay,
  formatPrice,
}) => {
  const isSent = offer.status === 'OFFER_SENT';
  const isAccepted = offer.status === 'OFFER_ACCEPTED';
  const isDeclined = offer.status === 'OFFER_DECLINED';
  const isCancelled = offer.status === 'OFFER_CANCELLED';

  return (
    <div className="max-w-lg mx-auto w-full bg-white rounded-3xl p-5 border-2 border-purple-200 shadow-md space-y-3.5 my-2 animate-fadeIn">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Offre directe du vendeur
            </h4>
            <p className="text-[10px] text-gray-400">
              Valable 24h • Paiement sécurisé sous séquestre
            </p>
          </div>
        </div>

        {/* Statut badge */}
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
            isSent
              ? 'bg-purple-100 text-purple-800'
              : isAccepted
              ? 'bg-emerald-100 text-emerald-800'
              : isDeclined
              ? 'bg-rose-100 text-rose-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isSent
            ? 'EN ATTENTE DE L’ACHETEUR'
            : isAccepted
            ? 'OFFRE ACCEPTÉE'
            : isDeclined
            ? 'OFFRE REFUSÉE'
            : isCancelled
            ? 'OFFRE ANNULÉE'
            : 'OFFRE EXPIRÉE'}
        </span>
      </div>

      {/* Décomposition financière claire */}
      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
        <div className="flex justify-between items-center text-gray-600">
          <span>Prix négocié de l'article :</span>
          <span className="font-bold text-gray-900">{formatPrice(offer.agreedPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-600">
          <span className="flex items-center gap-1">
            <span>Protection Séquestre ReVibe (1%) :</span>
          </span>
          <span className="font-bold text-purple-700">+ {formatPrice(offer.validationFee)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-600">
          <span className="flex items-center gap-1">
            {offer.deliveryMode === 'HOME_DELIVERY' ? (
              <Truck className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Handshake className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span>Livraison ({offer.deliveryMode === 'HOME_DELIVERY' ? 'À domicile' : 'Main propre'}) :</span>
          </span>
          <span className="font-bold text-gray-900">
            {offer.deliveryFee > 0 ? `+ ${formatPrice(offer.deliveryFee)}` : 'Gratuit (0 FCFA)'}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-black text-sm text-gray-900">
          <span>Total à payer sous séquestre :</span>
          <span className="text-purple-700 font-black">
            {formatPrice(offer.totalAmount)}
          </span>
        </div>
      </div>

      {/* Actions selon le rôle */}
      {isSent && isBuyer && (
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={() => onAccept(offer)}
            className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accepter l'offre</span>
          </button>
          <button
            onClick={() => onDecline(offer.id)}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Refuser</span>
          </button>
        </div>
      )}

      {isSent && isSeller && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => onCancel(offer.id)}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
          >
            Annuler cette offre
          </button>
        </div>
      )}

      {isAccepted && isBuyer && (
        <div className="pt-1">
          <button
            onClick={() => onPay(offer)}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>Finaliser et Payer sous Séquestre ({formatPrice(offer.totalAmount)})</span>
          </button>
        </div>
      )}
    </div>
  );
};
