/**
 * Section de Gestion Admin : AdminSidebar
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminSidebar).
 */

import React from 'react';
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
  LogOut,
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
  return (
    <aside className="w-full lg:w-72 bg-white border-r border-gray-150 p-6 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-6">
        {/* Logo ReVibe FliP Back-Office */}
        <div className="flex items-center gap-3 px-2">
          <Logo />
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'kpi'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de bord</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Utilisateurs & Rôles</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'users' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dashboard?.totalUsers || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Modération Annonces</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'products' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dashboard?.totalProducts || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Layers className="w-4 h-4" />
              <span>Rayons & Catégories</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Truck className="w-4 h-4" />
              <span>Commandes & Livraisons</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'orders' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dashboard?.totalOrders || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Séquestre & Transactions</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Litiges & Signalements</span>
            </span>
            {dashboard?.pendingReports && dashboard.pendingReports > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                {dashboard.pendingReports}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'content'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>Gestionnaire CMS</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span>Paramètres Plateforme</span>
            </span>
          </button>
        </nav>
      </div>

      {/* Profil administrateur et Déconnexion */}
      <div className="pt-6 border-t border-gray-150 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
              A
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
    </aside>
  );
};
