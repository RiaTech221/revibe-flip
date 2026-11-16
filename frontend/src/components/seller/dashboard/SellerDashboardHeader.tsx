/**
 * Composant Tableau de Bord Vendeur : SellerDashboardHeader
 * 
 * Module d'affichage de performance financière, KPIs ou actions vendeur (SellerDashboardHeader).
 */

import React from 'react';
import { Calendar } from 'lucide-react';
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
    { id: '7d', label: '7 derniers jours' },
    { id: '30d', label: '30 derniers jours' },
    { id: '90d', label: '90 derniers jours' },
    { id: 'month', label: 'Ce mois' },
    { id: 'custom', label: 'Personnalisé' },
  ];

  return (
    <div className="space-y-2">
      {/* Ligne unique : Titre à gauche, Sélecteur de période compact à droite */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Bonjour, <span className="font-semibold text-purple-700">{firstName}</span>
          </p>
        </div>

        <div className="relative inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            aria-label="Période du tableau de bord"
            className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-purple-300 focus:outline-none focus:border-purple-600 cursor-pointer shadow-2xs"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates personnalisées si mode custom */}
      {period === 'custom' && (
        <div className="flex items-center justify-end gap-2 flex-wrap text-xs">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-purple-600 min-h-[40px]"
          />
          <span className="text-slate-400">à</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-purple-600 min-h-[40px]"
          />
          <button
            type="button"
            onClick={onApplyCustomDates}
            className="px-3 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 cursor-pointer min-h-[40px]"
          >
            Appliquer
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardHeader;
