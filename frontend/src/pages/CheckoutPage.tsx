import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, orderApi, paymentApi } from '../services/api';
import { Product, DeliveryMode, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { EscrowShield } from '../components/EscrowShield';
import {
  Truck,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Smartphone,
  AlertCircle,
  QrCode,
  ExternalLink,
  Check
} from 'lucide-react';
import { InitiatePaymentResponse } from '../types';

export const CheckoutPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('HOME_DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.city || 'Dakar');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');

  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [paymentSession, setPaymentSession] = useState<InitiatePaymentResponse | null>(null);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!productId) return;

    productApi.getById(Number(productId))
      .then((res) => {
        if (res.data?.data) {
          setProduct(res.data.data);
        }
      })
      .catch((err) => {
        setError('Article non trouvé.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [productId, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-gray-900">Article indisponible</h2>
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
      setCreatedOrderId(order.id);

      // Initier la session de paiement réelle auprès de la passerelle
      const sessionRes = await paymentApi.initiate({
        orderId: order.id,
        paymentMethod: selectedPaymentMethod,
        phoneNumber: paymentPhone,
      });

      setPaymentSession(sessionRes.data.data);
      setShowPaymentModal(true);
      startPaymentPolling(sessionRes.data.data.transactionReference, order.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'initiation de la commande.");
    } finally {
      setProcessingOrder(false);
    }
  };

  const startPaymentPolling = (txRef: string, orderId: number) => {
    setPollingPayment(true);
    const interval = setInterval(async () => {
      try {
        const res = await paymentApi.checkStatus(txRef);
        if (res.data?.data && res.data.data.status === 'SUCCESS') {
          clearInterval(interval);
          setPollingPayment(false);
          setShowPaymentModal(false);
          navigate(`/orders/${orderId}`);
        }
      } catch (err) {
        // En attente du webhook
      }
    }, 3000);

    // Timeout de polling après 3 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollingPayment(false);
    }, 180000);
  };

  const handleManualFallbackConfirm = async () => {
    if (!createdOrderId) return;
    setProcessingOrder(true);
    try {
      await paymentApi.process({
        orderId: createdOrderId,
        paymentMethod: selectedPaymentMethod,
        phoneNumber: paymentPhone,
      });
      setShowPaymentModal(false);
      navigate(`/orders/${createdOrderId}`);
    } catch (err: any) {
      alert("Erreur lors de la validation du paiement : " + (err.response?.data?.message || 'Échec'));
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
          Finaliser votre commande
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Paiement sécurisé par séquestre (Escrow) avec livraison au Sénégal
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleInitiateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT FORM (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* DELIVERY MODE */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              Mode de livraison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Home Delivery */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMode === 'HOME_DELIVERY'
                    ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-700" />
                    <span className="text-xs font-bold text-gray-900">Livraison à domicile</span>
                  </div>
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === 'HOME_DELIVERY'}
                    onChange={() => setDeliveryMode('HOME_DELIVERY')}
                    className="text-purple-600"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500">Livreur moto urbain (quelques heures à 24h)</p>
                  <span className="text-xs font-extrabold text-purple-900 mt-1 block">2 000 FCFA</span>
                </div>
              </label>

              {/* Option 2: Direct Handover */}
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMode === 'DIRECT_HANDOVER'
                    ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-gray-900">Remise en main propre</span>
                  </div>
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === 'DIRECT_HANDOVER'}
                    onChange={() => setDeliveryMode('DIRECT_HANDOVER')}
                    className="text-purple-600"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500">Rendez-vous convenu avec le vendeur</p>
                  <span className="text-xs font-extrabold text-emerald-700 mt-1 block">Gratuit</span>
                </div>
              </label>
            </div>

            {/* Address inputs */}
            {deliveryMode === 'HOME_DELIVERY' && (
              <div className="pt-3 space-y-3 border-t border-gray-100 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse complète de livraison *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Liberté 6 Extension, Villa N° 120, près de la boulangerie..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ville / Quartier *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dakar"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone de contact *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+221 77..."
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Instructions pour le livreur (facultatif)</label>
                  <input
                    type="text"
                    placeholder="Ex: Sonner au portail bleu ou appeler avant de venir"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              Moyen de paiement mobile
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('WAVE')}
                className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedPaymentMethod === 'WAVE'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🐧</span>
                <span className="text-xs">Wave</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('ORANGE_MONEY')}
                className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedPaymentMethod === 'ORANGE_MONEY'
                    ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🍊</span>
                <span className="text-xs">Orange Money</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('FREE_MONEY')}
                className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedPaymentMethod === 'FREE_MONEY'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">📱</span>
                <span className="text-xs">Free Money</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Numéro de compte payeur {selectedPaymentMethod}
              </label>
              <input
                type="tel"
                required
                placeholder="+221 77..."
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SUMMARY (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">
              Récapitulatif de la commande
            </h3>

            {/* Product snippet */}
            <div className="flex gap-3 items-center">
              <img
                src={product.primaryImage || (product.images && product.images[0])}
                alt={product.title}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-900 truncate">{product.title}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Vendeur : {product.seller?.fullName}</p>
                <span className="text-xs font-extrabold text-purple-700 mt-1 block">
                  {itemPrice.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Price lines according to specs */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Prix de l'article</span>
                <span>{itemPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  Protection Escrow (1%)
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span>{validationFee.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Livraison ({deliveryMode === 'HOME_DELIVERY' ? 'Domicile' : 'Main propre'})</span>
                <span>{deliveryFee > 0 ? deliveryFee.toLocaleString('fr-FR') + ' FCFA' : 'Gratuit'}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-black text-gray-900">
                <span>Total à payer</span>
                <span className="text-purple-700">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={processingOrder}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-purple-200 transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{processingOrder ? 'Préparation...' : 'Payer ' + totalAmount.toLocaleString('fr-FR') + ' FCFA'}</span>
            </button>
          </div>

          {/* Escrow Shield info */}
          <EscrowShield />
        </div>
      </form>

      {/* MOBILE PAYMENT REAL / LIVE MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 border border-purple-100">
            <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shadow-inner">
              {paymentSession?.qrCodeUrl ? (
                <img src={paymentSession.qrCodeUrl} alt="QR Code Paiement" className="w-10 h-10 object-contain rounded" />
              ) : (
                <QrCode className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              Paiement {selectedPaymentMethod === 'WAVE' ? 'Wave Mobile' : 'Orange Money'}
            </h3>

            <p className="text-xs text-gray-500">
              Montant à régler : <strong className="text-gray-900 text-sm">{totalAmount.toLocaleString('fr-FR')} FCFA</strong>
            </p>

            {/* Lien direct Wave / Paydunya */}
            {paymentSession?.checkoutUrl && (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
                <p className="text-xs text-purple-900 font-medium">
                  {paymentSession.instructionMessage || "Cliquez ci-dessous pour ouvrir votre application :"}
                </p>
                <a
                  href={paymentSession.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  <span>Ouvrir {selectedPaymentMethod === 'WAVE' ? 'Wave' : 'Passerelle'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Statut d'écoute automatique en temps réel */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
              <div className="flex items-center gap-2">
                {pollingPayment ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                )}
                <span className="text-[11px] font-bold text-gray-700">
                  {pollingPayment ? "En attente de votre confirmation sur votre téléphone..." : "Prêt"}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                Réf transaction : <code className="font-mono text-purple-700">{paymentSession?.transactionReference}</code>
              </p>
              <p className="text-[10px] text-gray-500">
                🔒 Vos fonds seront conservés en toute sécurité sous séquestre (Escrow) jusqu'à livraison.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {/* Bouton de confirmation manuelle immédiate (secours / test) */}
              <button
                type="button"
                onClick={handleManualFallbackConfirm}
                disabled={processingOrder}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{processingOrder ? 'Validation...' : 'Valider immédiatement (Mode Test)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2 text-gray-500 rounded-xl text-xs font-semibold hover:text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
