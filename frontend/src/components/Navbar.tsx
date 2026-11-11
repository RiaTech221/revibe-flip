import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoryApi, notificationApi } from '../services/api';
import { Category, Notification } from '../types';
import { Logo } from './Logo';
import {
  Search,
  PlusCircle,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  ShoppingBag,
  Package,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  Store,
  MapPin,
  Tag,
  SlidersHorizontal,
  Heart
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getUnreadCount().then((res) => {
        if (res.data) setUnreadNotifications(res.data.data);
      }).catch(console.error);

      notificationApi.getAll().then((res) => {
        if (res.data && res.data.data) setNotifications(res.data.data.slice(0, 5));
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/catalog');
      return;
    }
    navigate(`/catalog?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* 1. LOGO ÉPURÉ (Retour direct à l'accueil) */}
          <Link to="/" className="flex items-center group shrink-0" title="ReVibe FliP - Accueil">
            <Logo size="md" />
          </Link>

          {/* 2. GRANDE BARRE DE RECHERCHE UNIVERSELLE & ÉPURÉE (Style Vinted / ASOS) */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center flex-1 max-w-xl mx-2 sm:mx-4 relative"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article, une marque, un style (ex: Wax, Nike, Robe...)"
                className="w-full h-10 sm:h-11 pl-11 pr-10 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  title="Effacer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* 3. ACTIONS DE DROITE (VENDRE, MESSAGES, PROFIL, PANIER) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Bouton "+ Vendre" (Le moteur principal de la marketplace) */}
            <Link
              to={isAuthenticated ? "/sell" : "/login?redirect=/sell"}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-95"
              title="Vendre un article"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Vendre</span>
            </Link>

            {/* Messages / Discussions */}
            <Link
              to="/messages"
              className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-purple-700 transition-colors relative"
              title="Messagerie & Discussions"
            >
              <MessageSquare className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </Link>

            {/* 3. Icône Profil Parlante (Ouverture du Menu Compte & Connexion style Amazon / Shein) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-purple-700 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title={isAuthenticated ? (user?.fullName || 'Mon profil') : 'Compte & Connexion'}
              >
                {isAuthenticated && user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-purple-200 ring-2 ring-transparent hover:ring-purple-400 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-purple-50 flex items-center justify-center text-slate-700 hover:text-purple-700 transition-colors">
                    <UserIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                )}
              </button>

              {/* Menu déroulant Compte / Connexion */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-fade-in text-xs">
                  {isAuthenticated ? (
                    <>
                      {/* En-tête utilisateur connecté */}
                      <div className="px-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                        <img
                          src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=7c3aed&color=fff`}
                          alt={user?.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-purple-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate text-sm">{user?.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user?.city || 'Dakar'} • {user?.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Membre'}</p>
                        </div>
                      </div>

                      <div className="py-1.5 px-2 space-y-0.5">
                        <Link
                          to="/seller?tab=overview"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold"
                        >
                          <Store className="w-4 h-4 text-purple-700" />
                          <span>Espace Vendeur (Tableau de bord)</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Votre compte & Profil</span>
                        </Link>

                        <Link
                          to="/profile?tab=purchases"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>Vos commandes</span>
                        </Link>

                        <Link
                          to="/profile?tab=sales"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>Vos ventes & Dressing</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                            <span>Console Administration</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1.5 px-2 mt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Menu non connecté (Exactement le modèle Amazon/Shein de l'image utilisateur) */}
                      <div className="px-4 pb-3 space-y-2.5 border-b border-slate-100">
                        <Link
                          to="/login"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-center shadow-xs transition-colors"
                        >
                          Se connecter
                        </Link>
                        <p className="text-center text-[11px] text-slate-500">
                          Nouveau client ?{' '}
                          <Link
                            to="/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="text-purple-700 font-bold hover:underline"
                          >
                            S'inscrire ici
                          </Link>
                        </p>
                      </div>

                      <div className="py-1.5 px-2 space-y-0.5">
                        <Link
                          to="/login"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Votre compte</span>
                        </Link>

                        <Link
                          to="/login"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>Vos commandes</span>
                        </Link>

                        <Link
                          to="/catalog"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>Explorer le catalogue</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 4. Bouton Panier (Uniquement l'icône parlante avec pastille compteur, SANS écriture) */}
            <button
              type="button"
              onClick={toggleCart}
              className="relative p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer active:scale-95"
              title="Mon Panier"
            >
              <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              {totalCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-purple-700 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-scale-in">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-600 sm:hidden rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu & Recherche Mobile */}
      {isMobileMenuOpen && (
        <div className="sm:hidden p-4 bg-white border-t border-slate-100 space-y-3 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (Nike, Robe, Wax...)"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
            />
          </form>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold text-center"
            >
              🛍️ Tout le catalogue
            </Link>
            <Link
              to={isAuthenticated ? "/sell" : "/login?redirect=/sell"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl bg-purple-700 text-white text-xs font-bold text-center"
            >
              ✨ + Vendre un article
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
