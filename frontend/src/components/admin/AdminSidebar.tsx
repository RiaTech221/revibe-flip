/**
 * Section de Gestion Admin : AdminSidebar
 *
 * Module de gestion dédié du back-office ReVibe FliP (AdminSidebar).
 * Responsive : barre supérieure + tiroir mobile (< lg), barre latérale fixe sur ordinateur (>= lg).
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Users,
  Truck,
  CreditCard,
  AlertTriangle,
  Settings,
  FileText,
  History,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { AdminDashboard, User } from '../../types';
import { Logo } from '../Logo';

export type AdminTabType =
  | 'kpi'
  | 'products'
  | 'categories'
  | 'users'
  | 'orders'
  | 'payments'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'content';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  dashboard: AdminDashboard | null;
  currentUser: User | null;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  dashboard,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    id: AdminTabType;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number | null;
    alert?: boolean;
  }> = [
    {
      id: 'kpi',
      label: 'Tableau de bord',
      shortLabel: 'Accueil',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'users',
      label: 'Utilisateurs & Rôles',
      shortLabel: 'Utilisateurs',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: dashboard?.totalUsers || 0,
    },
    {
      id: 'products',
      label: 'Modération Annonces',
      shortLabel: 'Annonces',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      badge: dashboard?.totalProducts || 0,
    },
    {
      id: 'categories',
      label: 'Rayons & Catégories',
      shortLabel: 'Catégories',
      icon: <Layers className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'orders',
      label: 'Commandes & Livraisons',
      shortLabel: 'Commandes',
      icon: <Truck className="w-4 h-4 shrink-0" />,
      badge: dashboard?.totalOrders || 0,
    },
    {
      id: 'payments',
      label: 'Fonds & Transactions',
      shortLabel: 'Fonds',
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'reports',
      label: 'Litiges & Signalements',
      shortLabel: 'Litiges',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge:
        dashboard?.pendingReports && dashboard.pendingReports > 0
          ? dashboard.pendingReports
          : null,
      alert: true,
    },
    {
      id: 'content',
      label: 'Gestionnaire CMS',
      shortLabel: 'CMS',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'audit',
      label: "Journal d'Audit",
      shortLabel: 'Audit',
      icon: <History className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Paramètres Plateforme',
      shortLabel: 'Paramètres',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleSelectTab = (tab: AdminTabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderNavList = () => (
    <nav className="space-y-1.5 text-xs font-bold">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </span>
            {item.badge !== undefined && item.badge !== null && (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  item.alert
                    ? 'bg-rose-600 text-white animate-pulse'
                    : isActive
                    ? 'bg-purple-800 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderProfileFooter = () => (
    <div className="pt-5 border-t border-gray-150">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
            {currentUser?.firstName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">
              {currentUser?.fullName || 'Super Admin'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {currentUser?.phone || '+221 77 000 00 00'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all shrink-0 cursor-pointer"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Barre Mobile / Tablette (< lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu admin"
              className="p-2 -ml-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">Back-Office Admin</p>
              <p className="text-[11px] font-bold text-purple-700 truncate">{activeItem.label}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer shrink-0"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Onglets rapides horizontaux sur mobile */}
        <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {item.icon}
                <span>{item.shortLabel}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      item.alert
                        ? 'bg-rose-600 text-white'
                        : isActive
                        ? 'bg-purple-800 text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tiroir coulissant Mobile (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white p-5 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fermer le menu"
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderNavList()}
            </div>
            {renderProfileFooter()}
          </aside>
        </div>
      )}

      {/* 3. Sidebar Desktop (>= lg) */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-150 p-6 flex-col justify-between shrink-0 shadow-xs">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Logo />
          </div>
          {renderNavList()}
        </div>

        {renderProfileFooter()}
      </aside>
    </>
  );
};
