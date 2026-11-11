import React from 'react';
import { Link } from 'react-router-dom';
import { Conversation, User, ChatOffer } from '../../types';
import { Tag, CreditCard, ExternalLink } from 'lucide-react';

interface ChatHeaderProps {
  activeConversation: Conversation;
  currentUser: User | null;
  latestOffer: ChatOffer | null;
  onOpenMakeOffer: () => void;
  onOpenPaymentModal: (offer: ChatOffer) => void;
  formatPrice: (amount: number) => string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  currentUser,
  latestOffer,
  onOpenMakeOffer,
  onOpenPaymentModal,
  formatPrice,
}) => {
  const isSeller = activeConversation.seller?.id === currentUser?.id;
  const isBuyer = activeConversation.buyer?.id === currentUser?.id;

  const otherUser = activeConversation.buyer?.id === currentUser?.id
    ? activeConversation.seller
    : activeConversation.buyer;

  return (
    <div className="bg-white border-b border-gray-150 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={
              otherUser?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                otherUser?.fullName || 'U'
              )}&background=9333ea&color=fff`
            }
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-purple-100"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-gray-900 truncate">
              {otherUser?.fullName}
            </h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <span>{isSeller ? 'Acheteur intéressé' : 'Vendeur vérifié'}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Dakar, Sénégal</span>
            </p>
          </div>
        </div>

        {/* Actions Rapides En-tête */}
        <div className="flex items-center gap-2">
          {isSeller && (
            <button
              onClick={onOpenMakeOffer}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Faire une offre</span>
            </button>
          )}

          {isBuyer && latestOffer && latestOffer.status === 'OFFER_ACCEPTED' && (
            <button
              onClick={() => onOpenPaymentModal(latestOffer)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 animate-pulse"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payer l'offre ({formatPrice(latestOffer.totalAmount)})</span>
            </button>
          )}

          {isBuyer && activeConversation.productId && (!latestOffer || latestOffer.status !== 'OFFER_ACCEPTED') && (
            <Link
              to={`/checkout/${activeConversation.productId}`}
              className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-98"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payer sur la plateforme</span>
            </Link>
          )}
        </div>
      </div>

      {/* BANDEAU ÉPINGLÉ : ARTICLE CONCERNÉ */}
      {activeConversation.productId && (
        <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/90 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                activeConversation.productImageUrl ||
                'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=150&q=80'
              }
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0"
            />
            <div className="min-w-0">
              <Link
                to={`/product/${activeConversation.productId}`}
                className="font-bold text-gray-900 hover:text-purple-700 truncate block text-xs flex items-center gap-1"
              >
                <span className="truncate">{activeConversation.productTitle}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
              </Link>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <span className="font-black text-purple-700">
                  {activeConversation.productPrice}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  {activeConversation.productCondition || 'Pièce unique'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isBuyer && (
              <Link
                to={`/checkout/${activeConversation.productId}`}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 transition-all hover:scale-102"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Valider & Payer ({activeConversation.productPrice})</span>
              </Link>
            )}
            <Link
              to={`/product/${activeConversation.productId}`}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-white transition-colors"
            >
              Voir fiche
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
