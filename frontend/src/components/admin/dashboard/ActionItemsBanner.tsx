/**
 * Composant Tableau de Bord Admin : ActionItemsBanner
 * 
 * Affiche et gère les indicateurs et visualisations pour les administrateurs ReVibe FliP (ActionItemsBanner).
 */

import React from 'react';
import {
  AlertCircle,
  Tag,
  ShoppingBag,
  Truck,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { ActionItems } from '../../../types';

interface ActionItemsBannerProps {
  actionItems?: ActionItems;
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const ActionItemsBanner: React.FC<ActionItemsBannerProps> = ({
  actionItems,
  onNavigateTab,
}) => {
  const hasItems = !!actionItems && actionItems.hasItemsToHandle;

  if (!hasItems) {
    return null;
  }

  const items = [
    {
      id: 'reports',
      label: 'Signalements',
      count: actionItems.pendingReportsAndDisputes,
      color: 'rose',
      tab: 'reports',
      filter: 'PENDING',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    {
      id: 'moderation',
      label: 'Annonces à modérer',
      count: actionItems.pendingModerationProducts,
      color: 'amber',
      tab: 'products',
      filter: 'DRAFT',
      icon: <Tag className="w-3.5 h-3.5" />,
    },
    {
      id: 'disputedOrders',
      label: 'Litiges',
      count: actionItems.disputedOrders,
      color: 'rose',
      tab: 'orders',
      filter: 'DISPUTED',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      id: 'deliveredAwaitingConfirmation',
      label: 'Livrées à confirmer',
      count: actionItems.deliveredAwaitingConfirmationOrders,
      color: 'purple',
      tab: 'orders',
      filter: 'DELIVERED',
      icon: <Truck className="w-3.5 h-3.5" />,
    },
    {
      id: 'contactMessages',
      label: 'Messages',
      count: actionItems.unreadContactMessages,
      color: 'slate',
      tab: 'cms',
      filter: 'contact',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
  ];

  const activeItems = items.filter((it) => it.count > 0);
  if (activeItems.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs shadow-2xs">
      <div className="flex items-center gap-2 text-slate-700 font-semibold shrink-0 mr-1">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span>À traiter :</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {activeItems.map((it) => {
          const isDanger = it.color === 'rose';
          const isWarning = it.color === 'amber';

          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onNavigateTab(it.tab, it.filter)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                isDanger
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : isWarning
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              {it.icon}
              <span>{it.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isDanger
                    ? 'bg-rose-600 text-white'
                    : isWarning
                    ? 'bg-amber-500 text-white'
                    : 'bg-purple-700 text-white'
                }`}
              >
                {it.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionItemsBanner;
