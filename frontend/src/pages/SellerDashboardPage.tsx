/**
 * Page Tableau de Bord Vendeur ReVibe FliP
 * 
 * Centre de pilotage complet pour les vendeurs de la marketplace :
 *  * - Vue d'ensemble avec carte financière unifiée (solde séquestre, solde disponible, total)
 *  * - Bandeau compact des actions prioritaires à traiter immédiatement
 *  * - Onglets spécialisés : Annonces en vente, Commandes reçues, Finances/Retraits, Avis, Profil
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sellerApi,
  categoryApi,
  chatOfferApi,
  uploadApi,
  SellerDashboard,
  SellerProfile,
  SellerTransaction,
} from '../services/api';
import { validateProfileImageFile } from '../utils/profileImageValidation';
import { Product, Order, Review, Category, ChatOffer } from '../types';
import { SellerSidebar, SellerTabType } from '../components/seller/SellerSidebar';
import { SellerOverviewTab } from '../components/seller/SellerOverviewTab';
import { SellerListingsTab } from '../components/seller/SellerListingsTab';
import { SellerOrdersTab } from '../components/seller/SellerOrdersTab';
import { SellerOffersTab } from '../components/seller/SellerOffersTab';
import { SellerFinancesTab } from '../components/seller/SellerFinancesTab';
import { SellerReviewsTab } from '../components/seller/SellerReviewsTab';
import { SellerProfileTab } from '../components/seller/SellerProfileTab';
import { SellerProductModal } from '../components/seller/SellerProductModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<number | null>(null);
  const [reportReviewReason, setReportReviewReason] = useState('');
  const [reportingReview, setReportingReview] = useState(false);
  const [reportReviewError, setReportReviewError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeTab = (searchParams.get('tab') as SellerTabType) || 'overview';
  const setActiveTab = (tab: SellerTabType) => {
    setSearchParams({ tab });
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Période et auto-refresh
  const [period, setPeriod] = useState<string>('30d');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Data states
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilterStatus, setProductFilterStatus] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerOffers, setSellerOffers] = useState<ChatOffer[]>([]);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    categoryId: 0,
    price: '',
    condition: 'VERY_GOOD',
    description: '',
    brand: '',
    size: '',
    color: '',
    locationCity: 'Dakar',
    locationAddress: '',
    images: [''],
    status: 'ACTIVE',
  });

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    city: 'Dakar',
    phone: '',
    address: '',
    profilePicture: '',
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);
  const [profilePhotoMarkedForRemoval, setProfilePhotoMarkedForRemoval] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (profilePhotoPreviewUrl) {
        URL.revokeObjectURL(profilePhotoPreviewUrl);
      }
    };
  }, [profilePhotoPreviewUrl]);

  const handleSelectProfilePhoto = (file: File) => {
    if (profilePhotoPreviewUrl) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }
    setProfilePhotoError(null);
    setProfileError(null);
    setProfileSuccess(null);
    setProfilePhotoMarkedForRemoval(false);
    setSelectedProfilePhoto(file);
    setProfilePhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearProfilePhoto = () => {
    if (profilePhotoPreviewUrl) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }
    setSelectedProfilePhoto(null);
    setProfilePhotoPreviewUrl(null);
    setProfilePhotoError(null);
  };

  const handleRemoveCurrentProfilePhoto = () => {
    handleClearProfilePhoto();
    setProfilePhotoMarkedForRemoval(true);
    setProfilePhotoError(null);
  };

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const fetchDashboardOnly = async (p = period, from = customFrom, to = customTo) => {
    try {
      const res = await sellerApi.getDashboard({
        period: p,
        from: p === 'custom' && from ? from : undefined,
        to: p === 'custom' && to ? to : undefined,
      });
      if (res.data?.data) {
        setDashboard(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching seller dashboard', e);
    }
  };

  const loadAllData = async (p = period, from = customFrom, to = customTo) => {
    try {
      const [dashRes, profRes, prodsRes, ordsRes, transRes, revsRes, offersRes, catsRes] =
        await Promise.allSettled([
          sellerApi.getDashboard({
            period: p,
            from: p === 'custom' && from ? from : undefined,
            to: p === 'custom' && to ? to : undefined,
          }),
          sellerApi.getProfile(),
          sellerApi.getProducts({ page: 0, size: 50 }),
          sellerApi.getOrders({ page: 0, size: 50 }),
          sellerApi.getTransactions(),
          sellerApi.getReviews(),
          chatOfferApi.getSellerOffers(),
          categoryApi.getAll(),
        ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) {
        setDashboard(dashRes.value.data.data);
      }
      if (profRes.status === 'fulfilled' && profRes.value.data?.data) {
        const p = profRes.value.data.data;
        setProfile(p);
        setProfileForm({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          city: p.city || 'Dakar',
          phone: p.phone || '',
          address: p.address || '',
          profilePicture: p.profilePicture || p.profilePictureUrl || '',
        });
      }
      if (prodsRes.status === 'fulfilled' && prodsRes.value.data?.data?.content) {
        setProducts(prodsRes.value.data.data.content);
      }
      if (ordsRes.status === 'fulfilled' && ordsRes.value.data?.data?.content) {
        setOrders(ordsRes.value.data.data.content);
      }
      if (transRes.status === 'fulfilled') {
        const val = transRes.value.data?.data;
        if (Array.isArray(val)) {
          setTransactions(val);
        } else if ((val as any)?.content) {
          setTransactions((val as any).content);
        }
      }
      if (revsRes.status === 'fulfilled') {
        const val = revsRes.value.data?.data;
        if (Array.isArray(val)) {
          setReviews(val);
        } else if ((val as any)?.content) {
          setReviews((val as any).content);
        }
      }
      if (offersRes.status === 'fulfilled' && offersRes.value.data?.data) {
        setSellerOffers(offersRes.value.data.data);
      }
      if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
        setCategories(catsRes.value.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Actualisation automatique toutes les 2 minutes (désactivable)
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'overview' || !isAuthenticated) return;
    const interval = setInterval(() => {
      fetchDashboardOnly();
    }, 120_000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, isAuthenticated, period, customFrom, customTo]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchDashboardOnly(newPeriod, customFrom, customTo);
  };

  const handleApplyCustomDates = () => {
    fetchDashboardOnly('custom', customFrom, customTo);
  };

  const handleNavigateTab = (tab: string, filter?: string) => {
    setActiveTab(tab as SellerTabType);
    if (tab === 'listings' && filter) {
      setProductFilterStatus(filter);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      title: '',
      categoryId: categories[0]?.id || 1,
      price: '',
      condition: 'VERY_GOOD',
      description: '',
      brand: '',
      size: '',
      color: '',
      locationCity: user?.city || 'Dakar',
      locationAddress: '',
      images: [''],
      status: 'ACTIVE',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      title: prod.title,
      categoryId: (prod as any).categoryId || 1,
      price: String(prod.price),
      condition: prod.condition,
      description: prod.description || '',
      brand: prod.brand || '',
      size: prod.size || '',
      color: prod.color || '',
      locationCity: prod.locationCity || 'Dakar',
      locationAddress: '',
      images: prod.images || (prod.primaryImage ? [prod.primaryImage] : ['']),
      status: prod.status,
    });
    setShowProductModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price),
        categoryId: Number(productForm.categoryId),
        condition: productForm.condition,
        brand: productForm.brand,
        size: productForm.size,
        color: productForm.color,
        locationCity: productForm.locationCity,
        imageUrls: productForm.images.filter((img) => img.trim().length > 0),
      };

      if (editingProductId) {
        await sellerApi.updateProduct(editingProductId, payload);
      } else {
        await sellerApi.createProduct(payload);
      }
      setShowProductModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement de l'annonce.");
    }
  };

  const handleToggleProductStatus = async (prod: Product) => {
    setActionFeedback(null);
    try {
      const nextStatus = prod.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await sellerApi.toggleProductStatus(prod.id, nextStatus);
      setActionFeedback({
        type: 'success',
        message: nextStatus === 'INACTIVE' ? 'Annonce masquée avec succès.' : 'Annonce réactivée avec succès.',
      });
      loadAllData();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || "Erreur lors du changement de statut.",
      });
    }
  };

  const handleDeleteProduct = (prodId: number) => {
    setConfirmDeleteProdId(prodId);
  };

  const confirmDeleteProduct = async () => {
    if (confirmDeleteProdId === null) return;
    setDeletingProduct(true);
    try {
      await sellerApi.deleteProduct(confirmDeleteProdId);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingProduct(false);
      setConfirmDeleteProdId(null);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await sellerApi.acceptOrder(orderId);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'acceptation.");
    }
  };

  const handleRefuseOrder = async (orderId: number) => {
    const reason = prompt("Raison du refus de la commande :");
    if (!reason) return;
    try {
      await sellerApi.refuseOrder(orderId, reason);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors du refus.");
    }
  };

  const handleMarkReadyForPickup = async (orderId: number) => {
    try {
      await sellerApi.markReadyForPickup(orderId);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la mise à jour logistique.");
    }
  };

  const handleReportReview = (reviewId: number) => {
    setReportReviewId(reviewId);
    setReportReviewReason('');
    setReportReviewError(null);
  };

  const confirmReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportReviewId === null) return;
    const trimmedReason = reportReviewReason.trim();
    if (trimmedReason.length < 5) {
      setReportReviewError('Veuillez préciser la raison du signalement (au moins 5 caractères).');
      return;
    }
    setReportingReview(true);
    setReportReviewError(null);
    try {
      await sellerApi.reportReview(reportReviewId, { reason: 'ABUSIVE_BEHAVIOR', details: trimmedReason });
      setReportReviewId(null);
      setReportReviewReason('');
      setActionFeedback({
        type: 'success',
        message: "Avis signalé avec succès à l'administration.",
      });
    } catch (err: any) {
      setReportReviewError(err.response?.data?.message || "Erreur lors du signalement.");
    } finally {
      setReportingReview(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setProfilePhotoError(null);
    try {
      setProfileUpdating(true);
      let nextProfilePicture = profilePhotoMarkedForRemoval ? '' : profileForm.profilePicture.trim();

      if (selectedProfilePhoto) {
        const validation = validateProfileImageFile(selectedProfilePhoto);
        if (!validation.valid) {
          setProfilePhotoError(validation.error || 'Fichier invalide.');
          return;
        }
        setUploadingProfilePhoto(true);
        try {
          const uploadRes = await uploadApi.uploadFile(selectedProfilePhoto, 'avatars');
          if (!uploadRes.data?.data) {
            throw new Error("Le serveur n'a pas retourné l'URL de la photo téléversée.");
          }
          nextProfilePicture = uploadRes.data.data;
        } catch (uploadErr: any) {
          setProfilePhotoError(
            uploadErr?.response?.data?.message ||
              uploadErr?.message ||
              'Erreur lors du téléversement de la photo de profil.'
          );
          return;
        } finally {
          setUploadingProfilePhoto(false);
        }
      }

      const res = await sellerApi.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        city: profileForm.city.trim(),
        address: profileForm.address.trim(),
        profilePicture: nextProfilePicture,
      });

      const updatedSeller = res.data?.data;
      if (updatedSeller) {
        setProfile(updatedSeller);
        setProfileForm((prev) => ({
          ...prev,
          firstName: updatedSeller.firstName || prev.firstName,
          lastName: updatedSeller.lastName || prev.lastName,
          city: updatedSeller.city || '',
          address: updatedSeller.address || '',
          profilePicture: updatedSeller.profilePicture || '',
        }));
        if (user) {
          updateUser({
            ...user,
            firstName: updatedSeller.firstName || user.firstName,
            lastName: updatedSeller.lastName || user.lastName,
            fullName: updatedSeller.fullName || user.fullName,
            city: updatedSeller.city,
            address: updatedSeller.address,
            profilePicture: updatedSeller.profilePicture,
          });
        }
      }

      const hadNewPhoto = Boolean(selectedProfilePhoto);
      handleClearProfilePhoto();
      setProfilePhotoMarkedForRemoval(false);
      setProfileSuccess(
        hadNewPhoto
          ? 'Votre photo et votre profil boutique ont été mis à jour avec succès !'
          : 'Profil boutique mis à jour avec succès !'
      );
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-gray-400">
        Chargement de votre espace vendeur...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:block text-slate-800">
      {/* 1. Sidebar modulaire */}
      <SellerSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboard={dashboard}
        profile={profile}
        currentUser={user}
        onLogout={handleLogout}
      />

      {/* 2. Contenu principal par onglet */}
      <div className="lg:pl-72 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto space-y-6">
        {activeTab === 'overview' && (
          <SellerOverviewTab
            dashboard={dashboard}
            orders={orders}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAllData();
            }}
            onGoToOrders={() => setActiveTab('orders')}
            onAcceptOrder={handleAcceptOrder}
            formatPrice={formatPrice}
            currentUser={user}
            period={period}
            onPeriodChange={handlePeriodChange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            onApplyCustomDates={handleApplyCustomDates}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'listings' && (
          <SellerListingsTab
            products={products}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            productFilterStatus={productFilterStatus}
            setProductFilterStatus={setProductFilterStatus}
            onOpenCreateModal={handleOpenCreateProduct}
            onOpenEditModal={handleOpenEditProduct}
            onToggleStatus={handleToggleProductStatus}
            onDeleteProduct={handleDeleteProduct}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'offers' && (
          <SellerOffersTab
            offers={sellerOffers}
            onCancelOffer={async (offerId) => {
              try {
                await chatOfferApi.cancelOffer(offerId);
                await loadAllData();
              } catch (err: any) {
                alert(err?.response?.data?.message || "Impossible d'annuler l'offre.");
              }
            }}
            onOpenConversation={(conversationId) => navigate(`/messages?id=${conversationId}`)}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'orders' && (
          <SellerOrdersTab
            orders={orders}
            onAcceptOrder={handleAcceptOrder}
            onOpenRefuseModal={handleRefuseOrder}
            onMarkReadyForPickup={handleMarkReadyForPickup}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'finances' && (
          <SellerFinancesTab
            dashboard={dashboard}
            transactions={transactions}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'reviews' && (
          <SellerReviewsTab
            reviews={reviews}
            onOpenReportModal={handleReportReview}
          />
        )}

        {activeTab === 'profile' && (
          <SellerProfileTab
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            selectedPhotoFile={selectedProfilePhoto}
            photoPreviewUrl={profilePhotoPreviewUrl}
            photoMarkedForRemoval={profilePhotoMarkedForRemoval}
            photoError={profilePhotoError}
            uploadingPhoto={uploadingProfilePhoto}
            profileSuccess={profileSuccess}
            profileError={profileError}
            onSelectPhotoFile={handleSelectProfilePhoto}
            onClearSelectedPhoto={handleClearProfilePhoto}
            onRemoveCurrentPhoto={handleRemoveCurrentProfilePhoto}
            onPhotoValidationError={(msg) => setProfilePhotoError(msg)}
            onSubmit={handleUpdateProfile}
            updating={profileUpdating}
          />
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-xs text-center space-y-3">
            <h3 className="text-base font-black text-gray-900">Messagerie Acheteurs</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Retrouvez l'ensemble de vos discussions et négociations dans l'interface complète de messagerie.
            </p>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="px-5 py-2.5 rounded-2xl bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-700/20 cursor-pointer"
            >
              Ouvrir la messagerie ReVibe FliP
            </button>
          </div>
        )}
        </main>
      </div>

      {/* 3. Modale Produit */}
      <SellerProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        isEditing={Boolean(editingProductId)}
        categories={categories}
        productForm={productForm}
        setProductForm={setProductForm}
        onSubmit={handleSubmitProduct}
        formatPrice={formatPrice}
      />

      <ConfirmModal
        isOpen={confirmDeleteProdId !== null}
        title="Supprimer définitivement cet article ?"
        message="Cette annonce sera définitivement retirée de votre dressing et ne pourra plus être récupérée."
        confirmLabel="Supprimer"
        variant="danger"
        loading={deletingProduct}
        onCancel={() => {
          if (!deletingProduct) setConfirmDeleteProdId(null);
        }}
        onConfirm={confirmDeleteProduct}
      />

      {/* Modale Signalement Avis au design ReVibe FliP */}
      {reportReviewId !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form
            onSubmit={confirmReportReview}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-snug">Signaler cet avis</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Notre équipe de modération examinera votre demande.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!reportingReview) setReportReviewId(null);
                }}
                disabled={reportingReview}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="report-review-reason" className="block text-xs font-bold text-gray-700">
                Raison du signalement (inapproprié, diffamatoire, hors sujet…)
              </label>
              <textarea
                id="report-review-reason"
                rows={4}
                value={reportReviewReason}
                onChange={(e) => {
                  setReportReviewReason(e.target.value);
                  if (reportReviewError) setReportReviewError(null);
                }}
                placeholder="Décrivez brièvement pourquoi cet avis vous semble abusif..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/60 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-purple-700 focus:ring-2 focus:ring-purple-700/10 resize-none"
                disabled={reportingReview}
                autoFocus
              />
              {reportReviewError && (
                <p className="text-xs font-semibold text-rose-600">{reportReviewError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setReportReviewId(null)}
                disabled={reportingReview}
                className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={reportingReview}
                className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {reportingReview ? 'Envoi en cours…' : "Signaler l'avis"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bandeau feedback non-bloquant (remplace alert() natif) */}
      {actionFeedback && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fadeIn">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="flex-1">{actionFeedback.message}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
