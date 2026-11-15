/**
 * Onglet / Vue Vendeur : SellerSidebar
 *
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerSidebar).
 * Responsive : barre supérieure + tiroir mobile (< lg), barre latérale fixe sur ordinateur (>= lg).
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  DollarSign,
  Star,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { SellerDashboard, SellerProfile } from '../../services/api';
import { User } from '../../types';

export type SellerTabType =
  | 'overview'
  | 'listings'
  | 'offers'
  | 'orders'
  | 'finances'
  | 'reviews'
  | 'messages'
  | 'profile';

interface SellerSidebarProps {
  activeTab: SellerTabType;
  setActiveTab: (tab: SellerTabType) => void;
  dashboard: SellerDashboard | null;
  profile: SellerProfile | null;
  currentUser: User | null;
  onLogout: () => void;
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeTab,
  setActiveTab,
  dashboard,
  profile,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    id: SellerTabType;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string | number | null;
    badgePulse?: boolean;
  }> = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      shortLabel: 'Accueil',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'listings',
      label: 'Mes Annonces',
      shortLabel: 'Annonces',
      icon: <Package className="w-4 h-4 shrink-0" />,
      badge: dashboard?.activeProducts || 0,
    },
    {
      id: 'offers',
      label: 'Offres Directes',
      shortLabel: 'Offres',
      icon: <Tag className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'orders',
      label: 'Commandes Reçues',
      shortLabel: 'Commandes',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      badge:
        dashboard?.ordersToProcess && dashboard.ordersToProcess > 0
          ? dashboard.ordersToProcess
          : null,
      badgePulse: true,
    },
    {
      id: 'finances',
      label: 'Finances & Gains',
      shortLabel: 'Finances',
      icon: <DollarSign className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'reviews',
      label: 'Avis & Évaluations',
      shortLabel: 'Avis',
      icon: <Star className="w-4 h-4 shrink-0" />,
      badge: `★ ${dashboard?.averageRating?.toFixed(1) || '5.0'}`,
    },
    {
      id: 'messages',
      label: 'Messagerie',
      shortLabel: 'Messages',
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      badge:
        dashboard?.unreadMessagesCount && dashboard.unreadMessagesCount > 0
          ? dashboard.unreadMessagesCount
          : null,
      badgePulse: true,
    },
    {
      id: 'profile',
      label: 'Mon Profil Vendeur',
      shortLabel: 'Profil',
      icon: <UserIcon className="w-4 h-4 shrink-0" />,
    },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleSelectTab = (tab: SellerTabType) => {
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
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
                  item.badgePulse && !isActive
                    ? 'bg-purple-600 text-white animate-pulse'
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
            {profile?.firstName?.charAt(0) || currentUser?.firstName?.charAt(0) || 'V'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">
              {profile?.fullName || currentUser?.fullName || 'Vendeur'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {profile?.phone || currentUser?.phone || '+221'}
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
      {/* 1. Barre Mobile / Tablette (< lg) — épurée */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Ouvrir le menu vendeur"
            className="p-2 -ml-1 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
            RF
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 truncate">Espace Vendeur</p>
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    RF
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-gray-900 truncate">Espace Vendeur</h2>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                      {dashboard?.sellerSinceLabel || 'Vendeur ReVibe FliP'}
                    </span>
                  </div>
                </div>
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
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 w-72 bg-white border-r border-gray-150 p-5 flex-col justify-between z-30 shadow-xs overflow-y-auto no-scrollbar">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-700/20">
              RF
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 tracking-tight">Espace Vendeur</h2>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {dashboard?.sellerSinceLabel || 'Vendeur ReVibe FliP'}
              </span>
            </div>
          </div>

          {renderNavList()}
        </div>

        {renderProfileFooter()}
      </aside>
    </>
  );
};
