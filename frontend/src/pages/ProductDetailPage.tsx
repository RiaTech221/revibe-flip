/**
 * Page Détail d'un Produit ReVibe FliP
 * 
 * Fiche descriptive complète d'une annonce d'article en vente :
 *  * - Galerie photos haute résolution avec zoom
 *  * - Caractéristiques techniques, état, taille, marque et localisation
 *  * - Bloc d'achat direct avec protection séquestre, bouton de négociation/offre et chat
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi, chatApi, reportApi } from '../services/api';
import { Product, ReportReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { EscrowShield } from '../components/EscrowShield';
import { CURATED_PRODUCTS } from '../data/curatedProducts';
import {
  ShieldCheck,
  MapPin,
  Star,
  Truck,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Flag,
  Share2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat initiation state
  const [chatLoading, setChatLoading] = useState(false);

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('MISLEADING_LISTING');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const numId = Number(id);
    const fallback = CURATED_PRODUCTS.find((p) => p.id === numId);

    productApi.getById(numId)
      .then((res) => {
        if (res.data && res.data.data) {
          setProduct(res.data.data);
        } else if (fallback) {
          setProduct(fallback);
        } else {
          setError('Article introuvable ou indisponible.');
        }
      })
      .catch((err) => {
        if (fallback) {
          setProduct(fallback);
        } else {
          setError('Article introuvable ou indisponible.');
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/checkout/${product.id}`)}`);
      return;
    }
    navigate(`/checkout/${product.id}`);
  };

  const handleContactSeller = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }

    setChatLoading(true);
    try {
      const res = await chatApi.startConversation({
        productId: product.id,
        initialMessage: `Bonjour ! Cet article "${product.title}" est-il toujours disponible ?`,
      });
      navigate(`/messages?conversationId=${res.data.data.id}`);
    } catch (err) {
      console.error('Erreur démarrage conversation, redirection avec contexte produit', err);
      navigate(`/messages?productId=${product.id}`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }

    try {
      await reportApi.create({
        reportedProductId: product.id,
        reportedUserId: product.seller?.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
        setReportDetails('');
      }, 2000);
    } catch (err) {
      alert("Erreur lors de l'envoi du signalement.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto" />
        <p className="text-xs text-gray-500 mt-4 font-medium">Chargement de l'article...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">{error || 'Article non trouvé'}</h2>
        <Link
          to="/catalog"
          className="mt-4 inline-block px-5 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-xl"
        >
          Retourner au catalogue
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === product.seller?.id;
  const isSold = product.status === 'SOLD';
  const validationFee = Math.round(product.price * 0.01);
  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation retour & Catégorie moderne */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition-all shadow-2xs hover:border-purple-300"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-purple-700" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/catalog"
            className="text-gray-500 hover:text-purple-700 font-medium transition-colors"
          >
            Catégories
          </Link>
          <span className="text-gray-300">›</span>
          <Link
            to={`/catalog?categoryId=${product.categoryId}`}
            className="px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-100 transition-colors"
          >
            {product.categoryName || 'Articles'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT: IMAGE GALLERY (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/5] sm:aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <img
              src={images[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />

            {/* Sold overlay */}
            {isSold && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-purple-700 text-white font-black text-xl uppercase tracking-widest px-8 py-3 rounded-2xl shadow-2xl transform -rotate-6">
                  Article Vendu
                </span>
              </div>
            )}

            {/* Navigation arrows if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md backdrop-blur-sm transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md backdrop-blur-sm transition-transform active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Condition tag */}
            <span className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm">
              {product.conditionLabel}
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImageIndex ? 'border-purple-700 shadow-sm scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS & ACTIONS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price & Title Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <h1 className="text-2xl sm:text-3xl font-black text-purple-700">
                  {formatPrice(product.price)}
                </h1>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 leading-snug">
              {product.title}
            </h2>

            {/* Attribute Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Catégorie</span>
                <span className="font-bold text-slate-800">{product.categoryName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Taille</span>
                <span className="font-bold text-slate-800">{product.size || 'Taille unique'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Marque</span>
                <span className="font-bold text-slate-800">{product.brand || 'Artisanal'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Localisation</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {product.locationCity || 'Dakar'}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-4">
              {!isOwner && !isSold && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-purple-700/20 transition-all transform active:scale-98 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Acheter ({formatPrice(product.price)})</span>
                    </button>

                    <button
                      onClick={() => product && addToCart(product)}
                      className="w-full py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-xs rounded-2xl shadow-xs transition-all transform active:scale-98 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4 text-purple-700" />
                      <span>Ajouter au panier</span>
                    </button>
                  </div>

                  <button
                    onClick={handleContactSeller}
                    disabled={chatLoading}
                    className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-purple-700" />
                    <span>{chatLoading ? 'Ouverture...' : 'Discuter avec le vendeur'}</span>
                  </button>
                </>
              )}

              {isSold && (
                <div className="p-4 bg-slate-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Cet article a déjà été vendu
                  </p>
                </div>
              )}

              {isOwner && (
                <div className="p-4 bg-purple-50 rounded-2xl text-center border border-purple-100">
                  <p className="text-xs font-bold text-purple-800">
                    Vous êtes le propriétaire de cette annonce
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={product.seller?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller?.fullName || 'Vendeur')}&background=9333ea&color=fff`}
                  alt={product.seller?.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-purple-100 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{product.seller?.fullName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.seller?.rating ? product.seller.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-gray-400 font-normal">({product.seller?.reviewCount || 0} avis)</span>
                  </div>
                </div>
              </div>

              {/* Trust badge */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Score {Math.round(product.seller?.trustScore || 100)}%
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-purple-600" />
                Livraison à domicile & main propre
              </span>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="text-gray-400 hover:text-purple-700 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Flag className="w-3 h-3" />
                Signaler
              </button>
            </div>
          </div>

          {/* État détaillé de l'article (Défauts & Mesures) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>État détaillé de l'article</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-purple-50/40 rounded-2xl border border-purple-100/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">
                  Défauts éventuels
                </span>
                <p className="text-xs text-gray-700 font-medium">
                  {product.defects && product.defects.trim().length > 0
                    ? product.defects
                    : "Aucun défaut signalé par le vendeur"}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 block">
                  Mesures
                </span>
                <p className="text-xs text-gray-700 font-medium">
                  {product.measurements && product.measurements.trim().length > 0
                    ? product.measurements
                    : "Non spécifiées (consultez le vendeur en discussion)"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Description détaillée</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description || "Aucune description détaillée n'a été fournie par le vendeur."}
            </p>
          </div>
        </div>
      </div>

      {/* REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-purple-700" />
              Signaler cette annonce
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Votre signalement sera analysé par notre équipe de modération.
            </p>

            {reportSuccess ? (
              <div className="mt-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                Merci ! Votre signalement a bien été transmis.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Motif du signalement</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="MISLEADING_LISTING">Annonce trompeuse</option>
                    <option value="COUNTERFEIT">Contrefaçon présumée</option>
                    <option value="SCAM">Arnaque / Fraude</option>
                    <option value="FAKE_PROFILE">Faux profil</option>
                    <option value="ABUSIVE_BEHAVIOR">Comportement abusif</option>
                    <option value="OTHER">Autre motif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Précisions (facultatif)</label>
                  <textarea
                    rows={3}
                    placeholder="Décrivez le problème constaté..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  Envoyer le signalement
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
