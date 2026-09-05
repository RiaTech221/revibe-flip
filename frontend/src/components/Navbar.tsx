import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { categoryApi, notificationApi } from '../services/api';
import { Category, Notification } from '../types';
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
  Compass
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (searchQuery.trim()) {
      navigate(`/catalog?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleSellClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/sell');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="ReVibe FliP" className="h-12 sm:h-14 w-auto object-contain" />
          </Link>

          {/* Quick Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                location.pathname === '/'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/catalog"
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                location.pathname === '/catalog' && !location.search.includes('categoryId')
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              Explorer
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des articles, des marques (ex: Robe wax, Nike, Boubou...)"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </form>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Sell Button */}
            <button
              onClick={handleSellClick}
              className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 ${
                location.pathname === '/sell'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white ring-2 ring-pink-400 ring-offset-2'
                  : 'bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Vendre</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Messages Icon */}
                <Link
                  to="/messages"
                  className={`p-2.5 rounded-full transition-colors relative ${
                    location.pathname === '/messages'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                  title="Messagerie"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2.5 rounded-full transition-colors relative ${
                      isNotificationsOpen
                        ? 'bg-purple-100 text-purple-800'
                        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
                        <button
                          onClick={() => {
                            notificationApi.markAllAsRead();
                            setUnreadNotifications(0);
                          }}
                          className="text-[11px] text-purple-700 font-semibold hover:underline"
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                      <div className="mt-2 divide-y divide-gray-50 max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">Aucune notification</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="py-2.5 text-xs">
                              <p className="font-semibold text-gray-800">{n.title}</p>
                              <p className="text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-full border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <img
                      src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=9333ea&color=fff`}
                      alt={user?.fullName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-gray-800 hidden sm:inline max-w-[100px] truncate">
                      {user?.firstName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-1" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400">Connecté en tant que</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                          {user?.phone}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-800 font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-purple-600" />
                        Mon Profil & Annonces
                      </Link>

                      <Link
                        to="/profile?tab=purchases"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-800 font-medium"
                      >
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        Mes Achats
                      </Link>

                      <Link
                        to="/profile?tab=sales"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-800 font-medium"
                      >
                        <Package className="w-4 h-4 text-purple-600" />
                        Mes Ventes
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-900 bg-amber-50/70 hover:bg-amber-100 font-bold border-t border-b border-amber-100"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          Back-Office Admin
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-full border border-purple-600 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 rounded-full bg-purple-700 text-white hover:bg-purple-800 text-xs font-bold transition-colors hidden sm:inline-block shadow-sm"
                >
                  S'inscrire
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 md:hidden rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Sub-Navigation Bar */}
      <nav className="border-t border-gray-100 bg-white/80 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-2 sm:space-x-4 py-2 text-xs font-semibold whitespace-nowrap">
          <Link
            to="/catalog"
            className={`px-3 py-1.5 rounded-full transition-all ${
              location.pathname === '/catalog' && !location.search.includes('categoryId')
                ? 'bg-purple-700 text-white font-bold shadow-sm'
                : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            Tous les articles
          </Link>
          {categories.map((cat) => {
            const isCatActive = location.pathname === '/catalog' && location.search.includes(`categoryId=${cat.id}`);
            return (
              <Link
                key={cat.id}
                to={`/catalog?categoryId=${cat.id}`}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  isCatActive
                    ? 'bg-purple-700 text-white font-bold shadow-sm'
                    : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile search bar */}
      {isMobileMenuOpen && (
        <div className="md:hidden p-4 bg-white border-t border-gray-100 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des articles..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </form>

          <button
            onClick={handleSellClick}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm shadow flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Vendre un article
          </button>
        </div>
      )}
    </header>
  );
};
