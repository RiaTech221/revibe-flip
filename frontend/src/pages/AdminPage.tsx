import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api';
import { AdminDashboard, User, Product, ReportStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  ShieldAlert,
  Search,
  CheckCircle,
  Ban,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as 'kpi' | 'users' | 'products' | 'reports') || 'kpi';
  const setActiveTab = (tab: 'kpi' | 'users' | 'products' | 'reports') => {
    setSearchParams({ tab });
  };

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  // Users tab
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Products tab
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Reports tab
  const [reports, setReports] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    adminApi.getDashboard().then((res) => {
      if (res.data?.data) setDashboard(res.data.data);
    }).catch(console.error);
  };

  const fetchUsers = () => {
    adminApi.getUsers(userSearch).then((res) => {
      if (res.data?.data) setUsers(res.data.data);
    }).catch(console.error);
  };

  const fetchProducts = () => {
    adminApi.getProducts(productSearch).then((res) => {
      if (res.data?.data) setProducts(res.data.data);
    }).catch(console.error);
  };

  const fetchReports = () => {
    adminApi.getReports().then((res) => {
      if (res.data?.data) setReports(res.data.data);
    }).catch(console.error);
  };

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchDashboard();
      fetchUsers();
      fetchProducts();
      fetchReports();
      setLoading(false);
    }
  }, [isAdmin]);

  const handleToggleSuspend = async (userId: number, currentStatus: boolean) => {
    try {
      await adminApi.toggleSuspend(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert('Erreur modification statut utilisateur');
    }
  };

  const handleProductStatus = async (productId: number, newStatus: string) => {
    try {
      await adminApi.setProductStatus(productId, newStatus);
      fetchProducts();
    } catch (err) {
      alert('Erreur modification annonce');
    }
  };

  const handleResolveReport = async (reportId: number, status: ReportStatus) => {
    try {
      await adminApi.resolveReport(reportId, status, "Traité par l'administrateur");
      fetchReports();
      fetchDashboard();
    } catch (err) {
      alert('Erreur traitement signalement');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-gray-900">Accès restreint à l'administration</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-900 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              Supervision
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Back-Office Administrateur ReVibe FliP
          </h1>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 text-xs font-bold bg-white p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'kpi' ? 'bg-purple-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Indicateurs KPIs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-purple-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Utilisateurs ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'products' ? 'bg-purple-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Annonces ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'reports' ? 'bg-purple-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Signalements ({reports.length})
          </button>
        </div>
      </div>

      {/* 1. KPI DASHBOARD TAB */}
      {activeTab === 'kpi' && dashboard && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl w-max">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500 font-bold">Total Utilisateurs</p>
              <h3 className="text-2xl font-black text-gray-900">{dashboard.totalUsers}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">Profils enregistrés & vérifiés</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl w-max">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500 font-bold">Annonces Actives</p>
              <h3 className="text-2xl font-black text-gray-900">{dashboard.activeProducts}</h3>
              <p className="text-[11px] text-gray-400 font-medium">Sur {dashboard.totalProducts} publiées au total</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500 font-bold">Commandes Traitées</p>
              <h3 className="text-2xl font-black text-gray-900">{dashboard.totalOrders}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">Volume : {dashboard.totalTransactionsAmount.toLocaleString('fr-FR')} FCFA</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-max">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500 font-bold">Revenus Plateforme</p>
              <h3 className="text-2xl font-black text-purple-900">
                {(dashboard.totalCommissions + dashboard.totalValidationFees).toLocaleString('fr-FR')} FCFA
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Commissions (20%) + Frais Escrow (1%)
              </p>
            </div>
          </div>

          {/* Detailed Financial Summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Modèle Économique & Répartition des flux financiers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-xs text-purple-900 font-bold">Commission de 20% sur les ventes</span>
                <p className="text-xl font-black text-purple-950 mt-1">
                  {dashboard.totalCommissions.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-[11px] text-purple-700 mt-1">Rémunération du service et de mise en relation</p>
              </div>

              <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100">
                <span className="text-xs text-pink-900 font-bold">Frais de validation (1% Escrow)</span>
                <p className="text-xl font-black text-pink-950 mt-1">
                  {dashboard.totalValidationFees.toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-[11px] text-pink-700 mt-1">Sécurisation technique et traitement anti-fraude</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-xs text-amber-900 font-bold">Signalements à modérer</span>
                <p className="text-xl font-black text-amber-950 mt-1">
                  {dashboard.pendingReports}
                </p>
                <p className="text-[11px] text-amber-700 mt-1">Contrefaçons ou annonces suspectes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-sm text-gray-900">Gestion des utilisateurs</h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Chercher par nom, téléphone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3">Pays</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Score Confiance</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="p-3 font-bold text-gray-900">{u.fullName}</td>
                    <td className="p-3 font-mono text-gray-600">{u.phone}</td>
                    <td className="p-3">{u.flagEmoji} {u.countryName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-900' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-700">{Math.round(u.trustScore)}%</td>
                    <td className="p-3">
                      {u.isSuspended ? (
                        <span className="text-rose-600 font-bold">Suspendu</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Actif</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'ROLE_ADMIN' && (
                        <button
                          onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                            u.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.isSuspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-sm text-gray-900">Modération des annonces</h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filtrer par titre, marque..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                <tr>
                  <th className="p-3">Article</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Vendeur</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60">
                    <td className="p-3 font-bold text-gray-900 max-w-xs truncate">{p.title}</td>
                    <td className="p-3 font-extrabold text-purple-700">{p.price.toLocaleString('fr-FR')} FCFA</td>
                    <td className="p-3">{p.seller?.fullName}</td>
                    <td className="p-3">{p.locationCity}</td>
                    <td className="p-3 font-semibold">{p.status}</td>
                    <td className="p-3 text-right">
                      {p.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleProductStatus(p.id, 'INACTIVE')}
                          className="px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-[11px] font-bold"
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleProductStatus(p.id, 'ACTIVE')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-[11px] font-bold"
                        >
                          Activer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-gray-900">Signalements & Litiges</h3>

          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucun signalement en attente.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                        {r.reasonLabel}
                      </span>
                      <span className="text-xs text-gray-400">
                        Signalé par {r.reporter?.fullName}
                      </span>
                    </div>
                    {r.reportedProduct && (
                      <p className="text-xs font-bold text-gray-900">
                        Article concerné : {r.reportedProduct.title}
                      </p>
                    )}
                    {r.details && (
                      <p className="text-xs text-gray-600 italic">« {r.details} »</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {r.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleResolveReport(r.id, 'RESOLVED')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl"
                        >
                          Valider sanction
                        </button>
                        <button
                          onClick={() => handleResolveReport(r.id, 'DISMISSED')}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl"
                        >
                          Classer sans suite
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-gray-500">{r.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
