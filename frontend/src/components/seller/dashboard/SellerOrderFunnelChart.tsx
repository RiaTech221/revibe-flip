/**
 * Composant Tableau de Bord Vendeur : SellerOrderFunnelChart
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerOrderFunnelChart).
 */

import React from 'react';

interface OrderFunnelStep {
  status: string;
  label: string;
  count: number;
  percentage?: number;
}

interface SellerOrderFunnelChartProps {
  funnel?: OrderFunnelStep[];
  onNavigateTab: (tab: string, filter?: string) => void;
  disabled?: boolean;
}

export const SellerOrderFunnelChart: React.FC<SellerOrderFunnelChartProps> = ({
  funnel = [],
  onNavigateTab,
  disabled = false,
}) => {
  const totalOrders = funnel.reduce((acc, f) => acc + (f.count || 0), 0);

  const getStepColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500';
      case 'DELIVERED':
        return 'bg-purple-600';
      case 'SHIPPED':
        return 'bg-indigo-500';
      case 'PAID_ESCROW_LOCKED':
        return 'bg-blue-500';
      case 'PENDING_PAYMENT':
        return 'bg-amber-400';
      case 'DISPUTED':
        return 'bg-rose-500';
      case 'CANCELLED':
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Entonnoir des commandes
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          {totalOrders} cmd
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {funnel.map((step) => {
          const color = getStepColor(step.status);
          const pct = totalOrders > 0 ? Math.round((step.count / totalOrders) * 100) : 0;

          return (
            <button
              key={step.status}
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders', step.status)}
              className="w-full text-left group cursor-pointer space-y-1 hover:opacity-85 transition-opacity min-h-[36px]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 group-hover:text-purple-700 transition-colors truncate max-w-[170px]">
                  {step.label}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {step.count} ({pct}%)
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SellerOrderFunnelChart;
