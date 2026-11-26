import React from 'react';
import {
  DollarSign,
  ShieldCheck,
  ShoppingBag,
  Users,
  AlertTriangle,
  CheckCircle,
  Truck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { AdminDashboard, Order } from '../../../types';

interface EasyOverviewSectionProps {
  dashboard: AdminDashboard | null;
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  formatPrice: (amount?: number | null) => string;
  formatDate: (dateStr?: string) => string;
}

export const EasyOverviewSection: React.FC<EasyOverviewSectionProps> = ({
  dashboard,
  orders,
  onNavigateTab,
  formatPrice,
  formatDate,
}) => {
  const pendingModeration = dashboard?.actionItems?.pendingModerationProducts || 0;
  const pendingReports = dashboard?.actionItems?.pendingReportsAndDisputes || 0;
  const disputedOrders = dashboard?.actionItems?.disputedOrders || 0;
  const deliveredAwaiting = dashboard?.actionItems?.deliveredAwaitingConfirmationOrders || 0;

  const totalUrgent = pendingModeration + pendingReports + disputedOrders + deliveredAwaiting;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. CARTE DE BIENVENUE & AIDE */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tableau de Bord Facile &bull; Mode Simplifié</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Gérez votre boutique en toute sérénité
          </h2>
          <p className="mt-2 text-sm sm:text-base text-purple-100 font-medium leading-relaxed">
            Ici, pas de chiffres compliqués. Retrouvez vos ventes, les articles à vérifier, et l'argent en sécurité en un coup d'œil.
          </p>
        </div>
      </div>

      {/* 2. ACTIONS PRIORITAIRES (À FAIRE AUJOURD'HUI) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${totalUrgent > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              👉 Ce que vous devez faire aujourd'hui
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
            {totalUrgent > 0 ? `${totalUrgent} action(s) requise(s)` : 'Tout est à jour ! 🎉'}
          </span>
        </div>

        {totalUrgent === 0 ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Bravo ! Aucune annonce en attente et aucun litige client. Tout fonctionne parfaitement.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {pendingModeration > 0 && (
              <div
                onClick={() => onNavigateTab('products')}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100/70 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-2xl font-black text-amber-700">{pendingModeration}</div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">Annonce(s) à vérifier</div>
                  <div className="text-[11px] text-gray-500">Avant mise en ligne sur le site</div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {(pendingReports > 0 || disputedOrders > 0) && (
              <div
                onClick={() => onNavigateTab('reports')}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100/70 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-2xl font-black text-rose-700">
                    {pendingReports + disputedOrders}
                  </div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">Problème(s) / Litige(s)</div>
                  <div className="text-[11px] text-gray-500">Clients ayant signalé un souci</div>
                </div>
                <ArrowRight className="w-5 h-5 text-rose-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {deliveredAwaiting > 0 && (
              <div
                onClick={() => onNavigateTab('orders')}
                className="p-4 rounded-2xl bg-purple-50 border border-purple-200 hover:bg-purple-100/70 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-2xl font-black text-purple-700">{deliveredAwaiting}</div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">Colis livré(s)</div>
                  <div className="text-[11px] text-gray-500">Prêts pour payer le vendeur</div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. LES 4 GRANDS CHIFFRES SIMPLES */}
      <div>
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span>📊 Vos 4 chiffres clés en français facile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARTE 1 : TOTAL DES VENTES */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {formatPrice(dashboard?.totalTransactionsAmount)}
            </div>
            <div className="text-sm font-bold text-gray-700 mt-1">Total des ventes</div>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Montant total des achats réalisés par les clients sur la plateforme.
            </p>
          </div>

          {/* CARTE 2 : ARGENT SÉCURISÉ (SÉQUESTRE) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {formatPrice(dashboard?.escrowLockedFunds?.value)}
            </div>
            <div className="text-sm font-bold text-gray-700 mt-1">Argent gardé en sécurité</div>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Fonds protégés (Wave/OM) en attente que les acheteurs reçoivent leurs colis.
            </p>
          </div>

          {/* CARTE 3 : ARTICLES EN LIGNE */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {dashboard?.totalProducts || 0}
            </div>
            <div className="text-sm font-bold text-gray-700 mt-1">Articles dans la boutique</div>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Vêtements, chaussures et accessoires visibles et prêts à être achetés.
            </p>
          </div>

          {/* CARTE 4 : MEMBRES INSCRITS */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm relative overflow-hidden group hover:border-pink-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {dashboard?.totalUsers || 0}
            </div>
            <div className="text-sm font-bold text-gray-700 mt-1">Membres inscrits</div>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Acheteurs et vendeurs sénégalais ayant créé un compte avec leur numéro.
            </p>
          </div>
        </div>
      </div>

      {/* 4. LES DERNIÈRES COMMANDES RÉCENTES (TRÈS VISUELLES) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span>📦 Les dernières commandes passées</span>
          </h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir toutes les commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucune commande enregistrée pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => {
              const isDone = order.status === 'COMPLETED';
              const isLocked = order.status === 'PAID_ESCROW_LOCKED';
              const isDisputed = order.status === 'DISPUTED';

              let badgeColor = 'bg-gray-100 text-gray-700';
              let badgeText = 'En attente';

              if (isDone) {
                badgeColor = 'bg-emerald-100 text-emerald-800';
                badgeText = '✅ Vente terminée (Vendeur payé)';
              } else if (isDisputed) {
                badgeColor = 'bg-rose-100 text-rose-800';
                badgeText = '⚠️ Litige en cours';
              } else if (isLocked) {
                badgeColor = 'bg-purple-100 text-purple-800';
                badgeText = '🔒 Payé - Argent en sécurité';
              } else if (order.status === 'SHIPPED') {
                badgeColor = 'bg-blue-100 text-blue-800';
                badgeText = '🚚 Colis en cours de livraison';
              }

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0">
                      #{order.id}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {order.productTitle || `Article #${order.productId}`}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Acheteur : <strong className="text-gray-700">{order.buyer?.fullName || order.buyer?.phone}</strong> &bull; Vendeur : <strong className="text-gray-700">{order.seller?.fullName || order.seller?.phone}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badgeColor}`}>
                      {badgeText}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. PETIT GUIDE D'AIDE */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 space-y-1">
          <strong className="text-gray-900 font-bold block">Comment fonctionne le site ReVibe FliP en résumé ?</strong>
          <p>
            1. Un vendeur publie un vêtement &bull; 2. Un acheteur paie avec Wave ou Orange Money &bull; 3. L'argent reste protégé &bull; 4. Le livreur apporte le colis &bull; 5. L'acheteur confirme et le vendeur reçoit son argent !
          </p>
        </div>
      </div>
    </div>
  );
};
