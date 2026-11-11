/**
 * Composant Tableau de Bord Vendeur : SellerDashboardHeader
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerDashboardHeader).
 */

import React from 'react';
import { RefreshCw, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { User } from '../../../types';

interface SellerDashboardHeaderProps {
  currentUser: User | null;
  sellerFirstName?: string;
  sellerSinceLabel?: string;
  period: string;
  onPeriodChange: (newPeriod: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (val: string) => void;
  onCustomToChange: (val: string) => void;
  onApplyCustomDates: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const SellerDashboardHeader: React.FC<SellerDashboardHeaderProps> = ({
  currentUser,
  sellerFirstName,
  sellerSinceLabel,
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustomDates,
  refreshing,
  onRefresh,
  lastUpdated,
  autoRefresh,
  onToggleAutoRefresh,
}) => {
  const firstName =
    sellerFirstName ||
    currentUser?.firstName ||
    currentUser?.fullName?.split(' ')[0] ||
    'Vendeur';

  const periods = [
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: '90d', label: '90 jours' },
    { id: 'month', label: 'Ce mois' },
    { id: 'custom', label: 'Personnalisé' },
  ];

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="space-y-3">
      {/* Ligne supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Bonjour, <span className="font-semibold text-purple-700">{firstName}</span>
            {sellerSinceLabel && (
              <span className="text-slate-400 ml-2">• {sellerSinceLabel}</span>
            )}
            {formattedTime && (
              <span className="text-slate-400 ml-2">• Mis à jour à {formattedTime}</span>
            )}
          </p>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer min-h-[44px] flex items-center ${
              autoRefresh
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Auto {autoRefresh ? '2 min' : 'off'}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs min-h-[44px]"
            title="Actualiser"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de période épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50 flex-wrap">
          {periods.map((p) => {
            const isActive = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                  isActive
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Dates personnalisées si mode custom */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-purple-600 min-h-[44px]"
            />
            <span className="text-slate-400">à</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-purple-600 min-h-[44px]"
            />
            <button
              type="button"
              onClick={onApplyCustomDates}
              className="px-3 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 cursor-pointer min-h-[44px]"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboardHeader;
