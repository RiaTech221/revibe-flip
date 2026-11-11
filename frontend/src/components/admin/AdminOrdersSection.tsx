import React from 'react';
import { Truck, Search } from 'lucide-react';
import { Order, DeliveryStatus } from '../../types';

interface AdminOrdersSectionProps {
  orders: Order[];
  orderStatusFilter: string;
  setOrderStatusFilter: (status: string) => void;
  orderSearch: string;
  setOrderSearch: (query: string) => void;
  orderPage: number;
  orderTotalPages: number;
  orderTotalElements: number;
  setOrderPage: (page: number) => void;
  onOpenDeliveryModal: (order: Order) => void;
  formatPrice: (price?: number | null) => string;
  renderPagination: (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

export const AdminOrdersSection: React.FC<AdminOrdersSectionProps> = ({
  orders,
  orderStatusFilter,
  setOrderStatusFilter,
  orderSearch,
  setOrderSearch,
  orderPage,
  orderTotalPages,
  orderTotalElements,
  setOrderPage,
  onOpenDeliveryModal,
  formatPrice,
  renderPagination,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Commandes & Suivi</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setOrderPage(0);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">Tous les statuts de commande</option>
              <option value="PENDING_PAYMENT">En attente de paiement</option>
              <option value="PAID_ESCROW_LOCKED">Payée (Séquestrée)</option>
              <option value="SHIPPED">Expédiée</option>
              <option value="DELIVERED">Livrée</option>
              <option value="COMPLETED">Finalisée (Fonds libérés)</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => {
              setOrderSearch(e.target.value);
              setOrderPage(0);
            }}
            placeholder="Rechercher par numéro RF-2026-..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
          />
        </div>

        {/* Table des commandes */}
        <div className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Aucune commande enregistrée.
            </div>
          ) : (
            orders.map((o) => {
              const currentDeliveryStatus = (o.delivery?.status ||
                (o as any).deliveryStatus ||
                'PENDING') as DeliveryStatus;

              return (
                <div
                  key={o.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 font-black text-xs flex flex-col items-center justify-center shrink-0 border border-purple-100">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-gray-900">{o.orderNumber}</h4>
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        Acheteur : <strong>{o.buyer?.fullName}</strong> ({o.buyer?.phone}) • Vendeur :{' '}
                        <strong>{o.seller?.fullName}</strong>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        Produit : {o.productTitle} • Prix convenu :{' '}
                        <strong className="text-purple-700">
                          {formatPrice(o.agreedPrice || o.itemPrice)}
                        </strong>
                        {o.originalPrice && o.agreedPrice && o.originalPrice !== o.agreedPrice && (
                          <span className="text-gray-400 line-through ml-1.5 font-normal">
                            ({formatPrice(o.originalPrice)})
                          </span>
                        )}{' '}
                        • Étape livraison :{' '}
                        <strong className="text-purple-700">{currentDeliveryStatus}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold justify-between sm:justify-end shrink-0">
                    <div className="text-right">
                      <span className="text-purple-700 block font-black">{formatPrice(o.totalAmount)}</span>
                      <span className="text-[10px] text-gray-400 block font-normal">
                        Com. : {formatPrice(o.platformCommission)} | Frais 1% : {formatPrice(o.validationFee)}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenDeliveryModal(o)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs cursor-pointer"
                    >
                      Mettre à jour livraison
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {renderPagination(orderPage, orderTotalPages, orderTotalElements, setOrderPage)}
        </div>
      </div>
    </div>
  );
};
