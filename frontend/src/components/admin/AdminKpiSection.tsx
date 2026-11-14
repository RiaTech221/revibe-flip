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
  Clock,
  ShoppingBag,
  Users,
  Tag,
  AlertCircle,
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
  UserRegistrationChart,
  RecentListsSection,
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
  const soldProductsCount = dashboard.products?.sold ?? dashboard.soldProducts ?? 0;

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

      {/* 4. Cartes principales épurées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Chiffre d'affaires */}
        <MetricCard
          title="Chiffre d'affaires"
          value={formatPrice(dashboard.revenue?.value ?? dashboard.totalTransactionsAmount ?? 0)}
          changePercentage={dashboard.revenue?.changePercentage}
          sparkline={dashboard.revenue?.sparkline}
          icon={<DollarSign className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          onClick={() => onNavigateTab('orders')}
        />

        {/* Commissions réalisées */}
        <MetricCard
          title={`Commissions (${commRate}%)`}
          value={formatPrice(dashboard.earnedCommissions?.value ?? dashboard.totalCommissions ?? 0)}
          changePercentage={dashboard.earnedCommissions?.changePercentage}
          icon={<CreditCard className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          onClick={() => onNavigateTab('orders', 'COMPLETED')}
        />

        {/* Fonds conservés */}
        <MetricCard
          title="Fonds conservés"
          value={formatPrice(dashboard.escrowLockedFunds?.value ?? 0)}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          tooltipText="Montant payé par les acheteurs et conservé par ReVibe FliP jusqu’à la confirmation de réception."
          onClick={() => onNavigateTab('payments', 'LOCKED')}
        />

        {/* Commissions en attente */}
        <MetricCard
          title="Commissions en attente"
          value={formatPrice(dashboard.pendingCommissions?.value ?? 0)}
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => onNavigateTab('orders', 'PAID_ESCROW_LOCKED')}
        />

        {/* Frais de validation */}
        <MetricCard
          title={`Frais de validation (${valFeeRate}%)`}
          value={formatPrice(dashboard.validationFees?.value ?? dashboard.totalValidationFees ?? 0)}
          changePercentage={dashboard.validationFees?.changePercentage}
          icon={<ShieldCheck className="w-4 h-4 text-indigo-600" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
          onClick={() => onNavigateTab('payments')}
        />

        {/* Commandes & Panier moyen */}
        <MetricCard
          title="Commandes"
          value={dashboard.orders?.value ?? dashboard.totalOrders ?? 0}
          changePercentage={dashboard.orders?.changePercentage}
          sparkline={dashboard.orders?.sparkline}
          icon={<ShoppingBag className="w-4 h-4 text-pink-600" />}
          iconBgColor="bg-pink-50 text-pink-600"
          subtitle={`Panier : ${formatPrice(dashboard.averageBasket?.value ?? 0)}`}
          onClick={() => onNavigateTab('orders')}
        />

        {/* Utilisateurs */}
        <MetricCard
          title="Utilisateurs"
          value={dashboard.users?.total ?? dashboard.totalUsers ?? 0}
          changePercentage={dashboard.users?.changePercentage}
          sparkline={dashboard.users?.sparkline}
          icon={<Users className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          subtitle={`${activeUsersCount} actifs`}
          badgeLabel={suspendedUsersCount > 0 ? `${suspendedUsersCount} susp.` : undefined}
          badgeAction={() => onNavigateTab('users', 'SUSPENDED')}
          onClick={() => onNavigateTab('users')}
        />

        {/* Annonces */}
        <MetricCard
          title="Annonces"
          value={dashboard.products?.total ?? dashboard.totalProducts ?? 0}
          changePercentage={dashboard.products?.changePercentage}
          sparkline={dashboard.products?.sparkline}
          icon={<Tag className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50 text-amber-600"
          subtitle={`${activeProductsCount} actives`}
          badgeLabel={soldProductsCount > 0 ? `${soldProductsCount} vendues` : undefined}
          badgeAction={() => onNavigateTab('products', 'SOLD')}
          onClick={() => onNavigateTab('products')}
        />
      </div>

      {/* 5. Tendance des ventes (2/3) & Top 5 des rayons (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesTrendChart
            data={dashboard.salesTrends}
            formatPrice={formatPrice}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryTopChart
            categoriesBySales={dashboard.topCategoriesBySales || dashboard.topCategories}
            categoriesByProducts={dashboard.topCategoriesByProducts || dashboard.topCategories}
            categories={dashboard.topCategories}
            formatPrice={formatPrice}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>

      {/* 6. Répartition des paiements & Entonnoir des commandes côte à côte (1/2 et 1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PaymentDistributionChart
          distributions={dashboard.paymentDistributions}
          formatPrice={formatPrice}
          onNavigateTab={onNavigateTab}
        />
        <OrderFunnelChart
          funnel={dashboard.orderFunnel}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* 7. Nouveaux inscrits par jour */}
      <div className="w-full">
        <UserRegistrationChart
          data={dashboard.userRegistrationTrends}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* 8. Listes courtes (5 dernières commandes, signalements, logs d'audit) */}
      <RecentListsSection
        orders={dashboard.recentOrders}
        reports={dashboard.recentReports}
        auditLogs={dashboard.recentAuditLogs}
        formatPrice={formatPrice}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};

export default AdminKpiSection;
