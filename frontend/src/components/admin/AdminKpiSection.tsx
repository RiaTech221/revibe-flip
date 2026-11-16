/**
 * Section de Gestion Admin : AdminKpiSection
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminKpiSection).
 */

import React from 'react';
import {
  DollarSign,
  CreditCard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminDashboard, User } from '../../types';
import {
  DashboardHeader,
  DashboardSkeleton,
  DashboardError,
  ActionItemsBanner,
  MetricCard,
  SalesTrendChart,
  CategoryTopChart,
  PaymentDistributionChart,
  OrderFunnelChart,
} from './dashboard';

interface AdminKpiSectionProps {
  dashboard: AdminDashboard | null;
  currentUser: User | null;
  refreshing: boolean;
  error?: string | null;
  onRefresh: () => void;
  period: string;
  onPeriodChange: (newPeriod: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (val: string) => void;
  onCustomToChange: (val: string) => void;
  onApplyCustomDates: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onNavigateTab: (tab: string, filter?: string) => void;
  formatPrice: (price?: number | null) => string;
}

export const AdminKpiSection: React.FC<AdminKpiSectionProps> = ({
  dashboard,
  currentUser,
  refreshing,
  error,
  onRefresh,
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustomDates,
  autoRefresh,
  onToggleAutoRefresh,
  onNavigateTab,
  formatPrice,
}) => {
  if (error && !dashboard) {
    return <DashboardError message={error} onRetry={onRefresh} />;
  }

  if (refreshing && !dashboard) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return null;
  }

  // Formatting helpers
  const commRate = dashboard.commissionRate || 20;
  const valFeeRate = dashboard.validationFeeRate || 1;

  // Active / suspended users
  const activeUsersCount = dashboard.users?.active ?? dashboard.activeUsers ?? 0;
  const suspendedUsersCount = dashboard.users?.suspended ?? dashboard.inactiveUsers ?? 0;

  // Active / sold products
  const activeProductsCount = dashboard.products?.active ?? dashboard.activeProducts ?? 0;

  return (
    <div className="space-y-5 text-xs">
      {/* 1. En-tête */}
      <DashboardHeader
        currentUser={currentUser}
        period={period}
        onPeriodChange={onPeriodChange}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={onCustomFromChange}
        onCustomToChange={onCustomToChange}
        onApplyCustomDates={onApplyCustomDates}
        refreshing={refreshing}
        onRefresh={onRefresh}
        lastUpdated={dashboard.lastUpdated}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={onToggleAutoRefresh}
      />

      {/* 2. Bandeau « À traiter » en haut */}
      <ActionItemsBanner
        actionItems={dashboard.actionItems}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Indicateurs Plateforme Admin (4 cartes ciblées sans redondance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Volume d'affaires global */}
        <MetricCard
          title="Volume d'affaires"
          value={formatPrice(dashboard.revenue?.value ?? dashboard.totalTransactionsAmount ?? 0)}
          changePercentage={dashboard.revenue?.changePercentage}
          sparkline={dashboard.revenue?.sparkline}
          icon={<DollarSign className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          subtitle={`${dashboard.orders?.value ?? dashboard.totalOrders ?? 0} commandes`}
          onClick={() => onNavigateTab('orders')}
        />

        {/* Revenus plateforme (Commissions + Validation) */}
        <MetricCard
          title={`Commissions (${commRate}%)`}
          value={formatPrice(dashboard.earnedCommissions?.value ?? dashboard.totalCommissions ?? 0)}
          changePercentage={dashboard.earnedCommissions?.changePercentage}
          icon={<CreditCard className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          subtitle={`Validation (${valFeeRate}%) : ${formatPrice(dashboard.validationFees?.value ?? dashboard.totalValidationFees ?? 0)}`}
          onClick={() => onNavigateTab('orders', 'COMPLETED')}
        />

        {/* Séquestre & Trésorerie */}
        <MetricCard
          title="Fonds sous séquestre"
          value={formatPrice(dashboard.escrowLockedFunds?.value ?? 0)}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          tooltipText="Montant payé par les acheteurs et conservé par ReVibe FliP jusqu’à la confirmation de réception."
          subtitle={`En attente : ${formatPrice(dashboard.pendingCommissions?.value ?? 0)}`}
          onClick={() => onNavigateTab('payments', 'LOCKED')}
        />

        {/* Communauté & Catalogue */}
        <MetricCard
          title="Utilisateurs & Annonces"
          value={dashboard.users?.total ?? dashboard.totalUsers ?? 0}
          changePercentage={dashboard.users?.changePercentage}
          icon={<Users className="w-4 h-4 text-indigo-600" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
          subtitle={`${activeUsersCount} actifs • ${activeProductsCount} annonces`}
          badgeLabel={suspendedUsersCount > 0 ? `${suspendedUsersCount} susp.` : undefined}
          badgeAction={() => onNavigateTab('users', 'SUSPENDED')}
          onClick={() => onNavigateTab('users')}
        />
      </div>

      {/* 5. Pilotage global : Tendance (2/3) & Moyens de paiement (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesTrendChart
            data={dashboard.salesTrends}
            formatPrice={formatPrice}
          />
        </div>
        <div className="lg:col-span-1">
          <PaymentDistributionChart
            distributions={dashboard.paymentDistributions}
            formatPrice={formatPrice}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>

      {/* 6. Entonnoir des commandes & Top Rayons (1/2 et 1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OrderFunnelChart
          funnel={dashboard.orderFunnel}
          onNavigateTab={onNavigateTab}
        />
        <CategoryTopChart
          categoriesBySales={dashboard.topCategoriesBySales || dashboard.topCategories}
          categoriesByProducts={dashboard.topCategoriesByProducts || dashboard.topCategories}
          categories={dashboard.topCategories}
          formatPrice={formatPrice}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </div>
  );
};

export default AdminKpiSection;
