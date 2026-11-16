/**
 * Onglet / Vue Vendeur : SellerOverviewTab
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerOverviewTab).
 */

import React from 'react';
import {
  Tag,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { SellerDashboard } from '../../services/sellerService';
import { Order, User } from '../../types';
import {
  SellerDashboardHeader,
  SellerSuspendedBanner,
  SellerActionItemsBanner,
  SellerFinanceSummaryCard,
  SellerMetricCard,
  SellerSalesChart,
  SellerTopAndStagnantListings,
} from './dashboard';

interface SellerOverviewTabProps {
  dashboard: SellerDashboard | null;
  orders: Order[];
  refreshing: boolean;
  onRefresh: () => void;
  onGoToOrders: () => void;
  onAcceptOrder: (orderId: number) => void;
  formatPrice: (amount?: number) => string;
  currentUser?: User | null;
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
}

export const SellerOverviewTab: React.FC<SellerOverviewTabProps> = ({
  dashboard,
  orders,
  refreshing,
  onRefresh,
  onGoToOrders,
  onAcceptOrder,
  formatPrice,
  currentUser = null,
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
}) => {
  const isSuspended = Boolean(dashboard?.isSuspended || currentUser?.isSuspended);

  return (
    <div className="space-y-6 text-xs">
      {/* 1. En-tête : Bonjour [Prénom], Vendeur depuis, Sélecteur de période, Bouton Actualiser */}
      <SellerDashboardHeader
        currentUser={currentUser}
        sellerFirstName={dashboard?.sellerFirstName}
        sellerSinceLabel={dashboard?.sellerSinceLabel}
        period={period}
        onPeriodChange={onPeriodChange}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={onCustomFromChange}
        onCustomToChange={onCustomToChange}
        onApplyCustomDates={onApplyCustomDates}
        refreshing={refreshing}
        onRefresh={onRefresh}
        lastUpdated={dashboard?.lastUpdated}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={onToggleAutoRefresh}
      />

      {/* 2. Alerte compte suspendu si actif */}
      <SellerSuspendedBanner isSuspended={isSuspended} />

      {/* 3. Bandeau « À faire » non tronqué et focalisé sur l'action */}
      <SellerActionItemsBanner
        actionItems={dashboard?.actionItems}
        onNavigateTab={onNavigateTab}
        disabled={isSuspended}
      />

      {/* 5. Synthèse Financière Vendeur (Bloc unifié et aéré : CA, Gains libérés, Séquestre) */}
      <SellerFinanceSummaryCard
        dashboard={dashboard}
        formatPrice={formatPrice}
        onNavigateTab={onNavigateTab}
        disabled={isSuspended}
      />

      {/* 6. Activité Opérationnelle Quotidienne (3 cartes essentielles au lieu de 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Mes annonces */}
        <SellerMetricCard
          title="Mes annonces"
          value={dashboard?.listings?.count ?? dashboard?.totalProducts ?? 0}
          changePercentage={dashboard?.listings?.changePercentage}
          subtitle={`${dashboard?.listings?.activeCount ?? dashboard?.activeProducts ?? 0} en vente`}
          badgeLabel={
            (dashboard?.listings?.soldCount ?? dashboard?.soldProducts ?? 0) > 0
              ? `${dashboard?.listings?.soldCount ?? dashboard?.soldProducts ?? 0} vendues`
              : undefined
          }
          icon={<Tag className="w-4 h-4 text-purple-700" />}
          iconBgColor="bg-purple-50 text-purple-700"
          onClick={() => onNavigateTab('listings')}
          disabled={isSuspended}
        />

        {/* Commandes */}
        <SellerMetricCard
          title="Commandes"
          value={dashboard?.orders?.count ?? dashboard?.ordersToProcess ?? 0}
          changePercentage={dashboard?.orders?.changePercentage}
          subtitle={`${dashboard?.ordersToProcess ?? 0} à traiter`}
          badgeLabel={
            (dashboard?.ordersInDelivery ?? 0) > 0
              ? `${dashboard?.ordersInDelivery} en cours`
              : undefined
          }
          icon={<ShoppingBag className="w-4 h-4 text-pink-600" />}
          iconBgColor="bg-pink-50 text-pink-600"
          onClick={() => onNavigateTab('orders')}
          disabled={isSuspended}
        />

        {/* Note vendeur & Réputation */}
        <SellerMetricCard
          title="Note & Réputation"
          value={
            dashboard?.rating?.hasReviews
              ? `★ ${dashboard.rating.displayRating}`
              : dashboard?.reviewCount
              ? `★ ${dashboard.averageRating?.toFixed(1)}`
              : "Pas encore d'avis"
          }
          subtitle={
            dashboard?.rating?.hasReviews
              ? `${dashboard.rating.totalReviews} avis vérifiés`
              : (dashboard?.reviewCount ?? 0) > 0
              ? `${dashboard?.reviewCount} avis vérifiés`
              : undefined
          }
          icon={<Star className="w-4 h-4 text-amber-500" />}
          iconBgColor="bg-amber-50 text-amber-600"
          onClick={() => onNavigateTab('reviews')}
          disabled={isSuspended}
        />
      </div>

      {/* 7. Activité & Performance des annonces côte à côte (compact, 1 écran) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <SellerSalesChart
            data={dashboard?.salesTrends}
            formatPrice={formatPrice}
          />
        </div>
        <div className="lg:col-span-5">
          <SellerTopAndStagnantListings
            topProducts={dashboard?.topProducts}
            stagnantProducts={dashboard?.stagnantProducts}
            formatPrice={formatPrice}
            onNavigateTab={onNavigateTab}
            disabled={isSuspended}
          />
        </div>
      </div>
    </div>
  );
};

export default SellerOverviewTab;
