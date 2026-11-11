import React from 'react';
import { ShoppingBag, Clock, Star, Bell, ArrowRight, Check } from 'lucide-react';
import { Order, Review } from '../../../types';

interface SellerQuickListsProps {
  ordersToPrepare?: Order[];
  activeOffers?: any[];
  recentReviews?: Review[];
  recentNotifications?: any[];
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string, filter?: string) => void;
  onQuickShip?: (orderId: number) => void;
  disabled?: boolean;
}

export const SellerQuickLists: React.FC<SellerQuickListsProps> = ({
  ordersToPrepare = [],
  activeOffers = [],
  recentReviews = [],
  recentNotifications = [],
  formatPrice,
  onNavigateTab,
  onQuickShip,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Commandes à préparer */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-700" />
              <span>Commandes à préparer</span>
            </h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders', 'PAID_ESCROW_LOCKED')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {ordersToPrepare.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">Aucune commande à préparer</p>
            ) : (
              ordersToPrepare.slice(0, 5).map((o) => (
                <div key={o.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {o.productTitle || (o as any).product?.title || `Commande #${o.orderNumber}`}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      #{o.orderNumber} • {formatPrice(o.itemPrice || o.totalAmount)}
                    </p>
                  </div>
                  {onQuickShip && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onQuickShip(o.id)}
                      className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
                      title="Prête à expédier"
                    >
                      Prête
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Offres en cours */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-700" />
              <span>Offres en cours</span>
            </h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders', 'offers')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeOffers.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">Aucune offre en cours</p>
            ) : (
              activeOffers.slice(0, 5).map((off) => (
                <div key={off.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {off.productTitle || off.product?.title || 'Offre'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Par {off.buyerName || off.buyer?.fullName || 'Acheteur'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-purple-700">{formatPrice(off.agreedPrice)}</p>
                    <span className="text-[10px] text-amber-600 font-semibold block">
                      {off.remainingTimeLabel || 'En attente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Derniers avis */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Derniers avis</span>
            </h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('reviews')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentReviews.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">Aucun avis récent</p>
            ) : (
              recentReviews.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2 space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate">
                      {r.reviewerName || 'Acheteur vérifié'}
                    </span>
                    <span className="font-bold text-amber-500 text-[11px]">
                      ★ {r.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {r.comment || 'Avis 5 étoiles sans commentaire.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Dernières notifications */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>Notifications</span>
            </h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentNotifications.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">Aucune notification</p>
            ) : (
              recentNotifications.slice(0, 5).map((n) => (
                <div key={n.id} className="py-2 space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerQuickLists;
