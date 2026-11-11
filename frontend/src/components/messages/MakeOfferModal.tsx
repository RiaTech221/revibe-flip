/**
 * Composant Messagerie & Négociation : MakeOfferModal
 * 
 * Gère les échanges de chat, propositions d'offres et modales associées (MakeOfferModal).
 */

import React from 'react';
import { Tag, X, Truck, Handshake } from 'lucide-react';
import { DeliveryMode } from '../../types';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  offerPrice: number | '';
  setOfferPrice: (p: number | '') => void;
  offerDeliveryMode: DeliveryMode;
  setOfferDeliveryMode: (mode: DeliveryMode) => void;
  offerDeliveryFee: number;
  setOfferDeliveryFee: (fee: number) => void;
  offerError: string | null;
  offerSubmitting: boolean;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  offerPrice,
  setOfferPrice,
  offerDeliveryMode,
  setOfferDeliveryMode,
  offerDeliveryFee,
  setOfferDeliveryFee,
  offerError,
  offerSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-150">
        <div className="flex items-center justify-between pb-2 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              Proposer une offre directe
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {offerError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
              {offerError}
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Prix négocié de l'article (FCFA) *
            </label>
            <input
              type="number"
              min="500"
              required
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ex: 15000"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-black text-sm text-purple-700 focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Ne peut pas dépasser le prix initial affiché sur l'annonce.
            </p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Mode de remise convenu *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOfferDeliveryMode('HOME_DELIVERY');
                  setOfferDeliveryFee(2000);
                }}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  offerDeliveryMode === 'HOME_DELIVERY'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <Truck className="w-4 h-4 mb-1 text-purple-700" />
                <span>À domicile</span>
                <span className="block text-[10px] font-normal text-gray-500">2 000 FCFA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOfferDeliveryMode('DIRECT_HANDOVER');
                  setOfferDeliveryFee(0);
                }}
                className={`p-3 rounded-xl border font-bold text-left transition-all ${
                  offerDeliveryMode === 'DIRECT_HANDOVER'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <Handshake className="w-4 h-4 mb-1 text-purple-700" />
                <span>Main propre</span>
                <span className="block text-[10px] font-normal text-emerald-600">Gratuit</span>
              </button>
            </div>
          </div>

          {offerDeliveryMode === 'HOME_DELIVERY' && (
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Frais de livraison (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={offerDeliveryFee}
                onChange={(e) => setOfferDeliveryFee(Number(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-bold"
              />
            </div>
          )}

          {/* Récapitulatif prévisionnel */}
          {offerPrice && (
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-150 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de validation acheteur (1%) :</span>
                <span className="font-bold text-purple-700">
                  {Math.round(Number(offerPrice) * 0.01).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between font-black text-xs text-gray-900 pt-1 border-t border-purple-100">
                <span>Total payé par l'acheteur :</span>
                <span className="text-purple-800">
                  {(
                    Number(offerPrice) +
                    Math.round(Number(offerPrice) * 0.01) +
                    (offerDeliveryMode === 'HOME_DELIVERY' ? Number(offerDeliveryFee) : 0)
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </span>
              </div>
            </div>
          )}

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
              disabled={offerSubmitting}
              className="flex-1 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50"
            >
              {offerSubmitting ? 'Envoi...' : 'Envoyer l’offre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
