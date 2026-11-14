/**
 * Onglet / Vue Vendeur : SellerOrdersTab
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerOrdersTab).
 */

import React from 'react';
import { Package, Truck, Phone, CheckCircle2 } from 'lucide-react';
import { Order } from '../../types';

interface SellerOrdersTabProps {
  orders: Order[];
  onAcceptOrder: (orderId: number) => void;
  onOpenRefuseModal: (orderId: number) => void;
  onMarkReadyForPickup: (orderId: number) => void;
  formatPrice: (amount: number) => string;
}

export const SellerOrdersTab: React.FC<SellerOrdersTabProps> = ({
  orders,
  onAcceptOrder,
  onOpenRefuseModal,
  onMarkReadyForPickup,
  formatPrice,
}) => {
  return (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Commandes Reçues</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucune commande reçue pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((ord) => (
              <div key={ord.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <img
                    src={
                      ord.productImageUrl ||
                      '/placeholder-product.svg'
                    }
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-200"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-500">{ord.orderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'PAID_ESCROW_LOCKED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ord.status === 'PAID_ESCROW_LOCKED' ? 'PAYÉ SOUS SÉQUESTRE' : ord.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm truncate">{ord.productTitle}</h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span>Client : {ord.buyer?.fullName || 'Client ReVibe'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-gray-700">
                        <Phone className="w-3 h-3 text-purple-700" />
                        {ord.deliveryPhone || '+221 77 000 00 00'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 block">Votre Payout net :</span>
                    <span className="text-base font-black text-purple-700">{formatPrice(ord.sellerPayout)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.status === 'PAID_ESCROW_LOCKED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAcceptOrder(ord.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRefuseModal(ord.id)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold transition-all cursor-pointer"
                        >
                          Refuser
                        </button>
                      </>
                    )}

                    {ord.deliveryStatus !== 'DELIVERED' && ord.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => onMarkReadyForPickup(ord.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Colis remis au livreur</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
