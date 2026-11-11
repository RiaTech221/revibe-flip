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
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Rien à traiter 🎉</span>
          <span className="text-emerald-700/80 hidden sm:inline">• Tout est à jour</span>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span>À traiter ({actionItems.totalToHandle})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((it) => {
          const isDanger = it.color === 'rose' && it.count > 0;
          const isWarning = it.color === 'amber' && it.count > 0;

          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onNavigateTab(it.tab, it.filter)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                isDanger
                  ? 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70 text-rose-950'
                  : isWarning
                  ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 text-amber-950'
                  : 'bg-white border-slate-200/70 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`p-1 rounded-lg shrink-0 ${
                    isDanger
                      ? 'bg-rose-100 text-rose-600'
                      : isWarning
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {it.icon}
                </span>
                <span className="text-xs font-semibold truncate">{it.label}</span>
              </div>
              <span
                className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ml-1.5 ${
                  it.count > 0
                    ? isDanger
                      ? 'bg-rose-600 text-white'
                      : isWarning
                      ? 'bg-amber-500 text-white'
                      : 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-400'
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
