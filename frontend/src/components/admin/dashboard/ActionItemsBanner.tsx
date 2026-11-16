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
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px]">
      {activeItems.map((it) => {
        const isDanger = it.color === 'rose';
        const isWarning = it.color === 'amber';

        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNavigateTab(it.tab, it.filter)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold transition-all cursor-pointer active:scale-95 ${
              isDanger
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
            }`}
          >
            {it.icon}
            <span>{it.count} {it.label.toLowerCase()}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ActionItemsBanner;
