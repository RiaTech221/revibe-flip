import React from 'react';
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { Order } from '../../types';

interface OrderEscrowCardProps {
  order: Order;
  isBuyer: boolean;
  onConfirmReceipt: () => void;
  confirmingReceipt: boolean;
  onOpenReviewModal: () => void;
}

export const OrderEscrowCard: React.FC<OrderEscrowCardProps> = ({
  order,
  isBuyer,
  onConfirmReceipt,
  confirmingReceipt,
  onOpenReviewModal,
}) => {
  const isEscrowLocked =
    order.status === 'PAID_ESCROW_LOCKED' ||
    (order.payment?.escrowStatus === 'LOCKED' && order.status !== 'COMPLETED');
  const isCompleted = order.status === 'COMPLETED' || order.payment?.escrowStatus === 'RELEASED_TO_SELLER';

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

        {isBuyer && !isCompleted && (
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
