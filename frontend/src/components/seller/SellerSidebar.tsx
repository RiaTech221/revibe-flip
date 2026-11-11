/**
 * Onglet / Vue Vendeur : SellerSidebar
 * 
 * Module interactif pour la gestion des annonces, commandes, finances ou profil vendeur (SellerSidebar).
 */

import React from 'react';
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
  return (
    <aside className="w-full lg:w-72 bg-white border-r border-gray-150 p-6 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-6">
        {/* Header / Titre Espace Vendeur */}
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

        {/* Menu Navigation */}
        <nav className="space-y-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'overview'
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
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Mes Annonces</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'listings' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dashboard?.activeProducts || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Tag className="w-4 h-4" />
              <span>Offres Directes</span>
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
              <ShoppingBag className="w-4 h-4" />
              <span>Commandes Reçues</span>
            </span>
            {dashboard?.ordersToProcess && dashboard.ordersToProcess > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white animate-pulse">
                {dashboard.ordersToProcess}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'finances'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <DollarSign className="w-4 h-4" />
              <span>Finances & Gains</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Star className="w-4 h-4" />
              <span>Avis & Évaluations</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'reviews' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              ★ {dashboard?.averageRating?.toFixed(1) || '5.0'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Messagerie</span>
            </span>
            {dashboard?.unreadMessagesCount && dashboard.unreadMessagesCount > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white">
                {dashboard.unreadMessagesCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <UserIcon className="w-4 h-4" />
              <span>Mon Profil Vendeur</span>
            </span>
          </button>
        </nav>
      </div>

      {/* Profil en bas */}
      <div className="pt-6 border-t border-gray-150 space-y-3">
        <div className="flex items-center justify-between">
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
    </aside>
  );
};
