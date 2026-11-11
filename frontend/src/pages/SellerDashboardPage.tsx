import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sellerApi,
  categoryApi,
  chatOfferApi,
  SellerDashboard,
  SellerProfile,
  SellerTransaction,
} from '../services/api';
import { Product, Order, Review, Category, ChatOffer } from '../types';
import { SellerSidebar, SellerTabType } from '../components/seller/SellerSidebar';
import { SellerOverviewTab } from '../components/seller/SellerOverviewTab';
import { SellerListingsTab } from '../components/seller/SellerListingsTab';
import { SellerOrdersTab } from '../components/seller/SellerOrdersTab';
import { SellerFinancesTab } from '../components/seller/SellerFinancesTab';
import { SellerReviewsTab } from '../components/seller/SellerReviewsTab';
import { SellerProfileTab } from '../components/seller/SellerProfileTab';
import { SellerProductModal } from '../components/seller/SellerProductModal';

export const SellerDashboardPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [, setSellerOffers] = useState<ChatOffer[]>([]);

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
  });
  const [profileUpdating, setProfileUpdating] = useState(false);

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
    try {
      const nextStatus = prod.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      await sellerApi.updateProduct(prod.id, { status: nextStatus });
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors du changement de statut.");
    }
  };

  const handleDeleteProduct = async (prodId: number) => {
    if (!confirm('Supprimer définitivement cet article ?')) return;
    try {
      await sellerApi.deleteProduct(prodId);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la suppression.");
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

  const handleReportReview = async (reviewId: number) => {
    const reason = prompt("Raison du signalement de cet avis (inapproprié, diffamatoire...) :");
    if (!reason) return;
    try {
      await sellerApi.reportReview(reviewId, { reason: 'ABUSIVE_BEHAVIOR', details: reason });
      alert("Avis signalé avec succès à l'administration.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors du signalement.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileUpdating(true);
      await sellerApi.updateProfile({
        city: profileForm.city,
        address: profileForm.address,
      });
      alert("Profil boutique mis à jour avec succès !");
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la mise à jour du profil.");
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row text-slate-800">
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
      <main className="flex-1 p-6 sm:p-10 space-y-6 overflow-y-auto max-h-screen">
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
    </div>
  );
};
