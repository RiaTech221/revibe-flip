import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productApi, orderApi, reviewApi } from '../services/api';
import { Product, Order, Review } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  User as UserIcon,
  ShoppingBag,
  Package,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  PlusCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'listings';

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myPurchases, setMyPurchases] = useState<Order[]>([]);
  const [mySales, setMySales] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (user?.id) {
      setLoading(true);
      Promise.all([
        productApi.getBySeller(user.id),
        orderApi.getMyPurchases(),
        orderApi.getMySales(),
        reviewApi.getUserReviews(user.id),
      ])
        .then(([prodRes, purchRes, salesRes, revRes]) => {
          if (prodRes.data?.data) setMyProducts(prodRes.data.data);
          if (purchRes.data?.data) setMyPurchases(purchRes.data.data);
          if (salesRes.data?.data) setMySales(salesRes.data.data);
          if (revRes.data?.data) setMyReviews(revRes.data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=9333ea&color=fff`}
              alt={user?.fullName}
              className="w-20 h-20 rounded-full object-cover border-4 border-purple-100 shadow-md"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">{user?.fullName}</h1>
                <span className="text-lg">{user?.flagEmoji || '🇸🇳'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user?.phone}</span>
                {user?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.city}</span>}
              </p>

              {/* Rating & Trust Score */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{user?.rating ? user.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-gray-400 font-normal">({user?.reviewCount || 0} avis)</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Score de confiance : {Math.round(user?.trustScore || 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/sell"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-full shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publier un article</span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-2 sm:gap-4 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setSearchParams({ tab: 'listings' })}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'listings'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes Annonces ({myProducts.length})
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'purchases' })}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'purchases'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes Achats ({myPurchases.length})
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'sales' })}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'sales'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes Ventes ({mySales.length})
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'reviews' })}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'reviews'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Avis reçus ({myReviews.length})
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div>
        {/* 1. LISTINGS */}
        {currentTab === 'listings' && (
          <div>
            {myProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">Vous n'avez pas encore d'annonce en vente</h3>
                <p className="text-xs text-gray-500 mt-1">Publiez votre premier article en quelques clics.</p>
                <Link
                  to="/sell"
                  className="mt-4 inline-flex items-center gap-1 px-5 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-full shadow"
                >
                  <PlusCircle className="w-4 h-4" /> Vendre maintenant
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. PURCHASES */}
        {currentTab === 'purchases' && (
          <div className="space-y-4">
            {myPurchases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">Aucun achat effectué pour le moment</h3>
                <Link to="/catalog" className="mt-4 inline-block text-xs font-bold text-purple-700 hover:underline">
                  Parcourir le catalogue
                </Link>
              </div>
            ) : (
              myPurchases.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={ord.productImageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80'}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <span className="text-xs font-mono text-gray-400">N° {ord.orderNumber}</span>
                      <h4 className="text-sm font-bold text-gray-900">{ord.productTitle}</h4>
                      <p className="text-xs text-purple-700 font-extrabold mt-0.5">
                        {ord.totalAmount.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800">
                      {ord.status}
                    </span>
                    <Link
                      to={`/orders/${ord.id}`}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <span>Suivre</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. SALES */}
        {currentTab === 'sales' && (
          <div className="space-y-4">
            {mySales.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">Aucune vente enregistrée pour le moment</h3>
              </div>
            ) : (
              mySales.map((ord) => (
                <div key={ord.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={ord.productImageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80'}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <span className="text-xs font-mono text-gray-400">N° {ord.orderNumber}</span>
                      <h4 className="text-sm font-bold text-gray-900">{ord.productTitle}</h4>
                      <p className="text-xs text-emerald-700 font-extrabold mt-0.5">
                        Gain net : {ord.sellerPayout.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800">
                      {ord.status}
                    </span>
                    <Link
                      to={`/orders/${ord.id}`}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <span>Gérer l'envoi</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. REVIEWS */}
        {currentTab === 'reviews' && (
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">Aucun avis reçu pour le moment</h3>
                <p className="text-xs text-gray-500 mt-1">Les avis apparaîtront ici après vos premières ventes.</p>
              </div>
            ) : (
              myReviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{rev.reviewerName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  {rev.comment && <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
