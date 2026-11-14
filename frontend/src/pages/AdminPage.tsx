/**
 * Page d'Administration et Modération ReVibe FliP
 * 
 * Tableau de bord de gestion pour les administrateurs de la plateforme :
 *  * - Supervision globale de l'activité (KPIs en temps réel, volumes d'échanges)
 *  * - Modération des annonces signalées et gestion des comptes utilisateurs
 *  * - Gestion des catégories, paramètres de séquestre et litiges ouverts
 */

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
  DeliveryStatus,
  ReportStatus,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminSidebar, AdminTabType } from '../components/admin/AdminSidebar';
import { AdminKpiSection } from '../components/admin/AdminKpiSection';
import { AdminProductsSection } from '../components/admin/AdminProductsSection';
import { AdminCategoriesSection } from '../components/admin/AdminCategoriesSection';
import { AdminUsersSection } from '../components/admin/AdminUsersSection';
import { AdminOrdersSection } from '../components/admin/AdminOrdersSection';
import { AdminPaymentsSection } from '../components/admin/AdminPaymentsSection';
import { AdminReportsSection } from '../components/admin/AdminReportsSection';
import { AdminSettingsSection } from '../components/admin/AdminSettingsSection';
import { AdminAuditSection } from '../components/admin/AdminAuditSection';
import { AdminContentManager } from '../components/admin/AdminContentManager';
import { AdminModals } from '../components/admin/AdminModals';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = ((searchParams.get('tab') as AdminTabType) || 'kpi') as AdminTabType;
  const setActiveTab = (tab: AdminTabType) => {
    setSearchParams({ tab });
  };

  // State: Dashboard
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  // State: Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ADMIN' | 'SELLER'>('ALL');
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalElements, setUserTotalElements] = useState(0);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);

  // State: Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('ALL');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // State: Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // State: Orders & Deliveries
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderPage, setOrderPage] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotalElements, setOrderTotalElements] = useState(0);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<DeliveryStatus>('PENDING');
  const [deliveryNote, setDeliveryNote] = useState('');

  // State: Payments & Escrow
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentTotalElements, setPaymentTotalElements] = useState(0);

  // State: Reports & Disputes
  const [reports, setReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [reportPage, setReportPage] = useState(0);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportTotalElements, setReportTotalElements] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportAction, setReportAction] = useState<string>('NONE');
  const [reportStatusChoice, setReportStatusChoice] = useState<ReportStatus>('RESOLVED');
  const [reportAdminNotes, setReportAdminNotes] = useState('');

  // State: Platform Settings & Audit
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [validationFeeRate, setValidationFeeRate] = useState<number>(1);
  const [offerValidityHours, setOfferValidityHours] = useState<number>(24);
  const [reservationDurationHours, setReservationDurationHours] = useState<number>(24);
  const [platformName, setPlatformName] = useState('ReVibe FliP');
  const [supportEmail, setSupportEmail] = useState('contact@revibeflip.com');
  const [supportPhone, setSupportPhone] = useState('+221 77 123 45 67');
  const [currency, setCurrency] = useState('FCFA');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalElements, setAuditTotalElements] = useState(0);

  // Modal Consultation Discussion en lecture seule
  const [auditConversationModal, setAuditConversationModal] = useState<{
    isOpen: boolean;
    data: any | null;
    loading: boolean;
  }>({
    isOpen: false,
    data: null,
    loading: false,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // State: Dashboard période & auto-refresh
  const [period, setPeriod] = useState<string>('30d');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch functions
  const fetchDashboard = async (p = period, from = customFrom, to = customTo) => {
    setDashboardError(null);
    setRefreshing(true);
    try {
      const res = await adminApi.getDashboard({
        period: p,
        from: p === 'custom' && from ? from : undefined,
        to: p === 'custom' && to ? to : undefined,
      });
      if (res.data?.data) {
        setDashboard(res.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching dashboard', e);
      setDashboardError(e.response?.data?.message || 'Impossible de charger les indicateurs du tableau de bord.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigateTab = (tab: string, filter?: string) => {
    setActiveTab(tab as AdminTabType);
    if (filter) {
      if (tab === 'users') {
        setUserFilter(filter as any);
      } else if (tab === 'products') {
        setProductStatusFilter(filter);
      } else if (tab === 'orders') {
        setOrderStatusFilter(filter);
      } else if (tab === 'reports') {
        setReportFilter(filter as any);
      } else if (tab === 'payments') {
        setPaymentMethodFilter(filter);
      }
    }
  };

  // Auto-refresh toutes les 2 minutes (désactivable)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchDashboard(period, customFrom, customTo);
    }, 120_000);
    return () => clearInterval(timer);
  }, [autoRefresh, period, customFrom, customTo]);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers({
        page: userPage,
        size: 15,
        role: userFilter === 'ALL' ? undefined : userFilter,
        query: userSearch || undefined,
      });
      if (res.data?.data) {
        setUsers(res.data.data.content || []);
        setUserTotalPages(res.data.data.totalPages || 1);
        setUserTotalElements(res.data.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Error fetching users', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await adminApi.getProducts({ page: 0, size: 100 });
      if (res.data?.data) {
        setProducts(res.data.data.content || []);
      }
    } catch (e) {
      console.error('Error fetching products', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      if (res.data?.data) setCategories(res.data.data);
    } catch (e) {
      console.error('Error fetching categories', e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminApi.getOrders({
        page: orderPage,
        size: 15,
        status: orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
        query: orderSearch || undefined,
      });
      if (res.data?.data) {
        setOrders(res.data.data.content || []);
        setOrderTotalPages(res.data.data.totalPages || 1);
        setOrderTotalElements(res.data.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Error fetching orders', e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await adminApi.getPayments({
        page: paymentPage,
        size: 15,
        method: paymentMethodFilter === 'ALL' ? undefined : paymentMethodFilter,
        query: paymentSearch || undefined,
      });
      if (res.data?.data) {
        setPayments(res.data.data.content || []);
        setPaymentTotalPages(res.data.data.totalPages || 1);
        setPaymentTotalElements(res.data.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Error fetching payments', e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await adminApi.getReports({
        page: reportPage,
        size: 15,
        status: reportFilter === 'ALL' ? undefined : reportFilter,
      });
      if (res.data?.data) {
        setReports(res.data.data.content || []);
        setReportTotalPages(res.data.data.totalPages || 1);
        setReportTotalElements(res.data.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Error fetching reports', e);
    }
  };

  const fetchSettingsAndAudit = async () => {
    try {
      const [settingsRes, auditRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getAuditLogs({ page: auditPage, size: 15 }),
      ]);
      if (settingsRes.data?.data) {
        const s = settingsRes.data.data;
        setPlatformSettings(s);
        setCommissionRate(s.commissionRate);
        setValidationFeeRate(s.validationFeeRate);
        setOfferValidityHours(s.offerValidityHours || 24);
        setReservationDurationHours(s.reservationDurationHours || 24);
        setPlatformName(s.platformName || 'ReVibe FliP');
        setSupportEmail(s.supportEmail || 'contact@revibeflip.com');
        setSupportPhone(s.supportPhone || '+221 77 123 45 67');
        setCurrency(s.currency || 'FCFA');
      }
      if (auditRes.data?.data) {
        setAuditLogs(auditRes.data.data.content || []);
        setAuditTotalPages(auditRes.data.data.totalPages || 1);
        setAuditTotalElements(auditRes.data.data.totalElements || 0);
      }
    } catch (e) {
      console.error('Error fetching settings/audit', e);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
      fetchUsers();
      fetchProducts();
      fetchCategories();
      fetchOrders();
      fetchPayments();
      fetchReports();
      fetchSettingsAndAudit();
    }
  }, [isAdmin]);

  // Tab-specific pagination & filters
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userPage, userFilter, userSearch]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [orderPage, orderStatusFilter, orderSearch]);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
  }, [paymentPage, paymentMethodFilter, paymentSearch]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [reportPage, reportFilter]);

  useEffect(() => {
    if (activeTab === 'audit' || activeTab === 'settings') fetchSettingsAndAudit();
  }, [auditPage, activeTab]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboard(),
      fetchUsers(),
      fetchProducts(),
      fetchCategories(),
      fetchOrders(),
      fetchPayments(),
      fetchReports(),
      fetchSettingsAndAudit(),
    ]);
    setRefreshing(false);
  };

  // Action handlers
  const handleToggleSuspendUser = async (userId: number, currentSuspended: boolean) => {
    try {
      await adminApi.toggleSuspend(userId, !currentSuspended);
      fetchUsers();
      fetchDashboard();
    } catch (e) {
      console.error('Error toggling suspend user', e);
    }
  };

  const handleUpdateUserRole = async (userId: number, currentRole: 'ROLE_USER' | 'ROLE_ADMIN') => {
    const nextRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    if (!confirm(`Changer le rôle de cet utilisateur en ${nextRole} ?`)) return;
    try {
      await adminApi.updateUserRole(userId, nextRole);
      fetchUsers();
    } catch (e) {
      console.error('Error updating user role', e);
    }
  };

  const handleViewUserDetail = async (userId: number) => {
    try {
      const res = await adminApi.getUserDetails(userId);
      if (res.data?.data) setSelectedUserDetail(res.data.data);
    } catch (e) {
      console.error('Error fetching user detail', e);
    }
  };

  const handleProductStatus = async (productId: number, status: string) => {
    try {
      await adminApi.setProductStatus(productId, status);
      fetchProducts();
      fetchDashboard();
      if (selectedProductDetail) setSelectedProductDetail(null);
    } catch (e) {
      console.error('Error updating product status', e);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet article ?')) return;
    try {
      await adminApi.deleteProduct(productId);
      fetchProducts();
      fetchDashboard();
      if (selectedProductDetail) setSelectedProductDetail(null);
    } catch (e) {
      console.error('Error deleting product', e);
    }
  };

  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatDesc(cat.description || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, {
          name: catName,
          slug: catSlug,
          description: catDesc,
        });
      } else {
        await adminApi.createCategory({
          name: catName,
          slug: catSlug,
          description: catDesc,
        });
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await adminApi.deleteCategory(catId);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category', err);
    }
  };

  const handleOpenDeliveryModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    setNewDeliveryStatus(
      (order.delivery?.status || (order as any).deliveryStatus || 'PENDING') as DeliveryStatus
    );
    setDeliveryNote(order.delivery?.trackingNumber || '');
  };

  const handleSaveDeliveryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDelivery) return;
    setActionLoading(true);
    try {
      await adminApi.updateDeliveryStatus(selectedOrderForDelivery.id, newDeliveryStatus, deliveryNote);
      setSelectedOrderForDelivery(null);
      fetchOrders();
    } catch (err) {
      console.error('Error updating delivery status', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReportModal = (report: any) => {
    setSelectedReport(report);
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
        action: reportAction,
        status: reportStatusChoice,
        adminNotes: reportAdminNotes,
      });
      setSelectedReport(null);
      fetchReports();
      fetchDashboard();
    } catch (err) {
      console.error('Error resolving report', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminApi.updateSettings({
        commissionRate,
        validationFeeRate,
        offerValidityHours,
        reservationDurationHours,
        platformName,
        supportEmail,
        supportPhone,
        currency,
      });
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 4000);
      fetchSettingsAndAudit();
    } catch (err) {
      console.error('Error saving settings', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${Math.round(price).toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
        <span className="text-gray-500 font-medium">
          Total : <strong className="text-gray-900">{totalElements}</strong> élément(s) • Page{' '}
          {currentPage + 1} sur {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-bold text-purple-700 bg-purple-50 rounded-lg">
            {currentPage + 1}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-150 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Accès Administrateur Restreint</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Cette interface de gestion back-office est strictement réservée aux comptes{' '}
            <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
              ROLE_ADMIN
            </code>
            .
          </p>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Se connecter avec un compte admin</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col lg:flex-row">
      {/* 1. SIDEBAR ADMINISTRATEUR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboard={dashboard}
        currentUser={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      {/* 2. ZONE DE CONTENU PRINCIPAL */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full max-w-[1600px] mx-auto space-y-6 overflow-x-hidden">
        {activeTab === 'kpi' && (
          <AdminKpiSection
            dashboard={dashboard}
            currentUser={user}
            refreshing={refreshing}
            error={dashboardError}
            onRefresh={() => fetchDashboard(period, customFrom, customTo)}
            period={period}
            onPeriodChange={(newP) => {
              setPeriod(newP);
              fetchDashboard(newP, customFrom, customTo);
            }}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            onApplyCustomDates={() => fetchDashboard('custom', customFrom, customTo)}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
            onNavigateTab={handleNavigateTab}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'products' && (
          <AdminProductsSection
            products={products}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            productStatusFilter={productStatusFilter}
            setProductStatusFilter={setProductStatusFilter}
            onSetProductStatus={handleProductStatus}
            onDeleteProduct={handleDeleteProduct}
            formatPrice={(amt) => formatPrice(amt)}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesSection
            categories={categories}
            onOpenModal={handleOpenCategoryModal}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersSection
            users={users}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            onToggleSuspend={handleToggleSuspendUser}
            onUpdateRole={handleUpdateUserRole}
            onViewDetail={handleViewUserDetail}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersSection
            orders={orders}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            orderPage={orderPage}
            orderTotalPages={orderTotalPages}
            orderTotalElements={orderTotalElements}
            setOrderPage={setOrderPage}
            onOpenDeliveryModal={handleOpenDeliveryModal}
            formatPrice={formatPrice}
            renderPagination={renderPagination}
          />
        )}

        {activeTab === 'payments' && (
          <AdminPaymentsSection
            payments={payments}
            paymentMethodFilter={paymentMethodFilter}
            setPaymentMethodFilter={setPaymentMethodFilter}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
            paymentPage={paymentPage}
            paymentTotalPages={paymentTotalPages}
            paymentTotalElements={paymentTotalElements}
            setPaymentPage={setPaymentPage}
            formatPrice={formatPrice}
            formatDate={formatDate}
            renderPagination={renderPagination}
          />
        )}

        {activeTab === 'reports' && (
          <AdminReportsSection
            reports={reports}
            reportFilter={reportFilter}
            setReportFilter={setReportFilter}
            reportPage={reportPage}
            reportTotalPages={reportTotalPages}
            reportTotalElements={reportTotalElements}
            setReportPage={setReportPage}
            onOpenReportModal={handleOpenReportModal}
            renderPagination={renderPagination}
          />
        )}

        {activeTab === 'audit' && (
          <AdminAuditSection
            auditLogs={auditLogs}
            auditPage={auditPage}
            auditTotalPages={auditTotalPages}
            auditTotalElements={auditTotalElements}
            setAuditPage={setAuditPage}
            formatDate={formatDate}
            renderPagination={renderPagination}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettingsSection
            platformSettings={platformSettings}
            commissionRate={commissionRate}
            setCommissionRate={setCommissionRate}
            validationFeeRate={validationFeeRate}
            setValidationFeeRate={setValidationFeeRate}
            offerValidityHours={offerValidityHours}
            setOfferValidityHours={setOfferValidityHours}
            reservationDurationHours={reservationDurationHours}
            setReservationDurationHours={setReservationDurationHours}
            platformName={platformName}
            setPlatformName={setPlatformName}
            currency={currency}
            setCurrency={setCurrency}
            supportEmail={supportEmail}
            setSupportEmail={setSupportEmail}
            supportPhone={supportPhone}
            setSupportPhone={setSupportPhone}
            settingsSavedMessage={settingsSavedMessage}
            actionLoading={actionLoading}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'content' && <AdminContentManager />}
      </main>

      {/* 3. MODALES CENTRALISÉES */}
      <AdminModals
        selectedUserDetail={selectedUserDetail}
        onCloseUserDetail={() => setSelectedUserDetail(null)}
        selectedProductDetail={selectedProductDetail}
        onCloseProductDetail={() => setSelectedProductDetail(null)}
        onDeleteProduct={handleDeleteProduct}
        onProductStatus={handleProductStatus}
        isCategoryModalOpen={isCategoryModalOpen}
        editingCategory={editingCategory}
        catName={catName}
        setCatName={setCatName}
        catSlug={catSlug}
        setCatSlug={setCatSlug}
        catDesc={catDesc}
        setCatDesc={setCatDesc}
        actionLoading={actionLoading}
        onCloseCategoryModal={() => setIsCategoryModalOpen(false)}
        onSaveCategory={handleSaveCategory}
        selectedOrderForDelivery={selectedOrderForDelivery}
        newDeliveryStatus={newDeliveryStatus}
        setNewDeliveryStatus={setNewDeliveryStatus}
        deliveryNote={deliveryNote}
        setDeliveryNote={setDeliveryNote}
        onCloseDeliveryModal={() => setSelectedOrderForDelivery(null)}
        onSaveDeliveryStatus={handleSaveDeliveryStatus}
        selectedReport={selectedReport}
        reportAction={reportAction}
        setReportAction={setReportAction}
        reportStatusChoice={reportStatusChoice}
        setReportStatusChoice={setReportStatusChoice}
        reportAdminNotes={reportAdminNotes}
        setReportAdminNotes={setReportAdminNotes}
        onCloseReportModal={() => setSelectedReport(null)}
        onSaveReportResolution={handleSaveReportResolution}
        auditConversationModal={auditConversationModal}
        onCloseAuditConversationModal={() =>
          setAuditConversationModal({ isOpen: false, data: null, loading: false })
        }
        formatPrice={formatPrice}
      />
    </div>
  );
};
