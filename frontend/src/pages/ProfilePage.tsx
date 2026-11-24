/**
 * Page de Gestion du Profil Utilisateur ReVibe FliP
 * 
 * Permet à l'utilisateur connecté de consulter et modifier ses informations personnelles :
 *  * - Coordonnées, photo de profil, adresse de livraison et pays de résidence
 *  * - Badge de confiance (Trust Score), niveau de vérification et avis reçus
 *  * - Paramètres de notification et sécurité du compte
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, uploadApi } from '../services/api';
import { Order, PersonalDashboard, ProductStatus } from '../types';
import { formatImageUrl } from '../utils/imageUrl';
import { validateProfileImageFile } from '../utils/profileImageValidation';
import { ProfileAvatarUpload } from '../components/common/ProfileAvatarUpload';
import {
  ShoppingBag,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  Settings,
  CheckCircle2,
  Store,
  Truck,
  LogOut,
  ShieldCheck,
  Package,
  AlertCircle,
  Camera,
  Star,
  Tag,
  Eye,
  MessageSquare
} from 'lucide-react';

const PAGE_SIZE = 6;

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const rawTab = searchParams.get('tab') || 'orders';

  const [dashboard, setDashboard] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersSubTab, setOrdersSubTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [salesPage, setSalesPage] = useState(0);
  const [listingsPage, setListingsPage] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(0);

  const isSeller = Boolean(dashboard?.isSeller);
  const currentTab: 'orders' | 'listings' | 'reviews' | 'settings' = (() => {
    if (rawTab === 'settings') return 'settings';
    if (rawTab === 'listings' && isSeller) return 'listings';
    if (rawTab === 'reviews' && isSeller) return 'reviews';
    return 'orders';
  })();

  // Profile Edit form states
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editCity, setEditCity] = useState(user?.city || 'Dakar');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editProfilePic, setEditProfilePic] = useState(user?.profilePicture || '');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoMarkedForRemoval, setPhotoMarkedForRemoval] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [headerAvatarError, setHeaderAvatarError] = useState(false);

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
    setHeaderAvatarError(false);
  }, [user?.profilePicture]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const handleSelectPhotoFile = (file: File) => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoError(null);
    setProfileError(null);
    setProfileSuccess(null);
    setPhotoMarkedForRemoval(false);
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelectedPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
  };

  const handleRemoveCurrentPhoto = () => {
    handleClearSelectedPhoto();
    setPhotoMarkedForRemoval(true);
    setPhotoError(null);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    userApi
      .getPersonalDashboard({
        purchasesPage,
        salesPage,
        listingsPage,
        reviewsPage,
        size: PAGE_SIZE,
      })
      .then((res) => {
        if (res.data?.data) {
          setDashboard(res.data.data);
          if (!res.data.data.isSeller) {
            setOrdersSubTab('purchases');
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, purchasesPage, salesPage, listingsPage, reviewsPage]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);
    setPhotoError(null);

    try {
      let nextProfilePicture = photoMarkedForRemoval ? '' : editProfilePic.trim();

      if (selectedPhotoFile) {
        const validation = validateProfileImageFile(selectedPhotoFile);
        if (!validation.valid) {
          setPhotoError(validation.error || 'Fichier invalide.');
          return;
        }
        setUploadingPhoto(true);
        try {
          const uploadRes = await uploadApi.uploadFile(selectedPhotoFile, 'avatars');
          if (!uploadRes.data?.data) {
            throw new Error("Le serveur n'a pas retourné l'URL de la photo téléversée.");
          }
          nextProfilePicture = uploadRes.data.data;
        } catch (uploadErr: any) {
          const msg =
            uploadErr?.response?.data?.message ||
            uploadErr?.message ||
            'Erreur lors du téléversement de la photo de profil.';
          setPhotoError(msg);
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      const updateRes = await userApi.updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        profilePicture: nextProfilePicture,
      });

      if (updateRes.data?.data) {
        updateUser(updateRes.data.data);
        setEditProfilePic(updateRes.data.data.profilePicture || '');
      }

      const hadNewPhoto = Boolean(selectedPhotoFile);
      handleClearSelectedPhoto();
      setPhotoMarkedForRemoval(false);

      setProfileSuccess(
        hadNewPhoto
          ? 'Votre photo de profil et vos informations personnelles ont été mises à jour avec succès !'
          : 'Vos coordonnées ont été enregistrées avec succès !'
      );
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Erreur lors de la mise à jour des informations de profil.';
      setProfileError(msg);
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

  const renderProductStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            En ligne
          </span>
        );
      case 'SOLD':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
            Vendu
          </span>
        );
      case 'RESERVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            Réservé
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
            Brouillon
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">
            Inactif
          </span>
        );
    }
  };

  const renderPagination = (
    pageNumber: number,
    totalPages: number,
    onPageChange: (nextPage: number) => void
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={pageNumber <= 0}
          onClick={() => onPageChange(Math.max(0, pageNumber - 1))}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>
        <span className="text-xs font-bold text-gray-500">
          Page {pageNumber + 1} sur {totalPages}
        </span>
        <button
          type="button"
          disabled={pageNumber + 1 >= totalPages}
          onClick={() => onPageChange(pageNumber + 1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderOrderCard = (ord: Order, role: 'buyer' | 'seller') => (
    <div
      key={`${role}-${ord.id}`}
      className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-200 transition-colors"
    >
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <img
          src={formatImageUrl(ord.productImageUrl) || '/placeholder-product.svg'}
          alt=""
          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-200 shadow-2xs"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                role === 'seller'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              {role === 'seller' ? 'Vente' : 'Achat'}
            </span>
          </div>
          <h4 className="text-sm font-black text-gray-900 truncate mt-0.5">
            {ord.productTitle}
          </h4>
          <p className="text-xs text-purple-700 font-black mt-0.5">
            {role === 'seller'
              ? `Net vendeur : ${(ord.sellerPayout ?? ord.totalAmount).toLocaleString('fr-FR')} FCFA`
              : `${ord.totalAmount.toLocaleString('fr-FR')} FCFA`}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {role === 'seller' ? 'Acheteur : ' : 'Vendeur : '}
              <strong>
                {role === 'seller' ? ord.buyer?.fullName : ord.seller?.fullName}
              </strong>
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
  );

  if (!isAuthenticated) return null;

  const purchasesList = dashboard?.purchases?.content || [];
  const purchasesTotal = dashboard?.purchasesCount || 0;
  const purchasesTotalPages = dashboard?.purchases?.totalPages || 0;

  const salesList = isSeller ? dashboard?.sales?.content || [] : [];
  const salesTotal = isSeller ? dashboard?.salesCount || 0 : 0;
  const salesTotalPages = isSeller ? dashboard?.sales?.totalPages || 0 : 0;

  const listingsList = isSeller ? dashboard?.listings?.content || [] : [];
  const listingsTotal = isSeller ? dashboard?.listingsCount || 0 : 0;
  const listingsTotalPages = isSeller ? dashboard?.listings?.totalPages || 0 : 0;

  const reviewsList = isSeller ? dashboard?.reviews?.content || [] : [];
  const reviewsTotal = isSeller ? dashboard?.reviewCount || 0 : 0;
  const reviewsTotalPages = isSeller ? dashboard?.reviews?.totalPages || 0 : 0;
  const sellerAverageRating = isSeller ? dashboard?.averageRating ?? 0 : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER PROFIL CLIENT */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={
                  (!headerAvatarError && formatImageUrl(user?.profilePicture)) ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || 'User'
                  )}&background=7c3aed&color=fff`
                }
                alt={user?.fullName}
                onError={() => setHeaderAvatarError(true)}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 'settings') {
                    photoInputRef.current?.click();
                  } else {
                    setSearchParams({ tab: 'settings' });
                  }
                }}
                title="Modifier ma photo de profil"
                aria-label="Modifier ma photo de profil"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center border-2 border-white shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{user?.fullName}</h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  {isSeller ? 'Vendeur & Acheteur' : 'Acheteur Vérifié'}
                </span>
                {isSeller && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full"
                    data-testid="seller-header-rating"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>
                      {reviewsTotal > 0 ? `${sellerAverageRating.toFixed(1)} / 5` : 'Nouveau vendeur'}
                    </span>
                    <span className="text-amber-600 font-semibold">
                      ({reviewsTotal} avis)
                    </span>
                  </span>
                )}
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
            {isSeller && (
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl shadow-md shadow-purple-700/20 transition-all active:scale-98"
              >
                <Store className="w-4 h-4 text-purple-200" />
                <span>Espace Vendeur</span>
              </Link>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* RÉSUMÉ TABLEAU DE BORD VENDEUR (STRICTEMENT RÉSERVÉ AUX VENDEURS) */}
        {isSeller && (
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            data-testid="seller-dashboard-kpis"
          >
            <button
              type="button"
              onClick={() => {
                setSearchParams({ tab: 'orders' });
                setOrdersSubTab('purchases');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs text-left hover:border-purple-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mes Achats</span>
                <ShoppingBag className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{purchasesTotal}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchParams({ tab: 'orders' });
                setOrdersSubTab('sales');
              }}
              className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs text-left hover:border-purple-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mes Ventes</span>
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{salesTotal}</p>
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'listings' })}
              className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs text-left hover:border-purple-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Mes Annonces</span>
                <Tag className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{listingsTotal}</p>
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'reviews' })}
              className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs text-left hover:border-purple-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Note & Avis</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-gray-900">
                  {reviewsTotal > 0 ? `${sellerAverageRating.toFixed(1)} / 5` : '— / 5'}
                </p>
                <span className="text-[11px] font-bold text-gray-400">({reviewsTotal} avis)</span>
              </div>
            </button>
          </div>
        )}

        {/* NAVIGATION ONGLETS */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 text-xs font-bold">
          <button
            onClick={() => setSearchParams({ tab: 'orders' })}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'orders'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isSeller
                ? `Mes Commandes (${purchasesTotal + salesTotal})`
                : `Mes Achats & Colis (${purchasesTotal})`}
            </span>
          </button>

          {isSeller && (
            <button
              onClick={() => setSearchParams({ tab: 'listings' })}
              className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                currentTab === 'listings'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Mes Annonces ({listingsTotal})</span>
            </button>
          )}

          {isSeller && (
            <button
              onClick={() => setSearchParams({ tab: 'reviews' })}
              className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                currentTab === 'reviews'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Mes Évaluations ({reviewsTotal})</span>
            </button>
          )}

          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Mes Coordonnées & Livraison</span>
          </button>
        </div>

        {/* CONTENU ONGLET 1 : HISTORIQUE DES COMMANDES (ACHATS POUR TOUS + VENTES POUR VENDEUR) */}
        {currentTab === 'orders' && (
          <div className="space-y-4">
            {isSeller && (
              <div className="inline-flex p-1 bg-white border border-gray-200 rounded-2xl text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('purchases')}
                  className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                    ordersSubTab === 'purchases'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mes Achats ({purchasesTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('sales')}
                  className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                    ordersSubTab === 'sales'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mes Ventes ({salesTotal})
                </button>
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Chargement de votre historique de commandes...
              </div>
            ) : !isSeller || ordersSubTab === 'purchases' ? (
              purchasesList.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 p-8 space-y-3 shadow-xs">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                  <h3 className="text-sm font-black text-gray-900">
                    Vous n'avez pas encore passé de commande
                  </h3>
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
                <>
                  {purchasesList.map((ord) => renderOrderCard(ord, 'buyer'))}
                  {renderPagination(purchasesPage, purchasesTotalPages, setPurchasesPage)}
                </>
              )
            ) : salesList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 p-8 space-y-3 shadow-xs">
                <Store className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-sm font-black text-gray-900">Aucune vente pour le moment</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Vos commandes reçues en tant que vendeur apparaîtront ici dès qu'un acheteur commandera l'un de vos articles.
                </p>
              </div>
            ) : (
              <>
                {salesList.map((ord) => renderOrderCard(ord, 'seller'))}
                {renderPagination(salesPage, salesTotalPages, setSalesPage)}
              </>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 2 : MES ANNONCES (STRICTEMENT RÉSERVÉ AUX VENDEURS) */}
        {currentTab === 'listings' && isSeller && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Chargement de vos annonces...
              </div>
            ) : listingsList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 p-8 space-y-3 shadow-xs">
                <Tag className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-sm font-black text-gray-900">Aucune annonce publiée</h3>
                <Link
                  to="/sell"
                  className="inline-block px-5 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-sm shadow-purple-700/20"
                >
                  Publier un article
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listingsList.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden flex flex-col hover:border-purple-200 transition-colors"
                    >
                      <div className="relative h-44 bg-gray-100">
                        <img
                          src={
                            formatImageUrl(prod.primaryImage || prod.images?.[0]) ||
                            '/placeholder-product.svg'
                          }
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          {renderProductStatusBadge(prod.status)}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 truncate">
                            {prod.categoryName} • {prod.locationCity}
                          </p>
                          <h4 className="text-sm font-black text-gray-900 truncate mt-0.5">
                            {prod.title}
                          </h4>
                          <p className="text-sm font-black text-purple-700 mt-1">
                            {prod.price.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            {prod.viewCount || 0} vues
                          </span>
                          <Link
                            to={`/products/${prod.id}`}
                            className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-800"
                          >
                            <span>Voir l'annonce</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(listingsPage, listingsTotalPages, setListingsPage)}
              </>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 3 : MES ÉVALUATIONS (STRICTEMENT RÉSERVÉ AUX VENDEURS) */}
        {currentTab === 'reviews' && isSeller && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-amber-800 leading-none">
                    {reviewsTotal > 0 ? sellerAverageRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 mt-0.5">sur 5</span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(sellerAverageRating) && reviewsTotal > 0
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    {reviewsTotal > 0
                      ? `Note moyenne : ${sellerAverageRating.toFixed(1)} / 5`
                      : 'Aucune évaluation reçue pour le moment'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Basée sur <strong>{reviewsTotal}</strong> avis d'acheteurs vérifiés
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Chargement de vos évaluations...
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-150 p-8 space-y-2 shadow-xs">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-black text-gray-900">Aucun avis reçu</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Les évaluations laissées par vos acheteurs après réception de leurs commandes apparaîtront ici.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              formatImageUrl(rev.reviewerAvatar) ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                rev.reviewerName || 'Acheteur'
                              )}&background=7c3aed&color=fff`
                            }
                            alt={rev.reviewerName}
                            className="w-9 h-9 rounded-full object-cover border border-purple-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">
                              {rev.reviewerName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-[11px] font-black text-amber-800 ml-1">
                            {rev.rating}/5
                          </span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-gray-600 leading-relaxed pl-12">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {renderPagination(reviewsPage, reviewsTotalPages, setReviewsPage)}
              </>
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
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <ProfileAvatarUpload
              currentImageUrl={editProfilePic}
              previewUrl={photoPreviewUrl}
              selectedFile={selectedPhotoFile}
              fullName={`${editFirstName} ${editLastName}`.trim() || user?.fullName}
              error={photoError}
              uploading={uploadingPhoto}
              disabled={profileSaving}
              isMarkedForRemoval={photoMarkedForRemoval}
              onFileSelect={handleSelectPhotoFile}
              onClearSelectedFile={handleClearSelectedPhoto}
              onRemoveCurrentPhoto={handleRemoveCurrentPhoto}
              onValidationError={(msg) => setPhotoError(msg)}
              inputRef={photoInputRef}
            />

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
                disabled={profileSaving || uploadingPhoto}
                className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {uploadingPhoto
                  ? 'Téléversement de la photo...'
                  : profileSaving
                  ? 'Enregistrement...'
                  : 'Enregistrer mes coordonnées'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
