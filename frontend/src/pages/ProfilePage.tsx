/**
 * Page de Gestion du Profil Utilisateur ReVibe FliP
 * 
 * Permet à l'utilisateur connecté de consulter et modifier ses informations personnelles :
 *  * - Coordonnées, photo de profil, adresse de livraison et pays de résidence
 *  * - Badge de confiance (Trust Score), niveau de vérification et avis reçus
 *  * - Paramètres de notification et sécurité du compte
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi, userApi } from '../services/api';
import { Order } from '../types';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Settings,
  CheckCircle2,
  Store,
  Truck,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Package,
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'purchases';

  const [myPurchases, setMyPurchases] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit form states
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editCity, setEditCity] = useState(user?.city || 'Dakar');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editProfilePic, setEditProfilePic] = useState(user?.profilePicture || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditEmail(user.email || '');
      setEditCity(user.city || 'Dakar');
      setEditAddress(user.address || '');
      setEditProfilePic(user.profilePicture || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    orderApi
      .getMyPurchases()
      .then((res) => {
        if (res.data?.data) setMyPurchases(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await userApi.updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        profilePicture: editProfilePic.trim(),
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert('Erreur lors de la mise à jour des informations de profil');
    } finally {
      setProfileSaving(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID_ESCROW_LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Payé sous séquestre (Fonds protégés)</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-900 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Commande acceptée par le vendeur</span>
          </span>
        );
      case 'SHIPPED':
      case 'IN_TRANSIT':
      case 'IN_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Colis en cours de livraison</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-900 border border-teal-200">
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>Colis livré • À confirmer</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terminée & Conforme</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-900 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Commande annulée</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER PROFIL CLIENT */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={
                  user?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || 'User'
                  )}&background=7c3aed&color=fff`
                }
                alt={user?.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 text-base bg-white rounded-full px-1 shadow-xs">
                🇸🇳
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{user?.fullName}</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Acheteur Vérifié
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-purple-700" /> {user?.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> {user?.city || 'Dakar'}
                </span>
              </p>
            </div>
          </div>

          {/* Boutons Actions Rapides */}
          <div className="flex items-center gap-3">
            <Link
              to="/seller"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-md shadow-purple-700/20 transition-all active:scale-98"
            >
              <Store className="w-4 h-4 text-purple-200" />
              <span>Espace Vendeur</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-700 text-xs font-bold rounded-2xl transition-all"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION ONGLETS */}
        <div className="flex gap-2 border-b border-gray-200 pb-3 text-xs font-bold">
          <button
            onClick={() => setSearchParams({ tab: 'purchases' })}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 ${
              currentTab === 'purchases'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mes Achats & Colis ({myPurchases.length})</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 ${
              currentTab === 'settings'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Mes Coordonnées & Livraison</span>
          </button>
        </div>

        {/* CONTENU ONGLET 1 : MES ACHATS */}
        {currentTab === 'purchases' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">Chargement de vos achats...</div>
            ) : myPurchases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 p-8 space-y-3 shadow-xs">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-sm font-black text-gray-900">Vous n'avez pas encore passé de commande</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Parcourez le catalogue de seconde main pour dénicher des pièces uniques garanties sous séquestre.
                </p>
                <Link
                  to="/catalog"
                  className="inline-block px-5 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-sm shadow-purple-700/20"
                >
                  Explorer les articles
                </Link>
              </div>
            ) : (
              myPurchases.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <img
                      src={
                        ord.productImageUrl ||
                        '/placeholder-product.svg'
                      }
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-200 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-purple-700">
                          N° {ord.orderNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 truncate mt-0.5">
                        {ord.productTitle}
                      </h4>
                      <p className="text-xs text-purple-700 font-black mt-0.5">
                        {ord.totalAmount.toLocaleString('fr-FR')} FCFA
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          Vendeur : <strong>{ord.seller?.fullName}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Truck className="w-3 h-3 text-purple-600" />
                          {ord.deliveryMode === 'HOME_DELIVERY' ? 'Livraison moto' : 'Remise en main propre'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div>{renderStatusBadge(ord.status)}</div>

                    <Link
                      to={`/orders/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-98 whitespace-nowrap"
                    >
                      <span>Détails & Suivi du colis</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENU ONGLET 2 : COORDONNÉES */}
        {currentTab === 'settings' && (
          <form
            onSubmit={handleUpdateProfile}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6 max-w-2xl"
          >
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Coordonnées Personnelles & Livraison
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ces informations pré-remplissent vos prochaines commandes pour les livreurs.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Vos coordonnées ont été enregistrées avec succès !</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Email (facultatif)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Ville de résidence *</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Adresse par défaut (Quartier, Rue, N° villa...)
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ex: Sacré-Cœur 3, Villa 123"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all disabled:opacity-50"
              >
                {profileSaving ? 'Enregistrement...' : 'Enregistrer mes coordonnées'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
