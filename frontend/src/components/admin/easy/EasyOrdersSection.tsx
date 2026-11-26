import React, { useState } from 'react';
import {
  Truck,
  Package,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Order } from '../../../types';

interface EasyOrdersSectionProps {
  orders: Order[];
  onOpenDeliveryModal: (order: Order) => void;
  formatPrice: (amount?: number | null) => string;
  formatDate: (dateStr?: string) => string;
}

export const EasyOrdersSection: React.FC<EasyOrdersSectionProps> = ({
  orders,
  onOpenDeliveryModal,
  formatPrice,
  formatDate,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'DISPUTED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((o) => {
    const delivStatus = o.delivery?.status || o.deliveryStatus;
    let matchesStatus = true;
    if (filter === 'PENDING') matchesStatus = delivStatus === 'PENDING';
    if (filter === 'IN_TRANSIT') {
      matchesStatus =
        delivStatus === 'IN_TRANSIT' || delivStatus === 'PICKED_UP' || delivStatus === 'OUT_FOR_DELIVERY';
    }
    if (filter === 'DELIVERED') matchesStatus = delivStatus === 'DELIVERED';
    if (filter === 'DISPUTED') matchesStatus = o.status === 'DISPUTED';

    const matchesSearch =
      search.trim() === '' ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
      (o.buyer?.fullName && o.buyer.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (o.buyer?.phone && o.buyer.phone.includes(search)) ||
      (o.productTitle && o.productTitle.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EN-TÊTE FACILE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>Suivi simple des commandes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Colis & Livraisons
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Suivez le parcours des vêtements vendus, de la boutique du vendeur jusqu'à la maison de l'acheteur.
            </p>
          </div>
        </div>

        {/* 2. RECHERCHE & FILTRES SIMPLES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par acheteur, n° commande, vêtement..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Toutes ({orders.length})
            </button>
            <button
              onClick={() => setFilter('IN_TRANSIT')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'IN_TRANSIT' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              En route 🚚
            </button>
            <button
              onClick={() => setFilter('DELIVERED')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'DELIVERED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Livrées ✅
            </button>
            <button
              onClick={() => setFilter('DISPUTED')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'DISPUTED' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Litiges ⚠️
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTE DES COMMANDES */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-150">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-800">Aucune commande trouvée</h4>
          <p className="text-xs text-gray-400 mt-1">
            Modifiez votre recherche ou sélectionnez un autre filtre.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const delivStatus = order.delivery?.status || order.deliveryStatus;
            const isDelivered = delivStatus === 'DELIVERED';
            const isInTransit =
              delivStatus === 'IN_TRANSIT' || delivStatus === 'PICKED_UP' || delivStatus === 'OUT_FOR_DELIVERY';
            const isDisputed = order.status === 'DISPUTED';

            let statusBadge = {
              text: 'En préparation par le vendeur',
              bg: 'bg-amber-100 text-amber-800 border-amber-200',
              icon: <Clock className="w-3.5 h-3.5" />,
            };

            if (isDisputed) {
              statusBadge = {
                text: 'Problème signalé / Litige',
                bg: 'bg-rose-100 text-rose-800 border-rose-200',
                icon: <AlertTriangle className="w-3.5 h-3.5" />,
              };
            } else if (isDelivered) {
              statusBadge = {
                text: 'Colis bien arrivé chez le client',
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                icon: <CheckCircle className="w-3.5 h-3.5" />,
              };
            } else if (isInTransit) {
              statusBadge = {
                text: 'En cours de route vers le client',
                bg: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: <Truck className="w-3.5 h-3.5" />,
              };
            }

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-200 transition-all"
              >
                {/* Gauche : Infos commande & vêtement */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-xl">
                      {order.orderNumber || `#${order.id}`}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${statusBadge.bg}`}
                    >
                      {statusBadge.icon}
                      <span>{statusBadge.text}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-black text-gray-900">
                    {order.productTitle || `Article N°${order.productId}`}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                    <div>
                      🛍️ Acheteur :{' '}
                      <strong className="text-gray-800">
                        {order.buyer?.fullName || 'Client'} ({order.buyer?.phone})
                      </strong>
                    </div>
                    <div>
                      👗 Vendeur :{' '}
                      <strong className="text-gray-800">
                        {order.seller?.fullName || 'Vendeur'} ({order.seller?.phone})
                      </strong>
                    </div>
                    {order.deliveryAddress && (
                      <div className="flex items-center gap-1 text-gray-500 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          Livraison à : <strong className="text-gray-700">{order.deliveryAddress}, {order.deliveryCity || 'Dakar'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Droite : Montant & Gros bouton de statut */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                  <div className="md:text-right">
                    <div className="text-lg font-black text-purple-700">
                      {formatPrice(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {order.deliveryMode === 'DIRECT_HANDOVER'
                        ? 'Remise en main propre (0 FCFA)'
                        : `Frais livraison : ${formatPrice(order.deliveryFee ?? 2000)}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDeliveryModal(order)}
                    className="h-10 px-4 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Mettre à jour l'étape</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
