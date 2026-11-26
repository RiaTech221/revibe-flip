/**
 * Composant Suivi de Commande : OrderEscrowCard
 * 
 * Affiche une section spécifique du suivi de commande, séquestre ou avis (OrderEscrowCard).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Lock, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';

interface OrderEscrowCardProps {
  order: Order;
  isBuyer: boolean;
  onConfirmReceipt: () => void;
  confirmingReceipt: boolean;
  onOpenReviewModal: () => void;
  onRetryPayment?: (method: PaymentMethod) => void;
  onVerifyPayment?: () => void;
  onCancelOrder?: () => void;
  paymentActionLoading?: boolean;
}

export const OrderEscrowCard: React.FC<OrderEscrowCardProps> = ({
  order,
  isBuyer,
  onConfirmReceipt,
  confirmingReceipt,
  onOpenReviewModal,
  onRetryPayment,
  onVerifyPayment,
  onCancelOrder,
  paymentActionLoading = false,
}) => {
  const isPendingPayment =
    order.status === 'PENDING_PAYMENT' || order.status === 'AWAITING_PAYMENT';
  const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const isCompleted =
    order.status === 'COMPLETED' || order.payment?.escrowStatus === 'RELEASED_TO_SELLER';
  const isEscrowLocked =
    !isPendingPayment &&
    !isCancelled &&
    !isCompleted &&
    (order.status === 'PAID_ESCROW_LOCKED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED' ||
      order.status === 'DISPUTED' ||
      order.payment?.escrowStatus === 'LOCKED');
  const canConfirmReceipt =
    isBuyer &&
    !isCompleted &&
    (order.status === 'DELIVERED' || order.deliveryStatus === 'DELIVERED');

  if (isCancelled) {
    return (
      <div className="rounded-3xl p-6 border bg-rose-50/60 border-rose-200 text-rose-950 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">
                {order.status === 'EXPIRED' ? 'Commande expirée' : 'Commande annulée — Paiement non abouti'}
              </h4>
              <p className="text-xs text-rose-800 mt-1 max-w-xl">
                Aucun fonds n'est bloqué en séquestre. L'annonce a été automatiquement remise en vente (statut ACTIVE).
              </p>
            </div>
          </div>
          {order.productId && (
            <Link
              to={`/product/${order.productId}`}
              className="px-5 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shrink-0 text-center transition-all"
            >
              Revoir l'annonce
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (isPendingPayment) {
    return (
      <div className="rounded-3xl p-6 border bg-amber-50/70 border-amber-200 text-amber-950 transition-all space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">En attente de règlement Mobile Money</h4>
              <p className="text-xs text-amber-900 mt-1 max-w-xl">
                Finalisez le paiement via Wave, Orange Money ou Free Money pour verrouiller les fonds sous séquestre et notifier le vendeur.
              </p>
            </div>
          </div>
          {isBuyer && onVerifyPayment && (
            <button
              type="button"
              onClick={onVerifyPayment}
              disabled={paymentActionLoading}
              className="px-4 py-2.5 rounded-2xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${paymentActionLoading ? 'animate-spin' : ''}`} />
              <span>Vérifier le paiement</span>
            </button>
          )}
        </div>

        {isBuyer && onRetryPayment && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onRetryPayment('WAVE')}
              disabled={paymentActionLoading}
              className="px-4 py-2.5 rounded-2xl bg-[#00adef] hover:bg-[#009bd6] text-white font-black text-xs disabled:opacity-50 cursor-pointer"
            >
              Payer avec Wave
            </button>
            <button
              type="button"
              onClick={() => onRetryPayment('ORANGE_MONEY')}
              disabled={paymentActionLoading}
              className="px-4 py-2.5 rounded-2xl bg-[#ff7900] hover:bg-[#e06b00] text-white font-black text-xs disabled:opacity-50 cursor-pointer"
            >
              Payer avec Orange Money
            </button>
            <button
              type="button"
              onClick={() => onRetryPayment('FREE_MONEY')}
              disabled={paymentActionLoading}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs disabled:opacity-50 cursor-pointer"
            >
              Payer avec Free Money
            </button>
            {onCancelOrder && (
              <button
                type="button"
                onClick={onCancelOrder}
                disabled={paymentActionLoading}
                className="px-4 py-2.5 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                Annuler la commande
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl p-6 border transition-all ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : isEscrowLocked
          ? 'bg-gradient-to-r from-purple-50 via-white to-purple-50 border-purple-200 text-purple-950'
          : 'bg-gray-50 border-gray-200 text-gray-900'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-700 text-white'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-black flex items-center gap-1.5">
              <span>{isCompleted ? 'Transaction Clôturée — Escrow Libéré' : 'Fonds Protégés sous Séquestre'}</span>
              <ShieldCheck className="w-4 h-4 text-purple-700" />
            </h4>
            <p className="text-xs text-gray-600 mt-1 max-w-xl">
              {isCompleted
                ? 'L\'acheteur a confirmé la conformité de l\'article. Le paiement a été transféré sur le solde vendeur.'
                : 'Votre argent est conservé en toute sécurité par ReVibe FliP. Le vendeur ne sera payé que lorsque vous aurez reçu et validé votre colis.'}
            </p>
          </div>
        </div>

        {canConfirmReceipt && (
          <button
            type="button"
            onClick={onConfirmReceipt}
            disabled={confirmingReceipt}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{confirmingReceipt ? 'Validation...' : 'Confirmer la réception conforme'}</span>
          </button>
        )}

        {isBuyer && isCompleted && (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="px-5 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Laisser un avis (1-5★)</span>
          </button>
        )}
      </div>
    </div>
  );
};
