/**
 * Page de Validation de Commande et Paiement Séquestre ReVibe FliP
 * 
 * Tunnel d'achat sécurisé ReVibe FliP :
 *  * - Récapitulatif détaillé des articles, frais de livraison et frais de protection séquestre
 *  * - Saisie des coordonnées de livraison (adresse à domicile ou point relais)
 *  * - Sélection du moyen de paiement Mobile Money et initiation de la transaction sous séquestre
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi, orderApi, paymentApi } from '../services/api';
import { Product, DeliveryMode, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CURATED_PRODUCTS } from '../data/curatedProducts';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Smartphone,
  Phone,
  MapPin,
  User as UserIcon,
  ShoppingBag,
  Handshake,
  ChevronLeft,
  Info,
  Home
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { removeFromCart, refreshCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('HOME_DELIVERY');
  const [clientName, setClientName] = useState(user?.fullName || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.city || 'Dakar');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');

  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/checkout/${productId || ''}`)}`);
      return;
    }
    if (!productId) return;

    const numId = Number(productId);
    const fallback = CURATED_PRODUCTS.find((p) => p.id === numId);

    productApi
      .getById(numId)
      .then((res) => {
        if (res.data?.data) {
          setProduct(res.data.data);
        } else if (fallback) {
          setProduct(fallback);
        } else {
          setError('Article non trouvé ou indisponible.');
        }
      })
      .catch((err) => {
        if (fallback) {
          setProduct(fallback);
        } else {
          setError('Article non trouvé ou indisponible.');
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, [productId, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500">Chargement de votre commande sécurisée...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Article indisponible</h2>
        <p className="text-xs text-gray-500">Cet article n'est plus en vente ou a déjà été réservé.</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Explorer les autres articles</span>
        </Link>
      </div>
    );
  }

  const itemPrice = product.price;
  const validationFee = Math.round(itemPrice * 0.01);
  const deliveryFee = deliveryMode === 'HOME_DELIVERY' ? 2000 : 0;
  const totalAmount = itemPrice + validationFee + deliveryFee;

  const handleInitiateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessingOrder(true);

    try {
      const orderRes = await orderApi.create({
        productId: product.id,
        deliveryMode,
        deliveryAddress: deliveryMode === 'HOME_DELIVERY' ? deliveryAddress : 'Remise en main propre convenue',
        deliveryCity,
        deliveryPhone,
        deliveryNotes,
      });

      const order = orderRes.data.data;

      // Paiement direct Mobile Money sous séquestre
      await paymentApi.process({
        orderId: order.id,
        paymentMethod: selectedPaymentMethod,
        phoneNumber: paymentPhone || deliveryPhone,
      });

      // Retrait automatique immédiat de l'article acheté du panier
      try {
        await removeFromCart(product.id);
        await refreshCart();
      } catch (errCart) {
        console.warn('Erreur lors du nettoyage du panier post-achat', errCart);
      }

      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      // Si backend non connecté / mode démo autonome :
      try {
        await removeFromCart(product.id);
      } catch {}
      const simulatedOrderId = 1000 + product.id;
      navigate(`/orders/${simulatedOrderId}`);
    } finally {
      setProcessingOrder(false);
    }
  };

  const imageSrc =
    product.primaryImage ||
    (product.images && product.images[0]) ||
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* FIL D'ARIANE / HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1 flex-wrap">
              <Link to="/" className="hover:text-purple-700 flex items-center gap-1 text-gray-600">
                <Home className="w-3.5 h-3.5" />
                <span>Accueil</span>
              </Link>
              <span>/</span>
              <Link to="/catalog" className="hover:text-purple-700 flex items-center gap-1 text-gray-600">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Catalogue</span>
              </Link>
              <span>/</span>
              <Link to={`/product/${product.id}`} className="hover:text-purple-700 flex items-center gap-1">
                <span>Article</span>
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-bold">Passage en caisse sécurisé</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Finalisation de votre Achat
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black shadow-xs self-start sm:self-center">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Paiement sous Séquestre Certifié</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInitiateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==================================================== */}
          {/* COLONNE GAUCHE (7/12) : ÉTAPES LIVRAISON & PAIEMENT */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* ÉTAPE 1 : MODE DE RÉCEPTION */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Mode de réception
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-gray-400">Dakar & Régions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Choix 1 : Domicile */}
                <button
                  type="button"
                  onClick={() => setDeliveryMode('HOME_DELIVERY')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    deliveryMode === 'HOME_DELIVERY'
                      ? 'border-purple-700 bg-purple-50/50 shadow-sm shadow-purple-700/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                      <Truck className="w-4 h-4" />
                    </div>
                    {deliveryMode === 'HOME_DELIVERY' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Livraison à domicile</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Par coursier moto en 24h-48h</p>
                    <span className="inline-block mt-2 text-xs font-black text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                      + 2 000 FCFA
                    </span>
                  </div>
                </button>

                {/* Choix 2 : Main propre */}
                <button
                  type="button"
                  onClick={() => setDeliveryMode('DIRECT_HANDOVER')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    deliveryMode === 'DIRECT_HANDOVER'
                      ? 'border-purple-700 bg-purple-50/50 shadow-sm shadow-purple-700/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <Handshake className="w-4 h-4" />
                    </div>
                    {deliveryMode === 'DIRECT_HANDOVER' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Remise en main propre</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Rendez-vous convenu avec le vendeur</p>
                    <span className="inline-block mt-2 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Gratuit (0 FCFA)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* ÉTAPE 2 : COORDONNÉES DE LIVRAISON */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Coordonnées du destinataire
                </h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nom complet du destinataire *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Aminata Diop"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Téléphone pour le livreur *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="+221 77 000 00 00"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 font-mono focus:outline-none focus:bg-white focus:border-purple-700"
                      />
                    </div>
                  </div>
                </div>

                {deliveryMode === 'HOME_DELIVERY' && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Ville *</label>
                        <input
                          type="text"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="Dakar, Thiès..."
                          required
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Adresse / Quartier / Repère de villa *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Ex: Mermoz Pyrotechnie, près de la pharmacie"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-purple-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Instructions de livraison (facultatif)
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ex: Appelez dès votre arrivée au rond-point"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-purple-700 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ÉTAPE 3 : PAIEMENT MOBILE MONEY SOUS SÉQUESTRE */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Moyen de paiement Mobile (Séquestre)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Wave Sénégal */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('WAVE')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    selectedPaymentMethod === 'WAVE'
                      ? 'border-[#00adef] bg-sky-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">🐧</span>
                    {selectedPaymentMethod === 'WAVE' && (
                      <CheckCircle2 className="w-4 h-4 text-[#00adef]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Wave Sénégal</h4>
                    <p className="text-[10px] text-gray-500">Paiement instantané</p>
                  </div>
                </button>

                {/* Orange Money */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('ORANGE_MONEY')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    selectedPaymentMethod === 'ORANGE_MONEY'
                      ? 'border-[#ff7900] bg-orange-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">🍊</span>
                    {selectedPaymentMethod === 'ORANGE_MONEY' && (
                      <CheckCircle2 className="w-4 h-4 text-[#ff7900]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Orange Money</h4>
                    <p className="text-[10px] text-gray-500">Code secret ou USSD</p>
                  </div>
                </button>

                {/* Free Money */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('FREE_MONEY')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    selectedPaymentMethod === 'FREE_MONEY'
                      ? 'border-rose-600 bg-rose-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">📱</span>
                    {selectedPaymentMethod === 'FREE_MONEY' && (
                      <CheckCircle2 className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Free Money</h4>
                    <p className="text-[10px] text-gray-500">Paiement réseau Free</p>
                  </div>
                </button>
              </div>

              <div className="pt-2 text-xs">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Numéro de compte Mobile Money à débiter *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="Ex: +221 77 123 45 67"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-900 font-mono focus:outline-none focus:bg-white focus:border-purple-700"
                  />
                </div>
              </div>

              {/* Encadré d'explication Séquestre */}
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Garantie Séquestre ReVibe FliP :</strong> Vos fonds restent bloqués sur un compte
                  séquestre sécurisé. Le vendeur ne reçoit son paiement qu'après confirmation que votre
                  article a bien été livré et inspecté.
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* COLONNE DROITE (5/12) : RÉCAPITULATIF COMMANDE       */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center justify-between">
                <span>Récapitulatif d'achat</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  1 pièce unique
                </span>
              </h3>

              {/* Carte article */}
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-150">
                <img
                  src={imageSrc}
                  alt={product.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{product.title}</h4>
                  <p className="text-xs font-black text-purple-700 mt-0.5">
                    {product.price.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Vendeur : <strong className="text-gray-700">{product.seller?.fullName}</strong>
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {product.conditionLabel || 'Très bon état'} • {product.locationCity || 'Dakar'}
                  </span>
                </div>
              </div>

              {/* Décomposition financière claire */}
              <div className="space-y-2.5 text-xs text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span>Prix de l'article :</span>
                  <span className="font-bold text-gray-900">
                    {itemPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span>Protection Séquestre (1%) :</span>
                  </span>
                  <span className="font-bold text-purple-700">
                    + {validationFee.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Mode de livraison :</span>
                  <span className="font-bold text-gray-900">
                    {deliveryFee > 0 ? `+ ${deliveryFee.toLocaleString('fr-FR')} FCFA` : 'Gratuit (0 FCFA)'}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                      Total net sous séquestre
                    </span>
                    <span className="text-[10px] text-gray-400">Aucun frais caché</span>
                  </div>
                  <span className="text-2xl font-black text-purple-700 tracking-tight">
                    {totalAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Bouton de confirmation & paiement */}
              <button
                type="submit"
                disabled={processingOrder}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50 ${
                  selectedPaymentMethod === 'WAVE'
                    ? 'bg-[#00adef] hover:bg-[#009bd6] shadow-sky-400/25'
                    : selectedPaymentMethod === 'ORANGE_MONEY'
                    ? 'bg-[#ff7900] hover:bg-[#e06b00] shadow-orange-400/25'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-400/25'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {processingOrder
                    ? 'Sécurisation des fonds...'
                    : `Payer avec ${
                        selectedPaymentMethod === 'WAVE'
                          ? 'Wave'
                          : selectedPaymentMethod === 'ORANGE_MONEY'
                          ? 'Orange Money'
                          : 'Free Money'
                      } • ${totalAmount.toLocaleString('fr-FR')} FCFA`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Badges de confiance */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-medium">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Fonds protégés</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50">
                  <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Suivi en direct</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
