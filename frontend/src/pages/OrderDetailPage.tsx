import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, deliveryApi, reviewApi } from '../services/api';
import { Order, DeliveryStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { CURATED_PRODUCTS } from '../data/curatedProducts';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  ArrowRight,
  AlertCircle,
  X,
  MessageSquare,
  Lock,
  ChevronLeft,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Home,
  ShoppingBag
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Seller delivery update state
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus>('IN_TRANSIT');
  const [carrierNotes, setCarrierNotes] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const buildFallbackOrder = (orderId: number, prod: any) => {
    const itemPrice = Number(prod.price) || 11000;
    const validationFee = Math.round(itemPrice * 0.01);
    const deliveryFee = 2000;
    const totalAmount = itemPrice + validationFee + deliveryFee;

    const mockOrder: Order = {
      id: orderId,
      orderNumber: `CMD-SN-${orderId}`,
      productId: prod.id,
      productTitle: prod.title,
      productImageUrl: prod.primaryImage || (prod.images && prod.images[0]) || '',
      buyer: user || ({ id: 4, fullName: 'Fatou Sow', phone: '+221778889900', email: 'fatou@revibeflip.com', city: 'Dakar' } as any),
      seller: prod.seller || ({ id: 3, fullName: 'Moussa Ndiaye', phone: '+221774445566', email: 'moussa@revibeflip.com', city: 'Dakar' } as any),
      itemPrice,
      platformCommission: Math.round(itemPrice * 0.20),
      validationFee,
      deliveryFee,
      totalAmount,
      sellerPayout: itemPrice - Math.round(itemPrice * 0.20),
      status: 'PAID_ESCROW_LOCKED',
      deliveryMode: 'HOME_DELIVERY',
      deliveryModeLabel: 'Livraison à domicile Express',
      deliveryStatus: 'IN_TRANSIT',
      deliveryStatusLabel: 'Colis en cours d\'acheminement',
      deliveryAddress: user?.address || 'Dakar Almadies, Villa 42',
      deliveryCity: user?.city || 'Dakar',
      deliveryPhone: user?.phone || '+221778889900',
      createdAt: new Date().toISOString(),
    };
    setOrder(mockOrder);
  };

  const fetchOrder = () => {
    if (!id) return;
    setLoading(true);
    const numId = Number(id);
    const prodId = numId > 1000 ? numId - 1000 : (numId <= 21 && numId > 0 ? numId : 18);
    const associatedProduct = CURATED_PRODUCTS.find((p) => p.id === prodId) || CURATED_PRODUCTS[0];

    orderApi
      .getById(numId)
      .then((res) => {
        if (res.data?.data) {
          setOrder(res.data.data);
        } else {
          buildFallbackOrder(numId, associatedProduct);
        }
      })
      .catch(() => {
        buildFallbackOrder(numId, associatedProduct);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    if (
      !window.confirm(
        "Confirmez-vous avoir bien reçu l'article conforme ? Cette action débloquera les fonds séquestrés pour le vendeur."
      )
    ) {
      return;
    }

    try {
      const res = await orderApi.confirmReceipt(order.id);
      setOrder(res.data.data);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la confirmation de réception.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setReviewSubmitting(true);
    try {
      await reviewApi.create({
        orderId: order.id,
        rating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setIsReviewModalOpen(false);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement de l'avis.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.delivery) return;
    setStatusUpdating(true);
    try {
      await deliveryApi.updateStatus(order.delivery.id, {
        status: selectedStatus,
        notes: carrierNotes || undefined,
      });
      fetchOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour de livraison.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500">Chargement des détails de votre commande...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-black text-gray-900">{error || 'Commande introuvable'}</h2>
        <Link
          to="/profile?tab=purchases"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 text-white text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voir mes achats</span>
        </Link>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyer?.id;
  const isSeller = user?.id === order.seller?.id;
  const isCompleted = order.status === 'COMPLETED';
  const isEscrowLocked = order.payment?.escrowStatus === 'LOCKED' || order.status === 'PAID_ESCROW_LOCKED';

  // Stepper d'acheminement standardisé
  const deliverySteps: { status: DeliveryStatus; label: string; desc: string }[] = [
    { status: 'PENDING', label: 'Commande reçue', desc: 'Paiement sous séquestre' },
    { status: 'PICKED_UP', label: 'Pris en charge', desc: 'Colis remis au coursier' },
    { status: 'IN_TRANSIT', label: 'En acheminement', desc: 'En transit vers destination' },
    { status: 'OUT_FOR_DELIVERY', label: 'En livraison', desc: 'Arrivée imminente' },
    { status: 'DELIVERED', label: 'Colis livré', desc: 'Remis au destinataire' },
  ];

  const currentStepIndex = Math.max(
    0,
    deliverySteps.findIndex((s) => s.status === order.delivery?.status)
  );

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* EN-TÊTE DE COMMANDE */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs flex-wrap">
              <Link
                to="/"
                className="text-purple-700 hover:text-purple-900 flex items-center gap-1 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full"
              >
                <Home className="w-3 h-3" />
                <span>Accueil</span>
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/catalog"
                className="text-gray-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Catalogue</span>
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/profile?tab=purchases"
                className="text-gray-500 hover:text-purple-700 flex items-center gap-1 font-medium"
              >
                <span>Mes Achats</span>
              </Link>
              <span className="text-gray-300">•</span>
              <span className="font-mono font-bold text-purple-700">N° {order.orderNumber}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400">
                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Suivi & Détails de la Commande
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isEscrowLocked ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Fonds bloqués sous Séquestre (Escrow)</span>
              </div>
            ) : isCompleted ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Commande terminée & Fonds versés</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black shadow-xs">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>En cours de traitement</span>
              </div>
            )}

            {isCompleted && isBuyer && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Laisser un avis</span>
              </button>
            )}
          </div>
        </div>

        {/* STEPPER VISUEL CONNECTÉ D'ACHEMINEMENT */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-700" />
              <span>Acheminement du colis en temps réel</span>
            </h3>

            {order.delivery?.trackingNumber && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">N° de suivi :</span>
                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                  {order.delivery.trackingNumber}
                </span>
                <button
                  onClick={() => handleCopyTracking(order.delivery!.trackingNumber)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Copier le numéro de suivi"
                >
                  {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Stepper graphique moderne avec ligne continue */}
          <div className="py-4">
            <div className="relative">
              {/* Ligne grise d'arrière-plan */}
              <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-gray-200 -z-0" />

              {/* Ligne colorée de progression */}
              <div
                className="hidden sm:block absolute top-5 left-10 h-1 bg-gradient-to-r from-purple-700 to-emerald-600 transition-all duration-500 -z-0"
                style={{
                  width: `${Math.min(100, (currentStepIndex / (deliverySteps.length - 1)) * 82)}%`,
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                {deliverySteps.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const isUpcoming = idx > currentStepIndex;

                  return (
                    <div key={step.status} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-purple-700 text-white ring-4 ring-purple-100 shadow-md shadow-purple-700/25'
                            : isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border-2 border-gray-200 text-gray-400'
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold leading-tight ${
                            isCurrent
                              ? 'text-purple-700 font-black'
                              : isDone
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BANDEAU D'ACTION : CONFIRMATION RÉCEPTION (ACHETEUR) */}
          {isBuyer && !isCompleted && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-950 font-black text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Votre colis est-il bien arrivé ?</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Vérifiez votre article puis confirmez la réception pour finaliser la commande.
                </p>
              </div>

              <button
                onClick={handleConfirmReceipt}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmer la réception</span>
              </button>
            </div>
          )}

          {/* FORMULAIRE MISE À JOUR LIVRAISON (POUR LE VENDEUR) */}
          {isSeller && !isCompleted && (
            <form onSubmit={handleUpdateDelivery} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                  Mettre à jour l'acheminement (Espace Vendeur)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as DeliveryStatus)}
                  className="px-3 py-2 bg-white rounded-xl border border-purple-200 font-semibold text-gray-800 focus:outline-none focus:border-purple-700"
                >
                  <option value="PICKED_UP">Pris en charge par le coursier</option>
                  <option value="IN_TRANSIT">En cours d'acheminement</option>
                  <option value="OUT_FOR_DELIVERY">En cours de livraison finale</option>
                  <option value="DELIVERED">Colis remis au client</option>
                </select>

                <input
                  type="text"
                  placeholder="Note ou contact livreur (ex: Moto Moussa 77...)"
                  value={carrierNotes}
                  onChange={(e) => setCarrierNotes(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-purple-200 font-medium text-gray-800 focus:outline-none focus:border-purple-700 text-xs"
                />

                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {statusUpdating ? 'Actualisation...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2 COLONNES DE DÉTAILS COMPLETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* COLONNE GAUCHE : ARTICLE(S) & PAIEMENT SÉQUESTRE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Articles & Décomposition financière</span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                {order.items && order.items.length > 1 ? `${order.items.length} articles` : '1 article'}
              </span>
            </h3>

            {/* Liste des articles */}
            <div className="divide-y divide-gray-100 space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 pt-3 first:pt-0">
                    <img
                      src={
                        item.productImageUrl ||
                        order.productImageUrl ||
                        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={item.productTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${item.productId}`}
                        className="text-xs font-bold text-gray-900 hover:text-purple-700 truncate block"
                      >
                        {item.productTitle}
                      </Link>
                      <p className="text-xs font-black text-purple-700 mt-0.5">
                        {Number(item.price).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      order.productImageUrl ||
                      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={order.productTitle}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${order.productId}`}
                      className="text-xs font-bold text-gray-900 hover:text-purple-700 truncate block"
                    >
                      {order.productTitle}
                    </Link>
                    <p className="text-xs font-black text-purple-700 mt-0.5">
                      {order.itemPrice.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Décomposition financière */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span>Prix de l'article :</span>
                <span className="font-bold text-gray-900">{order.itemPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Frais de protection Séquestre (1%) :</span>
                <span className="font-bold text-purple-700">+ {order.validationFee.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Frais de livraison :</span>
                <span className="font-bold text-gray-900">
                  {order.deliveryFee > 0 ? `+ ${order.deliveryFee.toLocaleString('fr-FR')} FCFA` : 'Gratuit (0 FCFA)'}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-black text-gray-900 text-xs uppercase tracking-wider">Total payé</span>
                <span className="text-lg font-black text-purple-700">
                  {order.totalAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {isSeller && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex justify-between items-center font-bold">
                  <span>Gain net vendeur (après 20% commission) :</span>
                  <span className="text-xs font-black">{order.sellerPayout.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
            </div>

            {/* Paiement Mobile sous séquestre */}
            {order.payment && (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Moyen de règlement
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {order.payment.paymentMethodName || 'Mobile Money'}
                  </p>
                  <span className="text-[10px] font-mono text-gray-400">
                    Réf : {order.payment.transactionReference}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Payé & Sécurisé</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : LIVRAISON & VENDEUR */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Coordonnées de livraison & Contact
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Mode de commande
                </span>
                <p className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-purple-700" />
                  <span>{order.deliveryModeLabel || order.deliveryMode}</span>
                </p>
              </div>

              {order.deliveryAddress && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Adresse de livraison
                  </span>
                  <p className="font-semibold text-gray-800 mt-0.5 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {order.deliveryAddress}, {order.deliveryCity || 'Dakar'}
                    </span>
                  </p>
                </div>
              )}

              {order.deliveryPhone && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Numéro de contact pour le livreur
                  </span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{order.deliveryPhone}</span>
                  </p>
                </div>
              )}

              {/* Vendeur ou Acheteur Card */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  {isBuyer ? 'Votre vendeur' : 'Votre acheteur'}
                </span>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-150">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        (isBuyer ? order.seller?.profilePicture : order.buyer?.profilePicture) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          (isBuyer ? order.seller?.fullName : order.buyer?.fullName) || 'U'
                        )}&background=7c3aed&color=fff`
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-purple-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {isBuyer ? order.seller?.fullName : order.buyer?.fullName}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {isBuyer ? order.seller?.phone : order.buyer?.phone}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/messages"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discuter</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION NAVIGATION RAPIDE & CONTINUER LE SHOPPING */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-black text-gray-900">Que souhaitez-vous faire ensuite ?</h3>
            <p className="text-xs text-gray-500">
              Découvrez d'autres articles uniques sur la marketplace ou retournez à la vitrine principale.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
            >
              <Home className="w-4 h-4 text-purple-700" />
              <span>Accueil</span>
            </Link>
            <Link
              to="/catalog"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorer le catalogue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL D'ÉVALUATION & AVIS */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-center border border-gray-150 space-y-4 animate-scaleUp">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <h3 className="text-base font-black text-gray-900">Évaluez votre achat</h3>
            <p className="text-xs text-gray-500">
              Comment s'est déroulée votre transaction avec <strong>{order.seller?.fullName}</strong> ?
            </p>

            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold">
                🎉 Merci pour votre avis ! Les fonds ont bien été débloqués pour le vendeur.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Partagez votre avis sur la conformité de l'article, la rapidité d'envoi..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-700"
                />

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
                >
                  {reviewSubmitting ? 'Publication...' : 'Publier mon avis'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
