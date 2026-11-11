import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sellerApi,
  categoryApi,
  chatOfferApi,
  SellerDashboard,
  SellerProfile,
  SellerTransaction,
  SellerTransactionSummary
} from '../services/api';
import { Product, Order, Review, Category, ChatOffer } from '../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  Star,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Search,
  Filter,
  AlertTriangle,
  MessageSquare,
  User as UserIcon,
  Send,
  Camera,
  X,
  RefreshCw,
  Info,
  Tag,
  Handshake,
  ExternalLink,
  Sparkles,
  Edit2,
  MapPin
} from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  type TabType = 'overview' | 'listings' | 'offers' | 'orders' | 'finances' | 'reviews' | 'messages' | 'profile';
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';
  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Data states
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productFilterStatus, setProductFilterStatus] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<SellerTransactionSummary | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerOffers, setSellerOffers] = useState<ChatOffer[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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
    status: 'ACTIVE'
  });

  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refusingOrderId, setRefusingOrderId] = useState<number | null>(null);
  const [refuseReason, setRefuseReason] = useState('');

  const [showReportReviewModal, setShowReportReviewModal] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('Commentaire mensonger ou diffamatoire');
  const [reportDetails, setReportDetails] = useState('');

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    address: '',
    profilePictureUrl: ''
  });

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatPrice = (amount: number | undefined) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, profRes, catRes] = await Promise.all([
        sellerApi.getDashboard().catch(() => ({ data: { data: null } })),
        sellerApi.getProfile().catch(() => ({ data: { data: null } })),
        categoryApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      if (dashRes.data?.data) setDashboard(dashRes.data.data);
      if (profRes.data?.data) {
        setProfile(profRes.data.data);
        setProfileForm({
          firstName: profRes.data.data.firstName || '',
          lastName: profRes.data.data.lastName || '',
          email: profRes.data.data.email || '',
          city: profRes.data.data.city || '',
          address: profRes.data.data.address || '',
          profilePictureUrl: profRes.data.data.profilePictureUrl || ''
        });
      }
      if (catRes.data?.data) setCategories(catRes.data.data);

      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadSellerOffers(),
        loadFinances(),
        loadReviews(),
        loadConversations()
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProducts = async () => {
    try {
      const status = productFilterStatus === 'ALL' ? undefined : productFilterStatus;
      const res = await sellerApi.getProducts({
        query: productSearch || undefined,
        status,
        page: productPage,
        size: 10
      });
      if (res.data?.data) {
        setProducts(res.data.data.content || []);
        setProductTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    try {
      const status = orderFilterStatus === 'ALL' ? undefined : orderFilterStatus;
      const res = await sellerApi.getOrders({
        query: orderSearch || undefined,
        status,
        page: orderPage,
        size: 10
      });
      if (res.data?.data) {
        setOrders(res.data.data.content || []);
        setOrderTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFinances = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        sellerApi.getTransactions({ page: 0, size: 20 }),
        sellerApi.getTransactionSummary()
      ]);
      if (txRes.data?.data) setTransactions(txRes.data.data.content || []);
      if (sumRes.data?.data) setTransactionSummary(sumRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await sellerApi.getReviews({ page: 0, size: 20 });
      if (res.data?.data) setReviews(res.data.data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSellerOffers = async () => {
    try {
      const res = await chatOfferApi.getSellerOffers();
      if (res.data?.data) setSellerOffers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await sellerApi.getConversations();
      if (res.data?.data) {
        setConversations(res.data.data);
        if (res.data.data.length > 0 && !activeConversationId) {
          selectConversation(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (conversationId: number) => {
    setActiveConversationId(conversationId);
    try {
      const res = await sellerApi.getConversationMessages(conversationId);
      if (res.data?.data) setConversationMessages(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingMessage || !activeConversationId || !chatInput.trim()) return;
    const textToSend = chatInput.trim();
    setIsSendingMessage(true);
    setChatInput(''); // Effacer immédiatement l'input pour éviter tout double-clic ou double-envoi
    try {
      const res = await sellerApi.sendMessage(activeConversationId, textToSend);
      if (res.data?.data) {
        setConversationMessages(prev => {
          if (prev.some(m => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      setChatInput(textToSend); // Restaurer le texte en cas d'erreur
      showToast("Erreur lors de l'envoi du message", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Rafraîchissement automatique de la messagerie vendeur (toutes les 3s pour voir les réponses de l'acheteur)
  useEffect(() => {
    if (activeTab === 'messages' && activeConversationId) {
      const timer = setInterval(async () => {
        try {
          const res = await sellerApi.getConversationMessages(activeConversationId);
          if (res.data?.data) {
            setConversationMessages(res.data.data);
          }
        } catch (err) {
          // ignore background polling errors
        }
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [activeTab, activeConversationId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAllData();
  }, [isAuthenticated]);

  useEffect(() => {
    loadProducts();
  }, [productPage, productFilterStatus, productSearch]);

  useEffect(() => {
    loadOrders();
  }, [orderPage, orderFilterStatus, orderSearch]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Product actions
  const handleToggleProductStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await sellerApi.toggleProductStatus(id, nextStatus);
      showToast(`Annonce passée à ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`);
      loadProducts();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors du changement de statut", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?")) return;
    try {
      await sellerApi.deleteProduct(id);
      showToast("Annonce supprimée avec succès");
      loadProducts();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Suppression impossible (commande en cours)", "error");
    }
  };

  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm({
      title: '',
      categoryId: categories[0]?.id || 0,
      price: '',
      condition: 'VERY_GOOD',
      description: '',
      brand: '',
      size: '',
      color: '',
      locationCity: profile?.city || 'Dakar',
      locationAddress: profile?.address || '',
      images: [''],
      status: 'ACTIVE'
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      title: p.title || '',
      categoryId: p.categoryId || categories[0]?.id || 0,
      price: String(p.price || ''),
      condition: p.condition || 'VERY_GOOD',
      description: p.description || '',
      brand: p.brand || '',
      size: p.size || '',
      color: p.color || '',
      locationCity: p.locationCity || 'Dakar',
      locationAddress: '',
      images: p.images && p.images.length > 0 ? p.images : [p.primaryImage || ''],
      status: p.status || 'ACTIVE'
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: productForm.title,
        categoryId: Number(productForm.categoryId),
        price: Number(productForm.price),
        condition: productForm.condition,
        description: productForm.description,
        brand: productForm.brand || undefined,
        size: productForm.size || undefined,
        color: productForm.color || undefined,
        locationCity: productForm.locationCity,
        locationAddress: productForm.locationAddress || undefined,
        imageUrls: productForm.images.filter(img => img.trim().length > 0),
        status: productForm.status
      };

      if (editingProductId) {
        await sellerApi.updateProduct(editingProductId, payload);
        showToast("Annonce modifiée avec succès");
      } else {
        await sellerApi.createProduct(payload);
        showToast("Annonce publiée avec succès");
      }
      setShowProductModal(false);
      setEditingProductId(null);
      loadProducts();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement de l'annonce", "error");
    }
  };

  // Order actions
  const handleAcceptOrder = async (orderId: number) => {
    try {
      await sellerApi.acceptOrder(orderId);
      showToast("Commande acceptée avec succès ! Préparez le colis.");
      loadOrders();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors de l'acceptation", "error");
    }
  };

  const handleRefuseOrderConfirm = async () => {
    if (!refusingOrderId) return;
    try {
      await sellerApi.refuseOrder(refusingOrderId, refuseReason);
      showToast("Commande refusée. Le remboursement acheteur a été ordonné.");
      setShowRefuseModal(false);
      setRefusingOrderId(null);
      setRefuseReason('');
      loadOrders();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors du refus", "error");
    }
  };

  const handleMarkReadyForPickup = async (orderId: number) => {
    try {
      await sellerApi.markReadyForPickup(orderId);
      showToast("Colis marqué comme préparé / remis pour la livraison !");
      loadOrders();
      sellerApi.getDashboard().then(res => res.data?.data && setDashboard(res.data.data));
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors de la mise à jour logistique", "error");
    }
  };

  // Review report
  const handleReportReviewConfirm = async () => {
    if (!reportingReviewId) return;
    try {
      await sellerApi.reportReview(reportingReviewId, {
        reason: reportReason,
        details: reportDetails
      });
      showToast("Avis signalé avec succès à l'administration ReVibe FliP.");
      setShowReportReviewModal(false);
      setReportingReviewId(null);
      setReportDetails('');
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors du signalement", "error");
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await sellerApi.updateProfile(profileForm);
      if (res.data?.data) {
        setProfile(res.data.data);
        showToast("Profil vendeur mis à jour avec succès.");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erreur lors de la mise à jour du profil", "error");
    }
  };

  // Dynamic commission rates calculation preview
  const enteredPrice = Number(productForm.price) || 0;
  const activeCommissionRate = (dashboard?.commissionRate || 20) / 100;
  const estimatedCommission = Math.round(enteredPrice * activeCommissionRate);
  const estimatedNetEarnings = Math.max(0, enteredPrice - estimatedCommission);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Chargement de votre Espace Vendeur...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans text-gray-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-bold transition-all transform animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white'
              : 'bg-purple-900 text-white'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. SIDEBAR VENDEUR (BLANC ÉPURÉ, PAS DE VITRINE)    */}
      {/* ==================================================== */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-150 p-6 flex flex-col justify-between shrink-0 shadow-xs">
        <div className="space-y-8">
          {/* Logo & Espace Vendeur */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-700/20">
              RF
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight">ReVibe FliP</h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Espace Vendeur
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
                {dashboard?.totalProducts || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'offers'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <Tag className="w-4 h-4" />
                <span>Offres en cours</span>
              </span>
              {sellerOffers.filter((o) => o.status === 'OFFER_SENT').length > 0 ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  {sellerOffers.filter((o) => o.status === 'OFFER_SENT').length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
              onClick={() => setActiveTab('finances')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
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

        {/* Profil Vendeur en bas avec Déconnexion redirigeant vers /login */}
        <div className="pt-6 border-t border-gray-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                {profile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || 'V'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {profile?.fullName || user?.fullName || 'Vendeur Certifié'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {profile?.phone || user?.phone || '+221'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all shrink-0"
              title="Déconnexion (Redirige vers l'écran de connexion)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. CONTENU PRINCIPAL (ÉPURÉ, CONTEXTUEL PAR ONGLET) */}
      {/* ==================================================== */}
      <main className="flex-1 p-6 sm:p-10 space-y-6 overflow-y-auto max-h-screen">
        {/* ==================================================== */}
        {/* ONGLET 1 : VUE D'ENSEMBLE (TABLEAU DE BORD)          */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tableau de bord</h1>
                <p className="text-xs text-gray-400 mt-0.5">Aperçu global de votre activité</p>
              </div>
              <button
                onClick={() => {
                  setRefreshing(true);
                  loadAllData();
                }}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
            {/* Ligne 1 : Cartes KPI principales (Fond blanc, cartes douces) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes Annonces</span>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">{dashboard?.totalProducts || 0}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                    <span className="text-purple-700">{dashboard?.activeProducts || 0} en vente</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{dashboard?.soldProducts || 0} vendues</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Commandes</span>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">{dashboard?.ordersToProcess || 0}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                    <span className="text-purple-700">{dashboard?.ordersInDelivery || 0} en cours</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{dashboard?.ordersToProcess || 0} à traiter</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gains Nets</span>
                  <h3 className="text-2xl font-black text-purple-700 mt-1">
                    {formatPrice(dashboard?.netEarnings)}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    Total : {formatPrice(dashboard?.turnover)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Note Vendeur</span>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    ★ {dashboard?.averageRating?.toFixed(1) || '5.0'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {dashboard?.totalReviews || 0} avis
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
              </div>
            </div>

            {/* Dernières Commandes reçues */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Commandes récentes à préparer
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800"
                >
                  Voir tout →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucune commande récente. Vos futures ventes apparaîtront ici.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-100">
                          📦
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 truncate">
                            {order.orderNumber} • {order.items && order.items.length > 1 ? `${order.items.length} articles (${order.items.map(i => i.productTitle).slice(0, 2).join(', ')})` : (order.productTitle || 'Article')}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {order.buyer?.fullName || 'Client'} • {order.deliveryModeLabel || order.deliveryMode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-black text-purple-700">{formatPrice(order.sellerPayout)}</p>
                          <span className="text-[10px] font-bold text-gray-400">
                            {order.status === 'PAID_ESCROW_LOCKED' ? 'Payé' : order.status}
                          </span>
                        </div>

                        {order.status === 'PAID_ESCROW_LOCKED' && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-all shadow-2xs"
                          >
                            Accepter
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 2 : MES ANNONCES                              */}
        {/* ==================================================== */}
        {activeTab === 'listings' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mes Annonces</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700">
                  {products.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductPage(0);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-700"
                  />
                </div>

                <button
                  onClick={handleOpenCreateProduct}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-700/20 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publier un article</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-150 shadow-xs space-y-4">
              {/* Filtres par statut */}
              <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                {[
                  { id: 'ALL', label: 'Toutes' },
                  { id: 'ACTIVE', label: 'En vente' },
                  { id: 'RESERVED', label: 'Réservées' },
                  { id: 'SOLD', label: 'Vendues' },
                  { id: 'INACTIVE', label: 'Désactivées' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setProductFilterStatus(st.id);
                      setProductPage(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      productFilterStatus === st.id
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Grille / Liste épurée des annonces */}
              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                  <Package className="w-8 h-8 text-gray-300 mx-auto" />
                  <p>Aucune annonce trouvée.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {products.map((p) => {
                    const imageSrc =
                      p.primaryImage ||
                      (p.images && p.images[0]) ||
                      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80';
                    const comm = Math.round((p.price || 0) * activeCommissionRate);
                    const net = (p.price || 0) - comm;

                    const isReserved = p.status === 'RESERVED';
                    const isActive = p.status === 'ACTIVE';
                    const isSold = p.status === 'SOLD';

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl border border-gray-150 hover:border-purple-200 bg-white transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imageSrc}
                            alt={p.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-gray-900 truncate max-w-[200px] sm:max-w-xs">{p.title}</h4>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isReserved
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : isSold
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isActive ? 'En vente' : isReserved ? 'Réservé' : isSold ? 'Vendu' : p.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                              {p.categoryName || 'Mode'} • {p.locationCity || 'Dakar'} • {p.conditionLabel || p.condition}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-xs text-gray-900 block">{formatPrice(p.price)}</span>
                            <span className="text-[10px] text-emerald-600 font-bold block">{formatPrice(net)} net</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {!isSold && (
                              <button
                                onClick={() => handleToggleProductStatus(p.id, p.status)}
                                className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title={p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                              >
                                {p.status === 'ACTIVE' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 3 : OFFRES DIRECTES                           */}
        {/* ==================================================== */}
        {activeTab === 'offers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-700" />
                <span>Offres Directes ({sellerOffers.length})</span>
              </h3>

              <button
                onClick={loadSellerOffers}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            {sellerOffers.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs space-y-1">
                <Tag className="w-8 h-8 text-gray-300 mx-auto" />
                <p>Aucune offre directe en cours.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sellerOffers.map((offer) => {
                  const isSent = offer.status === 'OFFER_SENT';
                  const isAccepted = offer.status === 'OFFER_ACCEPTED';
                  const isDeclined = offer.status === 'OFFER_DECLINED';
                  const isCancelled = offer.status === 'OFFER_CANCELLED';

                  return (
                    <div
                      key={offer.id}
                      className="p-4 rounded-2xl border border-gray-150 bg-white transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              offer.productImageUrl ||
                              'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=150&q=80'
                            }
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-gray-900">{offer.productTitle}</h4>
                            <p className="text-[11px] text-gray-400">
                              Acheteur : <strong className="text-gray-700">{offer.buyerName}</strong>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSent
                              ? 'bg-purple-100 text-purple-800'
                              : isAccepted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDeclined
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isSent
                            ? 'En attente'
                            : isAccepted
                            ? 'Acceptée'
                            : isDeclined
                            ? 'Refusée'
                            : isCancelled
                            ? 'Annulée'
                            : 'Expirée'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Prix initial</span>
                          <span className="text-gray-400 line-through text-[11px]">
                            {formatPrice(offer.initialPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Prix convenu</span>
                          <span className="font-black text-purple-700">
                            {formatPrice(offer.agreedPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Remise</span>
                          <span className="font-bold text-gray-700 text-[11px]">
                            {offer.deliveryMode === 'HOME_DELIVERY' ? 'Livraison' : 'Main propre'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] text-gray-400">
                          {offer.isExpired ? 'Expirée' : `Valable jusqu'au ${new Date(offer.expiresAt).toLocaleDateString('fr-FR')}`}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigate(`/messages?conversationId=${offer.conversationId}`);
                            }}
                            className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </button>

                          {isSent && (
                            <button
                              onClick={async () => {
                                if (confirm("Annuler cette offre ?")) {
                                  try {
                                    await chatOfferApi.cancelOffer(offer.id);
                                    loadSellerOffers();
                                  } catch (err: any) {
                                    alert(err.response?.data?.message || "Erreur annulation");
                                  }
                                }
                              }}
                              className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 4 : COMMANDES REÇUES                          */}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Commandes Reçues ({orders.length})
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="N° commande..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderPage(0);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                />
              </div>
            </div>

            {/* Filtres statuts */}
            <div className="flex flex-wrap gap-2 pt-1 border-b border-gray-100 pb-3">
              {['ALL', 'PAID_ESCROW_LOCKED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setOrderFilterStatus(st);
                    setOrderPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    orderFilterStatus === st
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st === 'ALL' ? 'Toutes' : st === 'PAID_ESCROW_LOCKED' ? 'À traiter' : st === 'CONFIRMED' ? 'Confirmées' : st === 'SHIPPED' ? 'En livraison' : st === 'DELIVERED' ? 'Livrées' : 'Annulées'}
                </button>
              ))}
            </div>

            {/* Table des commandes */}
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Aucune commande enregistrée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Commande</th>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">Acheteur</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Net</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3 px-3 font-bold text-gray-900">{o.orderNumber}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-800">{o.productTitle}</p>
                          <span className="text-[10px] text-gray-400">
                            {formatPrice(o.agreedPrice || o.itemPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{o.buyer?.fullName || o.deliveryPhone}</td>
                        <td className="py-3 px-3">
                          {o.deliveryStatus === 'PENDING' || !o.deliveryStatus ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>À préparer</span>
                            </span>
                          ) : o.deliveryStatus === 'PICKED_UP' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                              <Package className="w-3 h-3 text-purple-600" />
                              <span>Pris en charge</span>
                            </span>
                          ) : o.deliveryStatus === 'IN_TRANSIT' || o.deliveryStatus === 'OUT_FOR_DELIVERY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>En livraison</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Livré</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-black text-purple-700">{formatPrice(o.sellerPayout)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                            >
                              Détail
                            </button>

                            {o.status === 'PAID_ESCROW_LOCKED' && (!o.deliveryStatus || o.deliveryStatus === 'PENDING') && (
                              <>
                                <button
                                  onClick={() => handleAcceptOrder(o.id)}
                                  className="px-3 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() => {
                                    setRefusingOrderId(o.id);
                                    setShowRefuseModal(true);
                                  }}
                                  className="px-2 py-1 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs"
                                >
                                  Refuser
                                </button>
                              </>
                            )}

                            {o.deliveryStatus === 'PICKED_UP' && (
                              <button
                                onClick={() => handleMarkReadyForPickup(o.id)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Remis</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 5 : FINANCES & TRANSACTIONS                   */}
        {/* ==================================================== */}
        {activeTab === 'finances' && (
          <div className="space-y-5">
            {/* Synthèse 4 cartes épurées */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Volume Brut</span>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  {formatPrice(transactionSummary?.totalTurnover)}
                </h3>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Commissions</span>
                <h3 className="text-xl font-black text-gray-500 mt-1">
                  {formatPrice(transactionSummary?.totalCommissionPaid)}
                </h3>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Vendeur</span>
                <h3 className="text-xl font-black text-purple-700 mt-1">
                  {formatPrice(transactionSummary?.totalSellerPayout)}
                </h3>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Séquestre en cours</span>
                <h3 className="text-xl font-black text-amber-600 mt-1">
                  {formatPrice(transactionSummary?.pendingEscrowAmount)}
                </h3>
              </div>
            </div>

            {/* Tableau épuré des transactions (6 colonnes nettes) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Historique des transactions
              </h3>

              {transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucune transaction enregistrée.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-3">Commande</th>
                        <th className="py-2.5 px-3">Article</th>
                        <th className="py-2.5 px-3">Montant</th>
                        <th className="py-2.5 px-3">Commission</th>
                        <th className="py-2.5 px-3">Net Vendeur</th>
                        <th className="py-2.5 px-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold">
                      {transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/20">
                          <td className="py-3 px-3 text-gray-900 font-bold">{tx.orderNumber}</td>
                          <td className="py-3 px-3 text-gray-700">{tx.productTitle}</td>
                          <td className="py-3 px-3 text-gray-900">{formatPrice(tx.itemPrice)}</td>
                          <td className="py-3 px-3 text-gray-400">-{formatPrice(tx.platformCommission)}</td>
                          <td className="py-3 px-3 font-black text-purple-700">{formatPrice(tx.sellerPayout)}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.escrowStatus === 'RELEASED'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tx.escrowStatus === 'RELEASED' ? 'Versé' : 'Séquestre'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 6 : AVIS & ÉVALUATIONS                        */}
        {/* ==================================================== */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Avis Acheteurs ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Aucun avis reçu pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{rev.reviewerName || 'Acheteur'}</span>
                        <div className="flex items-center text-amber-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700">{rev.comment || 'Sans commentaire.'}</p>
                      <span className="text-[10px] text-gray-400 block">{new Date(rev.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <button
                      onClick={() => {
                        setReportingReviewId(rev.id);
                        setShowReportReviewModal(true);
                      }}
                      className="px-2.5 py-1 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Signaler</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 7 : MESSAGERIE TEMPS RÉEL                     */}
        {/* ==================================================== */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl border border-gray-150 shadow-xs h-[620px] flex overflow-hidden">
            {/* Volet gauche : Conversations */}
            <div className="w-80 border-r border-gray-150 flex flex-col bg-slate-50/50">
              <div className="p-3.5 border-b border-gray-150 bg-white">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Discussions ({conversations.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <p className="text-center py-12 text-gray-400 text-xs">Aucune conversation.</p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                        activeConversationId === conv.id ? 'bg-purple-50/80 border-l-4 border-purple-700' : 'hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                        {conv.buyerName?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-900 truncate">{conv.buyerName}</p>
                          <span className="text-[10px] text-gray-400">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-700 font-bold truncate">{conv.productTitle}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{conv.lastMessageSnippet || 'Message...'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Volet droit : Discussion active */}
            <div className="flex-1 flex flex-col bg-white">
              {activeConversationId ? (
                <>
                  <div className="p-3.5 border-b border-gray-150 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-gray-900">
                        {conversations.find(c => c.id === activeConversationId)?.buyerName || 'Acheteur'}
                      </h4>
                      <p className="text-[10px] text-purple-700 font-semibold truncate">
                        {conversations.find(c => c.id === activeConversationId)?.productTitle}
                      </p>
                    </div>
                    <Link
                      to={`/messages?conversationId=${activeConversationId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200"
                    >
                      <span>Ouvrir dans le chat complet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex-1 p-5 overflow-y-auto space-y-3">
                    {conversationMessages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl text-xs font-medium ${
                              isMe
                                ? 'bg-purple-700 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <span className={`text-[9px] block text-right mt-0.5 ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                              {new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-150 flex gap-2">
                    <input
                      type="text"
                      placeholder="Message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isSendingMessage}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !chatInput.trim()}
                      className="px-4 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingMessage ? '...' : 'Envoyer'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                  Sélectionnez une discussion à gauche.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 8 : MON PROFIL VENDEUR (DESIGN PRO PLEINE LARGEUR) */}
        {/* ==================================================== */}
        {activeTab === 'profile' && (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mon Profil Vendeur</h1>
            </div>

            {/* Bannière Pro Pleine Largeur */}
            <div className="w-full bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
              <div className="h-32 sm:h-36 bg-linear-to-r from-purple-800 via-indigo-700 to-purple-900 relative p-6 flex justify-between items-start">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-3.5 py-1 rounded-full border border-white/30 tracking-wide uppercase">
                  Vendeur Certifié ReVibe FliP
                </span>
                <span className="text-xs text-white/80 font-medium hidden sm:inline-block">
                  Compte Vendeur Pro
                </span>
              </div>

              <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                  <div className="relative">
                    <img
                      src={
                        profileForm.profilePictureUrl ||
                        profile?.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.fullName || 'Vendeur')}&background=7e22ce&color=fff&size=160`
                      }
                      alt="Avatar Vendeur"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-purple-100"
                    />
                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-500/20" title="Compte Actif" />
                  </div>

                  <div className="mb-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                        {profile?.fullName || `${profileForm.firstName} ${profileForm.lastName}`.trim() || 'Vendeur Pro'}
                      </h2>
                      <span className="bg-purple-100 text-purple-700 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        PRO
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{profileForm.city || 'Dakar'}, Sénégal</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">Identité vérifiée</span>
                    </p>
                  </div>
                </div>

                {/* 4 Chiffres Clés en Bandeau */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full md:w-auto">
                  <div className="px-3.5 py-2.5 bg-gray-50/80 rounded-2xl border border-gray-150 text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Annonces</span>
                    <span className="text-base font-black text-gray-900">{dashboard?.totalProducts || 0}</span>
                  </div>
                  <div className="px-3.5 py-2.5 bg-gray-50/80 rounded-2xl border border-gray-150 text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Ventes</span>
                    <span className="text-base font-black text-gray-900">{dashboard?.soldProducts || profile?.soldListingsCount || 0}</span>
                  </div>
                  <div className="px-3.5 py-2.5 bg-gray-50/80 rounded-2xl border border-gray-150 text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Note</span>
                    <span className="text-base font-black text-amber-500">★ {dashboard?.averageRating?.toFixed(1) || '5.0'}</span>
                  </div>
                  <div className="px-3.5 py-2.5 bg-purple-50/60 rounded-2xl border border-purple-150 text-center">
                    <span className="text-[10px] text-purple-600 font-bold uppercase block tracking-wider">Gains nets</span>
                    <span className="text-sm font-black text-purple-700">{(dashboard?.netEarnings || 0).toLocaleString('fr-FR')} F</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grille Pleine Largeur 2 Colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* Colonne Gauche : Formulaire Coordonnées */}
              <form onSubmit={handleUpdateProfile} className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-5">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">
                    Coordonnées du compte
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Prénom</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Nom</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600">Adresse Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Ville principale</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                      placeholder="Dakar, Thiès..."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Quartier / Adresse de remise</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                      placeholder="Mermoz, Plateau, Almadies..."
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-md shadow-purple-700/20 active:scale-98"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>

              {/* Colonne Droite : Photo & Badges */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">
                    Photo de profil
                  </h3>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Lien direct de l'image (URL)</label>
                    <input
                      type="url"
                      value={profileForm.profilePictureUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, profilePictureUrl: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-purple-700 focus:bg-white transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-2">Ou choisir un avatar :</span>
                    <div className="flex items-center gap-2.5">
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces',
                      ].map((avatarUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, profilePictureUrl: avatarUrl })}
                          className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                            profileForm.profilePictureUrl === avatarUrl ? 'border-purple-700 ring-2 ring-purple-300' : 'border-gray-200 hover:border-purple-400'
                          }`}
                        >
                          <img src={avatarUrl} alt="Avatar suggestion" className="w-full h-full object-cover rounded-xl" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50/60 rounded-3xl p-6 border border-purple-100 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-purple-800 font-black text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Statut : Vendeur Recommandé</span>
                  </div>
                  <p className="text-[11px] text-purple-900/80 leading-relaxed">
                    Votre profil et vos coordonnées sont protégés. Vos acheteurs voient uniquement votre prénom, votre ville et votre évaluation générale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL CRÉATION / ÉDITION D'UNE ANNONCE               */}
      {/* ==================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-150 pb-4">
              <h3 className="text-base font-black text-gray-900">
                {editingProductId ? "Modifier l'annonce" : "Publier un nouvel article"}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase">Titre de l'annonce *</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                  placeholder="Ex : Grand Boubou Getzner brodé 3 pièces"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Rayon / Catégorie *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}
                    className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Prix demandé (FCFA) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                    placeholder="35000"
                    required
                  />
                </div>
              </div>

              {/* Estimateur automatique dynamique du gain net */}
              {enteredPrice > 0 && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>Commission plateforme (20%) : -{formatPrice(estimatedCommission)}</span>
                  <span className="text-purple-700 font-black">Votre Gain Net : {formatPrice(estimatedNetEarnings)}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase">État de l'article *</label>
                <select
                  value={productForm.condition}
                  onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                >
                  <option value="NEW_WITH_TAG">Neuf avec étiquette</option>
                  <option value="VERY_GOOD">Très bon état</option>
                  <option value="GOOD">Bon état</option>
                  <option value="SATISFACTORY">État satisfaisant</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Marque</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium"
                    placeholder="Woodin, Nike..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Taille</label>
                  <input
                    type="text"
                    value={productForm.size}
                    onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium"
                    placeholder="XL, 42..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase">Couleur</label>
                  <input
                    type="text"
                    value={productForm.color}
                    onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium"
                    placeholder="Bleu, Blanc..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase">URL Photo Principale</label>
                <input
                  type="url"
                  value={productForm.images[0] || ''}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase">Description complète *</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                  placeholder="Décrivez précisément votre article..."
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase">Statut de publication</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="status"
                      checked={productForm.status === 'ACTIVE'}
                      onChange={() => setProductForm({ ...productForm, status: 'ACTIVE' })}
                      className="text-purple-700 focus:ring-purple-700"
                    />
                    <span>Publier immédiatement (ACTIVE)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <input
                      type="radio"
                      name="status"
                      checked={productForm.status === 'DRAFT'}
                      onChange={() => setProductForm({ ...productForm, status: 'DRAFT' })}
                      className="text-purple-700 focus:ring-purple-700"
                    />
                    <span>Enregistrer comme brouillon (DRAFT)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-md shadow-purple-700/20"
                >
                  Enregistrer l'annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REFUS COMMANDE AVEC MOTIF */}
      {showRefuseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Motif de refus de la commande
            </h3>
            <p className="text-xs text-gray-500">
              Veuillez indiquer à l'acheteur la raison de l'annulation (ex : article déjà vendu, indisponibilité immédiate).
            </p>
            <textarea
              rows={3}
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
              placeholder="Raison du refus..."
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRefuseModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleRefuseOrderConfirm}
                className="px-5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 shadow-2xs"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIGNALEMENT AVIS ABUSIF */}
      {showReportReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Signaler un avis abusif aux modérateurs
            </h3>
            <p className="text-xs text-gray-500">
              Ce signalement sera examiné par l'équipe administrative de ReVibe FliP.
            </p>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">Motif principal</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium"
              >
                <option value="Commentaire mensonger ou diffamatoire">Commentaire mensonger ou diffamatoire</option>
                <option value="Propos injurieux ou harcèlement">Propos injurieux ou harcèlement</option>
                <option value="Chantage à l'évaluation">Chantage à l'évaluation</option>
                <option value="Autre motif légitime">Autre motif légitime</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">Détails justificatifs</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full mt-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-700"
                placeholder="Expliquez pourquoi cet avis est diffamatoire ou contraire aux règles..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReportReviewModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleReportReviewConfirm}
                className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 shadow-2xs"
              >
                Transmettre le litige
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL COMMANDE REÇUE */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-sm font-black text-gray-900">
                Commande {selectedOrderDetails.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-gray-900">{selectedOrderDetails.productTitle}</p>
                  <p className="text-[11px] text-gray-500">Prix article : {formatPrice(selectedOrderDetails.itemPrice)}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-purple-700 text-sm">{formatPrice(selectedOrderDetails.sellerPayout)}</span>
                  <span className="text-[10px] text-gray-400 block font-bold">Votre gain net (80%)</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <p className="font-bold text-gray-900">Coordonnées de l'acheteur :</p>
                <p className="text-gray-600">Nom : {selectedOrderDetails.buyer?.fullName || 'Client'}</p>
                <p className="text-gray-600">Téléphone de livraison : {selectedOrderDetails.deliveryPhone}</p>
                <p className="text-gray-600">Adresse : {selectedOrderDetails.deliveryAddress}, {selectedOrderDetails.deliveryCity}</p>
                <p className="text-gray-600">Mode : {selectedOrderDetails.deliveryModeLabel || selectedOrderDetails.deliveryMode}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-150">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardPage;
