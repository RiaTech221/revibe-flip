import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Users,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Home,
  ShieldCheck,
  Wrench,
  Lock,
  Eye,
  EyeOff,
  X,
  KeyRound,
} from 'lucide-react';
import { Logo } from '../../Logo';
import {
  AdminDashboard,
  Product,
  Order,
  AdminPayment,
  User,
} from '../../../types';
import { EasyOverviewSection } from './EasyOverviewSection';
import { EasyProductsSection } from './EasyProductsSection';
import { EasyPaymentsSection } from './EasyPaymentsSection';
import { EasyOrdersSection } from './EasyOrdersSection';
import { EasyUsersSection } from './EasyUsersSection';
import { EasyReportsSection } from './EasyReportsSection';

export type EasyTabType = 'overview' | 'products' | 'payments' | 'orders' | 'users' | 'reports';

const MAINTAINER_ACCESS_CODE = 'NDIITTECH2026';

interface AdminEasyDashboardProps {
  dashboard: AdminDashboard | null;
  products: Product[];
  onSetProductStatus: (productId: number, status: string) => void;
  onDeleteProduct: (productId: number) => void;
  orders: Order[];
  onOpenDeliveryModal: (order: Order) => void;
  payments: AdminPayment[];
  reports: any[];
  onOpenReportModal: (report: any) => void;
  users: User[];
  onToggleSuspendUser: (userId: number, currentSuspended: boolean) => void;
  currentUser: User | null;
  isAdmin: boolean;
  formatPrice: (amount?: number | null) => string;
  formatDate: (dateStr?: string) => string;
  onUnlockMaintenanceMode: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
}

export const AdminEasyDashboard: React.FC<AdminEasyDashboardProps> = ({
  dashboard,
  products,
  onSetProductStatus,
  onDeleteProduct,
  orders,
  onOpenDeliveryModal,
  payments,
  reports,
  onOpenReportModal,
  users,
  onToggleSuspendUser,
  currentUser,
  isAdmin,
  formatPrice,
  formatDate,
  onUnlockMaintenanceMode,
  onRefresh,
  refreshing,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<EasyTabType>('overview');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceCode, setMaintenanceCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const pendingModeration = dashboard?.actionItems?.pendingModerationProducts || 0;
  const pendingReports = dashboard?.actionItems?.pendingReportsAndDisputes || 0;

  const tabs: Array<{
    id: EasyTabType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Accueil & Chiffres',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: 'Vêtements',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingModeration > 0 ? pendingModeration : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'payments',
      label: 'Argent & Séquestre',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: 'Colis & Livraisons',
      icon: <Truck className="w-4 h-4" />,
      badge: orders.length > 0 ? orders.length : undefined,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'users',
      label: 'Membres',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Litiges & Réclamations',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: pendingReports > 0 ? pendingReports : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  const openMaintenancePrompt = () => {
    setMaintenanceCode('');
    setCodeError(null);
    setShowCode(false);
    setIsMaintenanceModalOpen(true);
  };

  const closeMaintenancePrompt = () => {
    setIsMaintenanceModalOpen(false);
    setMaintenanceCode('');
    setCodeError(null);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (maintenanceCode.trim() !== MAINTAINER_ACCESS_CODE) {
      setCodeError("Code maintenancier incorrect. Accès au tableau de bord technique refusé.");
      return;
    }
    closeMaintenancePrompt();
    onUnlockMaintenanceMode();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 pb-16">
      {/* 1. BARRE SUPÉRIEURE ÉPURÉE */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-gray-900 leading-none">
                  ReVibe FliP Administration
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  Mode Simplifié ✨
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Interface claire et essentielle pour gérer votre plateforme au quotidien
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-[11px]">
                {currentUser?.firstName?.charAt(0) || 'A'}
              </span>
              <span className="font-bold text-gray-800 truncate max-w-[140px]">
                {currentUser?.fullName || 'Administrateur'}
              </span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-2xl bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-600 transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION PAR ONGLETS SIMPLES + ONGLET MAINTENANCIER */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                        : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                    {t.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          t.badgeColor || 'bg-white text-purple-700'
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={openMaintenancePrompt}
                className="px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-sm"
                title="Réservé au maintenancier / développeur (code requis)"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Maintenancier</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. ZONE DE CONTENU PRINCIPALE */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <EasyOverviewSection
            dashboard={dashboard}
            orders={orders}
            onNavigateTab={(tab) => setActiveTab(tab as EasyTabType)}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'products' && (
          <EasyProductsSection
            products={products}
            onSetProductStatus={onSetProductStatus}
            onDeleteProduct={onDeleteProduct}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'payments' && (
          <EasyPaymentsSection
            payments={payments}
            dashboard={dashboard}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'orders' && (
          <EasyOrdersSection
            orders={orders}
            onOpenDeliveryModal={onOpenDeliveryModal}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'users' && (
          <EasyUsersSection
            users={users}
            onToggleSuspend={onToggleSuspendUser}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <EasyReportsSection
            reports={reports}
            onOpenReportModal={onOpenReportModal}
            formatDate={formatDate}
          />
        )}
      </main>

      {/* 4. MODALE CODE MAINTENANCIER */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-gray-150 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={closeMaintenancePrompt}
              aria-label="Fermer"
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Accès Mode Maintenancier
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Cet espace active le tableau de bord développeur complet (paramètres techniques, journal d'audit, CMS, catégories, graphiques avancés).
                </p>
              </div>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              {codeError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {codeError}
                </div>
              )}

              <div>
                <label
                  htmlFor="maintainer-access-code"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Code d'accès maintenancier
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="maintainer-access-code"
                    type={showCode ? 'text' : 'password'}
                    autoFocus
                    required
                    value={maintenanceCode}
                    onChange={(e) => {
                      setMaintenanceCode(e.target.value);
                      if (codeError) setCodeError(null);
                    }}
                    placeholder="Saisissez le code maintenancier..."
                    className="w-full h-11 pl-10 pr-11 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    aria-label={showCode ? 'Masquer le code' : 'Afficher le code'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeMaintenancePrompt}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Activer le dashboard technique</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
