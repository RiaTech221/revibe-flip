/**
 * Composant Tableau de Bord Admin : RecentListsSection
 * 
 * Affiche et gère les indicateurs et visualisations pour les administrateurs ReVibe FliP (RecentListsSection).
 */

import React from 'react';
import { ShoppingBag, AlertCircle, History, ArrowRight } from 'lucide-react';
import {
  RecentOrderSummary,
  RecentReportSummary,
  RecentAuditLogSummary,
} from '../../../types';

interface RecentListsSectionProps {
  orders?: RecentOrderSummary[];
  reports?: RecentReportSummary[];
  auditLogs?: RecentAuditLogSummary[];
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string) => void;
}

export const RecentListsSection: React.FC<RecentListsSectionProps> = ({
  orders = [],
  reports = [],
  auditLogs = [],
  formatPrice,
  onNavigateTab,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Dernières commandes */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-purple-700" />
              <span>Dernières commandes</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center font-medium">
                Aucune commande récente
              </p>
            ) : (
              orders.slice(0, 5).map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{o.productTitle}</p>
                    <p className="text-[11px] text-slate-400">
                      #{o.orderNumber} • {o.buyerName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatPrice(o.totalAmount)}</p>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Derniers signalements */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Derniers signalements</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center font-medium">
                Aucun signalement en cours
              </p>
            ) : (
              reports.slice(0, 5).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{r.reason}</p>
                    <p className="text-[11px] text-slate-400">
                      Par {r.reporterName} • {r.targetType}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Journal d'audit */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Journal d'audit</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center font-medium">
                Aucune action enregistrée
              </p>
            ) : (
              auditLogs.slice(0, 5).map((l) => (
                <div key={l.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{l.details}</p>
                    <p className="text-[11px] text-slate-400">
                      {l.adminName} • {l.actionType}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-150 shrink-0">
                    {l.targetType}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentListsSection;
