import React from 'react';
import { CreditCard, X, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
import { ChatOffer, PaymentMethod } from '../../types';

interface OfferPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: ChatOffer | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  paymentPhone: string;
  setPaymentPhone: (phone: string) => void;
  paymentLoading: boolean;
  paymentSuccess: boolean;
  paymentError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  formatPrice: (amount: number) => string;
}

export const OfferPaymentModal: React.FC<OfferPaymentModalProps> = ({
  isOpen,
  onClose,
  offer,
  paymentMethod,
  setPaymentMethod,
  paymentPhone,
  setPaymentPhone,
  paymentLoading,
  paymentSuccess,
  paymentError,
  onSubmit,
  formatPrice,
}) => {
  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-150">
        <div className="flex items-center justify-between pb-2 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              Paiement sous Séquestre Certifié
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-black text-gray-900">
              Paiement Séquestre Validé avec Succès !
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Vos fonds ({formatPrice(offer.totalAmount)}) sont bloqués en toute sécurité. Le vendeur a été notifié pour préparer et expédier votre commande.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-purple-700 text-white font-bold text-xs"
              >
                Retour à la discussion
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 text-xs">
            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                {paymentError}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <span className="text-purple-900 font-medium">Montant total net :</span>
              <span className="text-base font-black text-purple-700">
                {formatPrice(offer.totalAmount)}
              </span>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Passerelle Mobile Money locale *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WAVE')}
                  className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${
                    paymentMethod === 'WAVE'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <span>Wave Sénégal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ORANGE_MONEY')}
                  className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition-all ${
                    paymentMethod === 'ORANGE_MONEY'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Numéro de téléphone payeur *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+221 77 000 00 00"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 font-medium"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2 text-[11px] text-gray-600">
              <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <span>
                <strong>Garantie Séquestre :</strong> L'argent ne sera crédité au vendeur qu'après confirmation de votre part à la livraison.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={paymentLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>{paymentLoading ? 'Paiement...' : 'Payer maintenant'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
