/**
 * Composant Tableau de Bord Vendeur : SellerActionItemsBanner
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerActionItemsBanner).
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  MessageSquare,
  AlertTriangle,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { SellerActionItems } from '../../../services/sellerService';

interface SellerActionItemsBannerProps {
  actionItems?: SellerActionItems;
  onNavigateTab: (tab: string, filter?: string) => void;
  disabled?: boolean;
}

export const SellerActionItemsBanner: React.FC<SellerActionItemsBannerProps> = ({
  actionItems,
  onNavigateTab,
  disabled = false,
}) => {
  const [showDisabledDetails, setShowDisabledDetails] = useState(false);

  const hasItems = !!actionItems && actionItems.hasItemsToHandle;

  if (!hasItems) {
    return null;
  }

  const allItems = [
    {
      id: 'ordersToPrepare',
      label: actionItems.ordersToPrepare > 1 ? `${actionItems.ordersToPrepare} à préparer` : '1 à préparer',
      count: actionItems.ordersToPrepare,
      isDanger: false,
      tab: 'orders',
      filter: 'PAID_ESCROW_LOCKED',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      id: 'pendingOffers',
      label: actionItems.pendingOffers > 1 ? `${actionItems.pendingOffers} offres reçues` : '1 offre reçue',
      count: actionItems.pendingOffers,
      isDanger: false,
      tab: 'orders',
      filter: 'offers',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      id: 'unreadConversations',
      label: actionItems.unreadConversations > 1 ? `${actionItems.unreadConversations} messages` : '1 message',
      count: actionItems.unreadConversations,
      isDanger: false,
      tab: 'messages',
      filter: undefined,
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    {
      id: 'disputedOrders',
      label: actionItems.disputedOrders > 1 ? `${actionItems.disputedOrders} litiges` : '1 litige',
      count: actionItems.disputedOrders,
      isDanger: true,
      tab: 'orders',
      filter: 'DISPUTED',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      id: 'disabledListings',
      label: actionItems.disabledListings > 1 ? `${actionItems.disabledListings} désactivées` : '1 désactivée',
      count: actionItems.disabledListings,
      isWarning: true,
      tab: 'listings',
      filter: 'INACTIVE',
      icon: <Tag className="w-3.5 h-3.5" />,
      hasDetails: (actionItems.disabledListingsDetails?.length || 0) > 0,
    },
  ];

  const activeItems = allItems.filter((it) => it.count > 0);

  return (
    <div className="space-y-1.5">
      {/* PILULES COMPACTES ALIGNÉES À DROITE */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px]">
        {activeItems.map((it) => (
          <button
            key={it.id}
            type="button"
            disabled={disabled}
            onClick={() => onNavigateTab(it.tab, it.filter)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold transition-all cursor-pointer active:scale-95 ${
              disabled
                ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                : it.isDanger
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : it.isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <span className="opacity-80">{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}

        {/* LIEN DISCRET MOTIFS DÉSACTIVATION */}
        {actionItems.disabledListings > 0 && (
          <button
            type="button"
            onClick={() => setShowDisabledDetails(!showDisabledDetails)}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 px-2 py-1 rounded-full hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <span>{showDisabledDetails ? 'Masquer motif' : 'Motif'}</span>
            {showDisabledDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* DÉTAIL DÉROULANT DES ANNONCES DÉSACTIVÉES */}
      {showDisabledDetails && actionItems.disabledListingsDetails && actionItems.disabledListingsDetails.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-1.5 text-xs animate-fade-in">
          <p className="font-semibold text-amber-900 text-[11px]">
            Motif communiqué par l'équipe de modération :
          </p>
          <div className="space-y-1">
            {actionItems.disabledListingsDetails.map((dl) => (
              <div
                key={dl.id}
                onClick={() => onNavigateTab('listings', 'INACTIVE')}
                className="bg-white/90 p-2 rounded-lg border border-amber-200/60 flex items-center justify-between gap-3 cursor-pointer hover:bg-white"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">
                    #{dl.id} - {dl.title}
                  </span>
                  <span className="text-[11px] text-amber-900 block">
                    {dl.deactivationReason || 'Annonce nécessitant une vérification de conformité.'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-700 shrink-0 inline-flex items-center gap-1">
                  Modifier <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerActionItemsBanner;
