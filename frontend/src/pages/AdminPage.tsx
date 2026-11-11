import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi, categoryApi } from '../services/api';
import {
  AdminDashboard,
  User,
  Product,
  Category,
  Order,
  AdminPayment,
  PlatformSettings,
  AdminActionLog,
  AdminUserDetail,
  ProductStatus,
  OrderStatus,
  DeliveryStatus,
  ReportStatus,
  PaymentMethod
} from '../types';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import {
  Users,
  ShoppingBag,
  CreditCard,
  Truck,
  AlertTriangle,
  Search,
  CheckCircle,
  Ban,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Eye,
  Filter,
  Settings,
  Store,
  X,
  Edit2,
  Trash2,
  History,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText
} from 'lucide-react';
import { AdminContentManager } from '../components/admin/AdminContentManager';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  type TabType = 'kpi' | 'products' | 'categories' | 'users' | 'orders' | 'payments' | 'reports' | 'settings' | 'content';
  const activeTab = (searchParams.get('tab') as TabType) || 'kpi';
  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  // State: Dashboard
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  // State: Users (Pagination & Filters)
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN' | 'SELLER'>('ALL');
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // State: Products (Pagination & Filters)
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('ALL');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [productViewMode, setProductViewMode] = useState<'all' | 'stores'>('all');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // State: Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Sparkles');

  // State: Orders & Deliveries (Pagination & Filters)
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotalElements, setOrderTotalElements] = useState(0);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<DeliveryStatus>('PENDING');
  const [deliveryNote, setDeliveryNote] = useState('');

  // State: Payments & Escrow (Pagination & Filters)
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentTotalElements, setPaymentTotalElements] = useState(0);

  // State: Reports & Disputes (Pagination & Filters)
  const [reports, setReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<string>('ALL');
  const [reportPage, setReportPage] = useState(0);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportTotalElements, setReportTotalElements] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportAction, setReportAction] = useState<string>('NONE');
  const [reportStatusChoice, setReportStatusChoice] = useState<ReportStatus>('RESOLVED');
  const [reportAdminNotes, setReportAdminNotes] = useState('');

  // State: Platform Settings & Audit (Point 4 & 11)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [validationFeeRate, setValidationFeeRate] = useState<number>(1);
  const [offerValidityHours, setOfferValidityHours] = useState<number>(24);
  const [reservationDurationHours, setReservationDurationHours] = useState<number>(24);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [platformName, setPlatformName] = useState('ReVibe FliP');
  const [supportEmail, setSupportEmail] = useState('contact@revibeflip.com');
  const [supportPhone, setSupportPhone] = useState('+221770000000');
  const [currency, setCurrency] = useState('FCFA');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalElements, setAuditTotalElements] = useState(0);

  // Modal Consultation Discussion en lecture seule (Audit & Litiges)
  const [auditConversationModal, setAuditConversationModal] = useState<{
    isOpen: boolean;
    data: any | null;
    loading: boolean;
  }>({
    isOpen: false,
    data: null,
    loading: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Safe arrays to prevent undefined crashes and white pages
  const safeUsers = Array.isArray(users) ? users : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];

  // Dynamic rates (Point 4)
  const activeCommissionRate = (platformSettings?.commissionRate ?? 20) / 100;
  const activeValidationRate = (platformSettings?.validationFeeRate ?? 1) / 100;

  // Fetch functions (with server-side pagination)
  const fetchDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      if (res.data?.data) setDashboard(res.data.data);
    } catch (e) {
      console.error('Error fetching dashboard', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const params: any = { page: userPage, size: 10 };
      if (userSearch) params.query = userSearch;
      if (userFilter === 'ACTIVE') params.isSuspended = false;
      if (userFilter === 'SUSPENDED') params.isSuspended = true;
      if (userFilter === 'ADMIN') params.role = 'ROLE_ADMIN';
      if (userFilter === 'SELLER') params.role = 'ROLE_USER';

      const res = await adminApi.getUsers(params);
      if (res.data?.data) {
        const raw = res.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setUsers(list);
        setUserTotalPages(raw.totalPages ?? 1);
        setUserTotalElements(raw.totalElements ?? list.length);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error('Error fetching users', e);
      setUsers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const params: any = { page: productPage, size: 10 };
      if (productSearch) params.query = productSearch;
      if (productStatusFilter !== 'ALL') params.status = productStatusFilter;
      if (productCategoryFilter !== 'ALL') params.categoryId = Number(productCategoryFilter);

      const res = await adminApi.getProducts(params);
      if (res.data?.data) {
        const raw = res.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setProducts(list);
        setProductTotalPages(raw.totalPages ?? 1);
        setProductTotalElements(raw.totalElements ?? list.length);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error('Error fetching products', e);
      setProducts([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      if (res.data?.data) {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setCategories(list);
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.error('Error fetching categories', e);
      setCategories([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const params: any = { page: orderPage, size: 10 };
      if (orderSearch) params.query = orderSearch;
      if (orderStatusFilter !== 'ALL') params.status = orderStatusFilter;

      const res = await adminApi.getOrders(params);
      if (res.data?.data) {
        const raw = res.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setOrders(list);
        setOrderTotalPages(raw.totalPages ?? 1);
        setOrderTotalElements(raw.totalElements ?? list.length);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('Error fetching orders', e);
      setOrders([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const params: any = { page: paymentPage, size: 10 };
      if (paymentSearch) params.query = paymentSearch;
      if (paymentMethodFilter !== 'ALL') params.method = paymentMethodFilter;

      const res = await adminApi.getPayments(params);
      if (res.data?.data) {
        const raw = res.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setPayments(list);
        setPaymentTotalPages(raw.totalPages ?? 1);
        setPaymentTotalElements(raw.totalElements ?? list.length);
      } else {
        setPayments([]);
      }
    } catch (e) {
      console.error('Error fetching payments', e);
      setPayments([]);
    }
  };

  const fetchReports = async () => {
    try {
      const params: any = { page: reportPage, size: 10 };
      if (reportFilter !== 'ALL') params.status = reportFilter;

      const res = await adminApi.getReports(params);
      if (res.data?.data) {
        const raw = res.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setReports(list);
        setReportTotalPages(raw.totalPages ?? 1);
        setReportTotalElements(raw.totalElements ?? list.length);
      } else {
        setReports([]);
      }
    } catch (e) {
      console.error('Error fetching reports', e);
      setReports([]);
    }
  };

  const fetchSettingsAndAudit = async () => {
    try {
      const [settingsRes, auditRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getAuditLogs({ page: auditPage, size: 15 })
      ]);
      if (settingsRes.data?.data) {
        const s = settingsRes.data.data;
        setPlatformSettings(s);
        setCommissionRate(s.commissionRate);
        setValidationFeeRate(s.validationFeeRate);
        if (s.offerValidityHours) setOfferValidityHours(s.offerValidityHours);
        if (s.reservationDurationHours) setReservationDurationHours(s.reservationDurationHours);
        if (s.demoMode !== undefined) setDemoMode(s.demoMode);
        setPlatformName(s.platformName);
        setSupportEmail(s.supportEmail);
        setSupportPhone(s.supportPhone);
        setCurrency(s.currency);
      }
      if (auditRes.data?.data) {
        const raw = auditRes.data.data as any;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw.content) ? raw.content : []);
        setAuditLogs(list);
        setAuditTotalPages(raw.totalPages ?? 1);
        setAuditTotalElements(raw.totalElements ?? list.length);
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      console.error('Error fetching settings/audit', e);
      setAuditLogs([]);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboard(),
      fetchUsers(),
      fetchProducts(),
      fetchCategories(),
      fetchOrders(),
      fetchPayments(),
      fetchReports(),
      fetchSettingsAndAudit()
    ]);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      refreshAll();
    }
  }, [isAdmin]);

  // Triggers on page/filter change
  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [userSearch, userFilter, userPage]);

  useEffect(() => {
    if (isAdmin) fetchProducts();
  }, [productSearch, productStatusFilter, productCategoryFilter, productPage]);

  useEffect(() => {
    if (isAdmin) fetchOrders();
  }, [orderSearch, orderStatusFilter, orderPage]);

  useEffect(() => {
    if (isAdmin) fetchPayments();
  }, [paymentSearch, paymentMethodFilter, paymentPage]);

  useEffect(() => {
    if (isAdmin) fetchReports();
  }, [reportFilter, reportPage]);

  useEffect(() => {
    if (isAdmin) fetchSettingsAndAudit();
  }, [auditPage]);

  // Actions: User Management (with Guard-rails handling)
  const handleToggleSuspend = async (userId: number, currentStatus: boolean) => {
    try {
      await adminApi.toggleSuspend(userId, !currentStatus);
      await fetchUsers();
      await fetchDashboard();
      if (selectedUserDetail && selectedUserDetail.user.id === userId) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          user: { ...selectedUserDetail.user, isSuspended: !currentStatus }
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de la modification du statut utilisateur";
      alert(msg);
    }
  };

  const handleUpdateRole = async (userId: number, currentRole: 'ROLE_USER' | 'ROLE_ADMIN') => {
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    if (!confirm(`Voulez-vous vraiment changer le rôle de cet utilisateur vers ${newRole} ?`)) return;
    try {
      await adminApi.updateUserRole(userId, newRole);
      await fetchUsers();
      if (selectedUserDetail && selectedUserDetail.user.id === userId) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          user: { ...selectedUserDetail.user, role: newRole }
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors du changement de rôle";
      alert(msg);
    }
  };

  const handleViewUserDetail = async (userId: number) => {
    setLoadingUserDetail(true);
    try {
      const res = await adminApi.getUserDetails(userId);
      if (res.data?.data) {
        setSelectedUserDetail(res.data.data);
      }
    } catch (err) {
      alert("Impossible de charger les détails de l'utilisateur");
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Actions: Product Management
  const handleProductStatus = async (productId: number, newStatus: string) => {
    try {
      await adminApi.setProductStatus(productId, newStatus);
      await fetchProducts();
      await fetchDashboard();
      if (selectedProductDetail && selectedProductDetail.id === productId) {
        setSelectedProductDetail({ ...selectedProductDetail, status: newStatus as ProductStatus });
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut de l'annonce");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement cette annonce ? Cette action est irréversible.")) return;
    try {
      await adminApi.deleteProduct(productId);
      setSelectedProductDetail(null);
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      alert("Erreur lors de la suppression de l'annonce");
    }
  };

  // Actions: Categories
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatDesc(cat.description || '');
      setCatIcon(cat.icon || 'Sparkles');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatIcon('Sparkles');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    setActionLoading(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, {
          name: catName.trim(),
          slug: catSlug.trim().toLowerCase(),
          description: catDesc.trim(),
          icon: catIcon.trim()
        });
      } else {
        await adminApi.createCategory({
          name: catName.trim(),
          slug: catSlug.trim().toLowerCase(),
          description: catDesc.trim(),
          icon: catIcon.trim()
        });
      }
      setIsCategoryModalOpen(false);
      await fetchCategories();
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement de la catégorie");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
    try {
      await adminApi.deleteCategory(catId);
      await fetchCategories();
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || "Impossible de supprimer cette catégorie car elle contient des annonces.");
    }
  };

  // Actions: Orders & Delivery Tracking
  const handleOpenDeliveryModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    const curr = (order.delivery?.status || (order as any).deliveryStatus || 'PENDING') as DeliveryStatus;
    setNewDeliveryStatus(curr);
    setDeliveryNote('');
  };

  const handleSaveDeliveryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDelivery) return;
    setActionLoading(true);
    try {
      await adminApi.updateDeliveryStatus(selectedOrderForDelivery.id, newDeliveryStatus, deliveryNote);
      setSelectedOrderForDelivery(null);
      await fetchOrders();
      await fetchDashboard();
    } catch (err: any) {
      alert("Erreur lors de la mise à jour de l'étape de livraison");
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Reports & Disputes
  const handleOpenReportModal = (rep: any) => {
    setSelectedReport(rep);
    setReportAction('NONE');
    setReportStatusChoice('RESOLVED');
    setReportAdminNotes('');
  };

  const handleSaveReportResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await adminApi.resolveReport(selectedReport.id, {
        status: reportStatusChoice,
        action: reportAction,
        adminNotes: reportAdminNotes
      });
      setSelectedReport(null);
      await fetchReports();
      await fetchDashboard();
      await fetchProducts();
      await fetchUsers();
    } catch (err: any) {
      alert("Erreur lors du traitement du litige");
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Platform Settings (Point 4)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminApi.updateSettings({
        commissionRate: Number(commissionRate),
        validationFeeRate: Number(validationFeeRate),
        offerValidityHours: Number(offerValidityHours),
        reservationDurationHours: Number(reservationDurationHours),
        demoMode: Boolean(demoMode),
        platformName,
        supportEmail,
        supportPhone,
        currency
      });
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 4000);
      await fetchSettingsAndAudit();
      await fetchDashboard();
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Pagination Controls Component (Point 5)
  const renderPagination = (currentPage: number, totalPages: number, totalElements: number, onPageChange: (p: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
        <span className="text-gray-500 font-medium">
          Total : <strong className="text-gray-900">{totalElements}</strong> élément(s) • Page {currentPage + 1} sur {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-bold text-purple-700 bg-purple-50 rounded-lg">
            {currentPage + 1}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Check sales trends data (Point 2)
  const salesTrends = dashboard?.salesTrends || [];
  const total7DaysSales = salesTrends.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const maxTrendAmount = Math.max(...salesTrends.map((t) => t.amount), 10000);

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-150 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Accès Administrateur Restreint</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Cette interface de gestion back-office est strictement réservée aux comptes <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">ROLE_ADMIN</code>.
          </p>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Se connecter avec un compte admin</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col md:flex-row">
      {/* ==================================================== */}
      {/* 1. SIDEBAR ADMINISTRATEUR MODERNE (COULEUR MAUVE & BLANC) */}
      {/* ==================================================== */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200/80 p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Logo Marketplace */}
          <div className="flex items-center justify-between px-2">
            <Logo size="sm" />
            <span className="text-[10px] font-black tracking-widest uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('kpi')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'kpi'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Vue d'ensemble</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Annonces & Articles</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'products' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {productTotalElements}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>Rayons & Catégories</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'categories' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {categories.length}
              </span>
            </button>

            <div className="pt-3 pb-1 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
              Supervision
            </div>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Utilisateurs & Rôles</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'users' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {userTotalElements}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Truck className="w-4 h-4" />
                <span>Commandes & Livraisons</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'orders' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {orderTotalElements}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'payments'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>Paiements & Séquestre</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'payments' ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {paymentTotalElements}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'reports'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Litiges & Signalements</span>
              </span>
              {dashboard?.pendingReports && dashboard.pendingReports > 0 ? (
                <span className="text-[10px] bg-purple-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                  {dashboard.pendingReports}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres & Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === 'content'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Contenus & Pages</span>
            </button>
          </nav>
        </div>

        {/* Profil Admin connecté en bas de la sidebar (Avec redirection stricte vers /login lors du logout) */}
        <div className="pt-4 border-t border-gray-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.fullName || 'Administrateur'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.phone || 'ROLE_ADMIN'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all shrink-0"
              title="Déconnexion (Redirige vers l'écran de connexion)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. ZONE PRINCIPALE (BLANC ÉPURÉ, KPI ET CONTENU)     */}
      {/* ==================================================== */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen">
        {/* En-tête : Bonjour Admin + Bouton Actualiser */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Bonjour, {user?.firstName || 'Admin'}
            </h1>
          </div>

          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-purple-600 hover:text-purple-700 transition-all shadow-2xs self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-700' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* ONGLET 1 : VUE D'ENSEMBLE (DASHBOARD & STATISTIQUES)  */}
        {/* ==================================================== */}
        {activeTab === 'kpi' && (
          <div className="space-y-8 animate-fadeIn">
            {/* LIGNE 1 : CARTES KPI BLANCHES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte 1 : Annonces */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Annonces & Articles
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{dashboard?.totalProducts || 0}</span>
                  <span className="text-xs text-gray-500 font-medium">publiées</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold pt-1">
                  <span className="text-emerald-600">● {dashboard?.activeProducts || 0} dispo</span>
                  <span className="text-purple-600">● {dashboard?.soldProducts || 0} vendues</span>
                  <span className="text-gray-400">● {dashboard?.inactiveProducts || 0} inactives</span>
                </div>
              </div>

              {/* Carte 2 : Utilisateurs (Point 1 : Bug corrigé) */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Utilisateurs inscrits
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{dashboard?.totalUsers || 0}</span>
                  <span className="text-xs text-gray-500 font-medium">comptes</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold pt-1">
                  <span className="text-emerald-600">● {dashboard?.activeUsers || 0} actifs</span>
                  <span className="text-purple-700">● {dashboard?.inactiveUsers || 0} suspendus</span>
                </div>
              </div>

              {/* Carte 3 : Commandes */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Commandes Escrow
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{dashboard?.totalOrders || 0}</span>
                  <span className="text-xs text-gray-500 font-medium">traitées</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 pt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Séquestre sécurisé 100%
                </div>
              </div>

              {/* Carte 4 : Signalements */}
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Signalements & Litiges
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{dashboard?.pendingReports || 0}</span>
                  <span className="text-xs text-gray-500 font-medium">en attente</span>
                </div>
                <div className="text-[11px] font-bold pt-1">
                  {(dashboard?.pendingReports || 0) > 0 ? (
                    <span className="text-purple-700">● Nécessite modération</span>
                  ) : (
                    <span className="text-emerald-600">● Aucun litige en cours</span>
                  )}
                </div>
              </div>
            </div>

            {/* LIGNE 2 : FINANCES & COMMISSIONS DYNAMIQUES (Point 4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500">Chiffre d'Affaires Transactions</span>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">
                    {formatPrice(dashboard?.totalTransactionsAmount || 0)}
                  </h3>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    {dashboard?.totalTransactions || 0} transaction(s) enregistrée(s)
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-lg border border-purple-100">
                  FCFA
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    Commissions Plateforme ({platformSettings?.commissionRate || 20}%)
                  </span>
                  <h3 className="text-2xl font-black text-purple-700 mt-1">
                    {formatPrice(dashboard?.totalCommissions || 0)}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">
                    Rémunération ReVibe FliP
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xl border border-purple-100">
                  %
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    Frais de Validation Séquestre ({platformSettings?.validationFeeRate || 1}%)
                  </span>
                  <h3 className="text-2xl font-black text-indigo-700 mt-1">
                    {formatPrice(dashboard?.totalValidationFees || 0)}
                  </h3>
                  <span className="text-[11px] text-indigo-600 font-bold mt-0.5 block">
                    Protection anti-fraude acheteur
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xl border border-indigo-100">
                  🛡️
                </div>
              </div>
            </div>

            {/* LIGNE 3 : ANALYTIQUES ET TENDANCES (Point 2 : Graphique corrigé) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top des rayons les plus demandés */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Top 5 des Rayons les plus demandés
                  </h3>
                  <span className="text-xs text-purple-700 font-bold">Par volume d'annonces</span>
                </div>

                <div className="space-y-4 pt-2">
                  {dashboard?.topCategories && dashboard.topCategories.length > 0 ? (
                    dashboard.topCategories.map((cat, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs font-bold text-gray-700">
                        <div className="flex justify-between items-center">
                          <span>{cat.name}</span>
                          <span className="text-gray-500 text-[11px]">{cat.productCount} articles ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-purple-700 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">Aucune donnée de catégorie disponible.</p>
                  )}
                </div>
              </div>

              {/* Répartition des paiements (Wave, Orange Money, Free Money) */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Moyens de Paiement au Sénégal
                  </h3>
                  <span className="text-xs text-purple-700 font-bold">Wave, OM, Free Money</span>
                </div>

                <div className="space-y-4 pt-2">
                  {dashboard?.paymentDistributions && dashboard.paymentDistributions.length > 0 ? (
                    dashboard.paymentDistributions.map((pm, idx) => {
                      const colorClass =
                        pm.paymentMethod.includes('Wave') ? 'bg-sky-500' :
                        pm.paymentMethod.includes('Orange') ? 'bg-amber-500' : 'bg-purple-600';

                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-150 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                            <div>
                              <p className="text-xs font-black text-gray-900">{pm.paymentMethod}</p>
                              <p className="text-[11px] text-gray-500">{pm.count} transaction(s)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-purple-700">{formatPrice(pm.totalAmount)}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{pm.percentage}% du volume</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">Aucune transaction enregistrée.</p>
                  )}
                </div>
              </div>

              {/* Point 2 : Graphique des tendances des 7 derniers jours (garantissant toujours l'affichage des 7 jours) */}
              <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                      Tendances des Ventes (7 derniers jours)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Montant cumulé journalier des commandes passées</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {total7DaysSales === 0 && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        Aucune vente sur les 7 derniers jours
                      </span>
                    )}
                    <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
                      Devise : FCFA
                    </span>
                  </div>
                </div>

                {salesTrends.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl border border-gray-200/60">
                    Aucune vente sur les 7 derniers jours
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 items-end min-h-[160px]">
                    {salesTrends.map((trend, idx) => {
                      const heightPercent = trend.amount > 0
                        ? Math.min(100, Math.max(16, Math.round((trend.amount / maxTrendAmount) * 100)))
                        : 8;

                      return (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <span className={`text-[10px] font-bold truncate max-w-full ${trend.amount > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                            {trend.amount > 0 ? `${Math.round(trend.amount / 1000)}k` : '0 FCFA'}
                          </span>
                          <div className="w-full bg-purple-50 rounded-2xl h-28 flex items-end p-1 overflow-hidden">
                            <div
                              className={`w-full rounded-xl transition-all duration-500 ${trend.amount > 0 ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-200'}`}
                              style={{ height: `${heightPercent}%` }}
                              title={`${trend.label} : ${formatPrice(trend.amount)} (${trend.orderCount} commandes)`}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-600">{trend.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 2 : GESTION DES ANNONCES & ARTICLES (PAGINÉ)  */}
        {/* ==================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Gestion des Annonces</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductViewMode('all')}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                      productViewMode === 'all'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Toutes les annonces ({productTotalElements})
                  </button>
                  <button
                    onClick={() => setProductViewMode('stores')}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                      productViewMode === 'stores'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Par boutique
                  </button>
                </div>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setProductPage(0); }}
                    placeholder="Rechercher par titre, marque ou vendeur..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <select
                  value={productStatusFilter}
                  onChange={(e) => { setProductStatusFilter(e.target.value); setProductPage(0); }}
                  className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIVE">Disponibles (ACTIVE)</option>
                  <option value="SOLD">Vendues (SOLD)</option>
                  <option value="INACTIVE">Désactivées (INACTIVE)</option>
                  <option value="DRAFT">Brouillons (DRAFT)</option>
                </select>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(0); }}
                  className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="ALL">Tous les rayons</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* VUE 1 : TOUTES LES ANNONCES AVEC VIGNETTES ÉLÉGANTES */}
              {productViewMode === 'all' && (
                <div className="divide-y divide-gray-100">
                  {safeProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      Aucune annonce correspondant aux critères de recherche.
                    </div>
                  ) : (
                    safeProducts.map((p) => {
                      const imageSrc =
                        p.primaryImage ||
                        (p.images && p.images[0]) ||
                        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80';
                      // Point 4 : Calcul dynamique de la commission
                      const commission = Math.round((p.price || 0) * activeCommissionRate);
                      const netSeller = (p.price || 0) - commission;

                      return (
                        <div
                          key={p.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={imageSrc}
                              alt={p.title || 'Produit'}
                              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-200 shadow-2xs"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-gray-900 truncate">{p.title || 'Annonce sans titre'}</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {p.locationCity || 'Dakar'} • Vendeur : <strong className="text-gray-700">{p.seller?.fullName || p.seller?.firstName || 'Vendeur'}</strong> • Rayon : {p.categoryName || 'Mode'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : p.status === 'SOLD'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {p.status}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {p.conditionLabel || p.condition}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold justify-between sm:justify-end shrink-0">
                            <div className="text-right">
                              <span className="text-purple-700 block font-black">{formatPrice(p.price)}</span>
                              <span className="text-[10px] text-emerald-600 block">Com. ({platformSettings?.commissionRate || 20}%) : {formatPrice(commission)}</span>
                              <span className="text-[10px] text-gray-400 block font-normal">Gain vendeur : {formatPrice(netSeller)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedProductDetail(p)}
                                className="p-2 rounded-xl text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                                title="Voir le détail de l'annonce"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleProductStatus(p.id, p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                  p.status === 'ACTIVE'
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Supprimer l'annonce"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {renderPagination(productPage, productTotalPages, productTotalElements, setProductPage)}
                </div>
              )}

              {/* VUE 2 : PAR BOUTIQUE / VENDEUR */}
              {productViewMode === 'stores' && (
                <div className="divide-y divide-gray-100">
                  {safeUsers.filter(u => u && u.role !== 'ROLE_ADMIN').length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      Aucune boutique enregistrée.
                    </div>
                  ) : (
                    safeUsers.filter(u => u && u.role !== 'ROLE_ADMIN').map((seller) => (
                      <div
                        key={seller.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                            {(seller.firstName || seller.fullName || 'V').charAt(0).toUpperCase()}{(seller.lastName?.charAt(0) || '')}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                              <span>Boutique {seller.fullName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Vendeur'}</span>
                              {seller.isSuspended ? (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Suspendue</span>
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">Active</span>
                              )}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {seller.city || 'Dakar'} • {seller.phone || 'Non renseigné'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold justify-between sm:justify-end">
                          <button
                            onClick={() => handleViewUserDetail(seller.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                          >
                            Voir Profil Vendeur
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 3 : GESTION DES RAYONS & CATÉGORIES          */}
        {/* ==================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Rayons & Catégories Marketplace</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Structurez le catalogue avec protection contre la suppression de catégories contenant des annonces
                  </p>
                </div>

                <button
                  onClick={() => handleOpenCategoryModal()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-all shadow-md shadow-purple-700/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouveau Rayon</span>
                </button>
              </div>

              {/* Grille des catégories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 hover:border-purple-200 hover:bg-purple-50/10 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Slug: {cat.slug}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Modifier ce rayon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer ce rayon (protégé)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-gray-900">{cat.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {cat.description || "Rayon officiel de seconde main ReVibe FliP."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 4 : UTILISATEURS & RÔLES (PAGINÉ)             */}
        {/* ==================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Utilisateurs & Permissions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Gérez les vendeurs, clients, suspensions et attribuez les accès ROLE_ADMIN (protégé contre l'auto-suspension)
                  </p>
                </div>

                {/* Filtres de statut utilisateur (Point 1 : Filtre cohérent) */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['ALL', 'ACTIVE', 'SUSPENDED', 'ADMIN', 'SELLER'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => { setUserFilter(filterKey); setUserPage(0); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        userFilter === filterKey
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filterKey === 'ALL' && `Tous (${userTotalElements})`}
                      {filterKey === 'ACTIVE' && 'Actifs'}
                      {filterKey === 'SUSPENDED' && 'Suspendus'}
                      {filterKey === 'ADMIN' && 'Admins'}
                      {filterKey === 'SELLER' && 'Vendeurs / Clients'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recherche */}
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                  placeholder="Rechercher par prénom, nom, téléphone (+221...)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                />
              </div>

              {/* Table Utilisateurs */}
              <div className="divide-y divide-gray-100">
                {safeUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    Aucun utilisateur trouvé.
                  </div>
                ) : (
                  safeUsers.map((u) => (
                    <div
                      key={u.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                          {(u.firstName || u.fullName || u.phone || 'U').charAt(0).toUpperCase()}{(u.lastName?.charAt(0) || '')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                            <span className="truncate">{u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phone}</span>
                            {u.role === 'ROLE_ADMIN' ? (
                              <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded-full font-black">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                MEMBRE
                              </span>
                            )}
                            {u.isSuspended ? (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                                Suspendu
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                Actif
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {u.phone || 'Sans numéro'} • {u.email || 'Pas d\'email'} • Ville : {u.city || 'Dakar'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                        <button
                          onClick={() => handleViewUserDetail(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                        >
                          Détails
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(u.id, !!u.isSuspended)}
                          className={`px-3 py-1.5 rounded-xl transition-colors ${
                            u.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                        </button>

                        <button
                          onClick={() => handleUpdateRole(u.id, u.role)}
                          className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 hover:text-purple-700 hover:bg-purple-50 border border-gray-200 transition-colors"
                          title="Changer le rôle"
                        >
                          {u.role === 'ROLE_ADMIN' ? 'Rétrograder USER' : 'Passer ADMIN'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {renderPagination(userPage, userTotalPages, userTotalElements, setUserPage)}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 5 : GESTION DES COMMANDES & LIVRAISONS (PAGINÉ)*/}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Commandes & Suivi</h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(0); }}
                    className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="ALL">Tous les statuts de commande</option>
                    <option value="PENDING_PAYMENT">En attente de paiement</option>
                    <option value="PAID_ESCROW_LOCKED">Payée (Séquestrée)</option>
                    <option value="SHIPPED">Expédiée</option>
                    <option value="DELIVERED">Livrée</option>
                    <option value="COMPLETED">Finalisée (Fonds libérés)</option>
                    <option value="CANCELLED">Annulée</option>
                  </select>
                </div>
              </div>

              {/* Recherche */}
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(0); }}
                  placeholder="Rechercher par numéro RF-2026-..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Table des commandes */}
              <div className="divide-y divide-gray-100">
                {safeOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    Aucune commande enregistrée.
                  </div>
                ) : (
                  safeOrders.map((o) => {
                    const currentDeliveryStatus = (o.delivery?.status || (o as any).deliveryStatus || 'PENDING') as DeliveryStatus;

                    return (
                      <div
                        key={o.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 font-black text-xs flex flex-col items-center justify-center shrink-0 border border-purple-100">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-gray-900">{o.orderNumber}</h4>
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              Acheteur : <strong>{o.buyer?.fullName}</strong> ({o.buyer?.phone}) • Vendeur : <strong>{o.seller?.fullName}</strong>
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              Produit : {o.productTitle} • Prix convenu : <strong className="text-purple-700">{formatPrice(o.agreedPrice || o.itemPrice)}</strong>
                              {o.originalPrice && o.agreedPrice && o.originalPrice !== o.agreedPrice && (
                                <span className="text-gray-400 line-through ml-1.5 font-normal">
                                  ({formatPrice(o.originalPrice)})
                                </span>
                              )}
                              {" "}• Étape livraison : <strong className="text-purple-700">{currentDeliveryStatus}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold justify-between sm:justify-end shrink-0">
                          <div className="text-right">
                            <span className="text-purple-700 block font-black">{formatPrice(o.totalAmount)}</span>
                            <span className="text-[10px] text-gray-400 block font-normal">
                              Com. : {formatPrice(o.platformCommission)} | Frais 1% : {formatPrice(o.validationFee)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenDeliveryModal(o)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs"
                          >
                            Mettre à jour livraison
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                {renderPagination(orderPage, orderTotalPages, orderTotalElements, setOrderPage)}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 6 : PAIEMENTS & SÉQUESTRE (PAGINÉ)           */}
        {/* ==================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Paiements & Séquestre</h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => { setPaymentMethodFilter(e.target.value); setPaymentPage(0); }}
                    className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="ALL">Tous les moyens de paiement</option>
                    <option value="WAVE">Wave</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="FREE_MONEY">Free Money</option>
                  </select>
                </div>
              </div>

              {/* Recherche */}
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => { setPaymentSearch(e.target.value); setPaymentPage(0); }}
                  placeholder="Rechercher par référence, n° commande, client..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Table Paiements épurée */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px] font-black">
                      <th className="py-3 px-3">Réf / Commande</th>
                      <th className="py-3 px-3">Moyen & Date</th>
                      <th className="py-3 px-3">Prix Article</th>
                      <th className="py-3 px-3">Total Payé</th>
                      <th className="py-3 px-3">Commission</th>
                      <th className="py-3 px-3">Net Vendeur</th>
                      <th className="py-3 px-3">Statut Séquestre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {safePayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Aucune transaction trouvée.
                        </td>
                      </tr>
                    ) : (
                      safePayments.map((p) => (
                        <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-gray-900 block">{p.transactionReference}</span>
                            <span className="text-[10px] text-gray-400 block">{p.orderNumber}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-purple-700 block">{p.paymentMethodName || p.paymentMethod}</span>
                            <span className="text-[10px] text-gray-400 block">{formatDate(p.createdAt)}</span>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-gray-800">{formatPrice(p.itemPrice)}</td>
                          <td className="py-3.5 px-3 font-black text-gray-900">{formatPrice(p.totalAmount)}</td>
                          <td className="py-3.5 px-3 font-bold text-purple-700">{formatPrice(p.platformCommission)}</td>
                          <td className="py-3.5 px-3 font-bold text-emerald-600">{formatPrice(p.sellerPayout)}</td>
                          <td className="py-3.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.escrowStatus || 'LOCKED'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(paymentPage, paymentTotalPages, paymentTotalElements, setPaymentPage)}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 7 : LITIGES & SIGNALEMENTS (PAGINÉ)          */}
        {/* ==================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Signalements & Litiges</h3>
                </div>

                <div className="flex items-center gap-2">
                  {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => { setReportFilter(st); setReportPage(0); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        reportFilter === st
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st === 'ALL' && `Tous (${reportTotalElements})`}
                      {st === 'PENDING' && 'En attente'}
                      {st === 'RESOLVED' && 'Résolus'}
                      {st === 'DISMISSED' && 'Rejetés'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des signalements */}
              <div className="divide-y divide-gray-100">
                {safeReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    Aucun signalement dans cette section.
                  </div>
                ) : (
                  safeReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                            {rep.reasonLabel || rep.reason || 'Autre'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rep.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {rep.status || 'PENDING'}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-gray-900">
                          {rep.details || "Aucun commentaire fourni."}
                        </p>

                        <p className="text-[11px] text-gray-500">
                          Signalé par : <strong>{rep.reporter?.fullName || rep.reporter?.firstName || 'Utilisateur'}</strong> • Cible :{' '}
                          {rep.reportedProduct ? (
                            <strong className="text-purple-700">Annonce: {rep.reportedProduct.title || 'Article'}</strong>
                          ) : rep.reportedUser ? (
                            <strong className="text-purple-700">Utilisateur: {rep.reportedUser.fullName || rep.reportedUser.firstName || 'Profil'}</strong>
                          ) : (
                            'Contenu non spécifié'
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleOpenReportModal(rep)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs"
                        >
                          Traiter le litige
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {renderPagination(reportPage, reportTotalPages, reportTotalElements, setReportPage)}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 8 : PARAMÈTRES & AUDIT DU SYSTÈME (PAGINÉ)    */}
        {/* ==================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Formulaire des paramètres de la plateforme (Point 4) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">Paramètres de la Plateforme</h3>
              </div>

              {settingsSavedMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Paramètres enregistrés avec succès. Tous les calculs ont été actualisés.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Commission Plateforme (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Actuellement appliqué : {platformSettings?.commissionRate || 20}% sur chaque vente</p>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Frais de Validation Séquestre (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={validationFeeRate}
                    onChange={(e) => setValidationFeeRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Actuellement appliqué : {platformSettings?.validationFeeRate || 1}% pour la garantie Escrow</p>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Validité de l'offre directe chat (heures)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={offerValidityHours}
                    onChange={(e) => setOfferValidityHours(parseInt(e.target.value) || 24)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Délai d'acceptation de l'offre (défaut : 24h)</p>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Durée de réservation d'article (heures)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={reservationDurationHours}
                    onChange={(e) => setReservationDurationHours(parseInt(e.target.value) || 24)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Temps accordé pour payer après acceptation avant remise en vente (défaut : 24h)</p>
                </div>

                <div className="flex items-center gap-3 md:col-span-2 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <input
                    type="checkbox"
                    id="demoModeCheck"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="demoModeCheck" className="text-xs font-bold text-gray-800 cursor-pointer">
                    Activer le Mode Démonstration (affiche le bandeau informatif "aucun argent réel n'est prélevé")
                  </label>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Nom de la Marketplace
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Devise
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Email Support
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">
                    Téléphone Support (+221...)
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-2xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-all shadow-md shadow-purple-700/20 disabled:opacity-50"
                  >
                    Enregistrer les Paramètres
                  </button>
                </div>
              </form>
            </div>

            {/* Journal d'audit admin paginé (Point 7 & 11) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-700" />
                    <span>Journal d'Audit des Actions Administrateur</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Traçabilité complète des suspensions, modifications de statut, violations de sécurité bloquées et suppressions
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {safeAuditLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Aucune action d'audit enregistrée pour le moment.
                  </div>
                ) : (
                  safeAuditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className={`font-black mr-2 px-2 py-0.5 rounded-md border text-[11px] ${
                          log.actionType.includes('SECURITY')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {log.actionType}
                        </span>
                        <span className="text-gray-800 font-medium">{log.details}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 text-right shrink-0">
                        {log.adminName} • {formatDate(log.createdAt)}
                      </div>
                    </div>
                  ))
                )}
                {renderPagination(auditPage, auditTotalPages, auditTotalElements, setAuditPage)}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ONGLET 9 : CONTENUS, PAGES CMS, FAQ & FOOTER         */}
        {/* ==================================================== */}
        {activeTab === 'content' && (
          <div className="animate-fadeIn">
            <AdminContentManager />
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODALE 1 : DÉTAIL D'UN UTILISATEUR                   */}
      {/* ==================================================== */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-gray-150 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center border border-purple-200">
                  {(selectedUserDetail.user.firstName || selectedUserDetail.user.fullName || 'U').charAt(0).toUpperCase()}{(selectedUserDetail.user.lastName?.charAt(0) || '')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedUserDetail.user.fullName}</h3>
                  <p className="text-xs text-gray-500">{selectedUserDetail.user.phone} • {selectedUserDetail.user.role}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statistiques clés utilisateur */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Annonces</span>
                <span className="text-lg font-black text-gray-900">{selectedUserDetail.products.length}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Achats</span>
                <span className="text-lg font-black text-gray-900">{selectedUserDetail.purchases.length}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Ventes</span>
                <span className="text-lg font-black text-gray-900">{selectedUserDetail.sales.length}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/60">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Gains Nets</span>
                <span className="text-sm font-black text-purple-700">{formatPrice(selectedUserDetail.totalEarned)}</span>
              </div>
            </div>

            {/* Annonces publiées par cet utilisateur */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Articles publiés ({selectedUserDetail.products.length})
              </h4>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {selectedUserDetail.products.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">Aucun article publié par cet utilisateur.</p>
                ) : (
                  selectedUserDetail.products.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 truncate">{p.title}</span>
                      <span className="text-purple-700 font-black">{formatPrice(p.price)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALE 2 : DÉTAIL D'UNE ANNONCE                      */}
      {/* ==================================================== */}
      {selectedProductDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="text-base font-black text-gray-900 truncate">Détail de l'Annonce #{selectedProductDetail.id}</h3>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 items-start">
              <img
                src={selectedProductDetail.primaryImage || (selectedProductDetail.images && selectedProductDetail.images[0])}
                alt={selectedProductDetail.title}
                className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm shrink-0"
              />
              <div className="space-y-1 text-xs">
                <h4 className="font-black text-sm text-gray-900">{selectedProductDetail.title}</h4>
                <p className="text-purple-700 font-black text-base">{formatPrice(selectedProductDetail.price)}</p>
                <p className="text-gray-500">Vendeur : <strong>{selectedProductDetail.seller?.fullName}</strong></p>
                <p className="text-gray-500">Ville : {selectedProductDetail.locationCity}</p>
                <p className="text-gray-500">État : {selectedProductDetail.conditionLabel || selectedProductDetail.condition}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
              {selectedProductDetail.description || "Aucune description fournie."}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-150">
              <button
                onClick={() => handleDeleteProduct(selectedProductDetail.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Supprimer définitivement
              </button>

              <button
                onClick={() => handleProductStatus(selectedProductDetail.id, selectedProductDetail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800"
              >
                {selectedProductDetail.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALE 3 : AJOUTER / MODIFIER UN RAYON (CATÉGORIE)   */}
      {/* ==================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingCategory ? "Modifier le Rayon" : "Ajouter un Nouveau Rayon"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nom du rayon</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="Ex: Robes & Bazin"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Slug URL</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="robes-et-bazin"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Courte description de ce rayon..."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALE 4 : SUIVI DE LIVRAISON (5 ÉTAPES)             */}
      {/* ==================================================== */}
      {selectedOrderForDelivery && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Suivi Livraison {selectedOrderForDelivery.orderNumber}</h3>
                <p className="text-xs text-gray-500">Mettre à jour l'étape de livraison logistique</p>
              </div>
              <button
                onClick={() => setSelectedOrderForDelivery(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Étape de livraison</label>
                <select
                  value={newDeliveryStatus}
                  onChange={(e) => setNewDeliveryStatus(e.target.value as DeliveryStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="PENDING">1. En attente de prise en charge (PENDING)</option>
                  <option value="PICKED_UP">2. Colis pris en charge (PICKED_UP)</option>
                  <option value="IN_TRANSIT">3. En cours d'acheminement (IN_TRANSIT)</option>
                  <option value="OUT_FOR_DELIVERY">4. En cours de livraison (OUT_FOR_DELIVERY)</option>
                  <option value="DELIVERED">5. Livré au destinataire (DELIVERED)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Note de suivi / Observation</label>
                <textarea
                  rows={3}
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Ex: Livreur Abdoulaye en route, contact client établi..."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDelivery(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 disabled:opacity-50"
                >
                  Valider l'étape
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALE 5 : TRAITEMENT DE LITIGE / SIGNALEMENT        */}
      {/* ==================================================== */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Traitement du Signalement #{selectedReport.id}</h3>
                <p className="text-xs text-gray-500">Motif : {selectedReport.reasonLabel || selectedReport.reason}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReportResolution} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Action disciplinaire à exécuter</label>
                <select
                  value={reportAction}
                  onChange={(e) => setReportAction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="NONE">Aucune sanction (Clôturer le signalement)</option>
                  <option value="WARN">Avertir officiellement l'utilisateur</option>
                  <option value="DEACTIVATE_LISTING">Désactiver l'annonce signalée</option>
                  <option value="SUSPEND_USER">Suspendre le compte utilisateur</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Nouveau statut du signalement</label>
                <select
                  value={reportStatusChoice}
                  onChange={(e) => setReportStatusChoice(e.target.value as ReportStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="RESOLVED">RESOLVED (Litige résolu)</option>
                  <option value="DISMISSED">DISMISSED (Signalement non fondé)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5">Notes administratives</label>
                <textarea
                  rows={3}
                  value={reportAdminNotes}
                  onChange={(e) => setReportAdminNotes(e.target.value)}
                  placeholder="Précisez la motivation de la décision..."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 disabled:opacity-50"
                >
                  Appliquer la décision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* MODALE 6 : CONSULTATION DISCUSSION EN LECTURE SEULE  */}
      {/* ==================================================== */}
      {auditConversationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-gray-150 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Discussion Archivée (Lecture seule modérateur)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Consultation pour arbitrage de litige
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditConversationModal({ isOpen: false, data: null, loading: false })}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avertissement d'audit */}
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-150 text-[11px] text-purple-900 flex items-center gap-2 shrink-0">
              <History className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Traçabilité légale :</strong> Cette consultation est journalisée dans le journal d'audit administrateur avec votre identifiant et votre adresse IP.
              </span>
            </div>

            {auditConversationModal.loading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Chargement des messages de la discussion...
              </div>
            ) : auditConversationModal.data ? (
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl">
                {auditConversationModal.data.messages?.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Aucun message échangé.</p>
                ) : (
                  auditConversationModal.data.messages?.map((m: any) => (
                    <div key={m.id} className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <strong className="text-gray-800 font-bold">{m.senderName}</strong>
                        <span>{new Date(m.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" className="max-h-40 rounded-lg object-cover" />
                      )}
                      <p className="text-gray-700">{m.content}</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">
                Impossible de charger cette discussion.
              </div>
            )}

            <div className="pt-2 flex justify-end shrink-0">
              <button
                onClick={() => setAuditConversationModal({ isOpen: false, data: null, loading: false })}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
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
