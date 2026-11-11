import React from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  Percent,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { SellerDashboard } from '../../../services/sellerService';

interface SellerFinanceSummaryCardProps {
  dashboard: SellerDashboard | null;
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string, filter?: string) => void;
  disabled?: boolean;
}

export const SellerFinanceSummaryCard: React.FC<SellerFinanceSummaryCardProps> = ({
  dashboard,
  formatPrice,
  onNavigateTab,
  disabled = false,
}) => {
  const turnover = dashboard?.turnover?.value ?? (dashboard as any)?.turnover ?? 0;
  const turnoverChange = dashboard?.turnover?.changePercentage;

  const releasedEarnings =
    dashboard?.releasedEarnings?.value ?? dashboard?.netEarnings ?? 0;
  const releasedChange = dashboard?.releasedEarnings?.changePercentage;

  const pendingEscrow =
    dashboard?.pendingEscrow?.value ?? (dashboard as any)?.pendingEscrow ?? 0;
  const pendingChange = dashboard?.pendingEscrow?.changePercentage;

  const commission =
    dashboard?.platformCommission?.value ?? (dashboard as any)?.commissionTotal ?? 0;
  const averageBasket = dashboard?.averageBasket?.value ?? 0;
  const acceptanceRate = dashboard?.offerAcceptanceRate?.value ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
      {/* SECTION PRINCIPALE DES FINANCES (3 COLONNES AÉRÉES) */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* 1. Chiffre d'affaires (Col 4) */}
        <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Chiffre d'affaires
              </span>
              <span className="p-1 rounded-lg bg-purple-50 text-purple-700">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatPrice(turnover)}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {typeof turnoverChange === 'number' && turnoverChange !== 0 ? (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  turnoverChange > 0
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50'
                }`}
              >
                {turnoverChange > 0 ? `+${turnoverChange}%` : `${turnoverChange}%`} vs période préc.
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Total des ventes réglées</span>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-0.5 cursor-pointer"
            >
              Détails <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Gains disponibles / libérés (Col 4) */}
        <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:px-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Gains disponibles
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Prêt au virement
                </span>
              </div>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {formatPrice(releasedEarnings)}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Commandes terminées
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('finances')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Gérer retraits →
            </button>
          </div>
        </div>

        {/* 3. Gains sous séquestre (Col 4) */}
        <div className="md:col-span-4 flex flex-col justify-between md:pl-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  En attente (Séquestre)
                </span>
                <span
                  title="Fonds payés par l'acheteur et sécurisés sous séquestre. Ils sont automatiquement libérés dès la confirmation de livraison."
                  className="cursor-help text-slate-400 hover:text-purple-700"
                >
                  <HelpCircle className="w-3 h-3" />
                </span>
              </div>
              <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
              {formatPrice(pendingEscrow)}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Débloqué dès livraison confirmée
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNavigateTab('orders', 'PAID_ESCROW_LOCKED')}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Voir commandes →
            </button>
          </div>
        </div>
      </div>

      {/* SOUS-BANDEAU DISCRET DES STATISTIQUES SECONDAIRES */}
      <div className="bg-slate-50/80 border-t border-slate-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-500">Panier moyen :</span>
            <span className="font-bold text-slate-800">{formatPrice(averageBasket)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500">Taux d'acceptation offres :</span>
            <span className="font-bold text-slate-800">{acceptanceRate}%</span>
          </div>

          {commission > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Commission plateforme :</span>
              <span className="font-semibold text-slate-700">-{formatPrice(commission)}</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Taux commission : <strong className="text-slate-600">{dashboard?.commissionRate ?? 20}%</strong>
        </div>
      </div>
    </div>
  );
};

export default SellerFinanceSummaryCard;
