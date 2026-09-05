import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, deliveryApi, reviewApi } from '../services/api';
import { Order, DeliveryStatus, EscrowStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { EscrowShield } from '../components/EscrowShield';
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
  X
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchOrder = () => {
    if (!id) return;
    setLoading(true);
    orderApi.getById(Number(id))
      .then((res) => {
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      })
      .catch((err) => {
        setError('Commande introuvable.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirmReceipt = async () => {
    if (!order) return;
    if (!window.confirm("Confirmez-vous avoir reçu l'article conforme ? Cette action débloquera les fonds pour le vendeur.")) {
      return;
    }

    try {
      const res = await orderApi.confirmReceipt(order.id);
      setOrder(res.data.data);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la confirmation de réception.");
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
      alert(err.response?.data?.message || "Erreur lors de la mise à jour de livraison.");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-gray-900">{error || 'Commande non trouvée'}</h2>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyer?.id;
  const isSeller = user?.id === order.seller?.id;
  const isDelivered = order.status === 'COMPLETED' || order.status === 'DELIVERED';
  const isEscrowLocked = order.payment?.escrowStatus === 'LOCKED';

  // Delivery step index for tracking bar
  const deliverySteps: { status: DeliveryStatus; label: string }[] = [
    { status: 'PENDING', label: 'Commande reçue' },
    { status: 'PICKED_UP', label: 'Pris en charge' },
    { status: 'IN_TRANSIT', label: 'En transit' },
    { status: 'OUT_FOR_DELIVERY', label: 'En cours de livraison' },
    { status: 'DELIVERED', label: 'Colis livré' },
  ];

  const currentStepIndex = deliverySteps.findIndex((s) => s.status === order.delivery?.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              Commande N° {order.orderNumber}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
            Suivi & Détails de la Commande
          </h1>
        </div>

        {/* Escrow badge */}
        <div>
          {isEscrowLocked ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Fonds sécurisés en séquestre (Escrow)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fonds libérés au vendeur</span>
            </div>
          )}
        </div>
      </div>

      {/* TRACKING TIMELINE BAR */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" />
            Acheminement du colis
          </h3>
          {order.delivery?.trackingNumber && (
            <span className="text-xs font-mono font-bold text-gray-500">
              N° de suivi : {order.delivery.trackingNumber}
            </span>
          )}
        </div>

        {/* Timeline visualization */}
        <div className="relative pt-4 pb-2">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
            <div
              style={{ width: `${Math.max(10, ((currentStepIndex + 1) / deliverySteps.length) * 100)}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-700"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {deliverySteps.map((step, idx) => {
              const isPastOrCurrent = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                      isCurrent
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isPastOrCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold ${isPastOrCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button for Buyer: Confirm Receipt */}
        {isBuyer && order.status !== 'COMPLETED' && (
          <div className="pt-4 border-t border-gray-100 bg-purple-50/60 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-purple-950">Avez-vous bien reçu votre article ?</h4>
                <p className="text-xs text-purple-800 mt-0.5">
                  Une fois vérifié, confirmez la réception pour libérer le paiement de {order.sellerPayout.toLocaleString('fr-FR')} FCFA à {order.seller?.fullName}.
                </p>
              </div>

              <button
                onClick={handleConfirmReceipt}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-transform active:scale-95 whitespace-nowrap flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>J'ai reçu mon colis (Libérer les fonds)</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Form for Seller: Update delivery status */}
        {isSeller && order.status !== 'COMPLETED' && (
          <form onSubmit={handleUpdateDelivery} className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-800">Mettre à jour le statut de livraison (Espace Vendeur) :</h4>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as DeliveryStatus)}
                className="p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              >
                <option value="PICKED_UP">Pris en charge</option>
                <option value="IN_TRANSIT">En cours d'acheminement</option>
                <option value="OUT_FOR_DELIVERY">En cours de livraison finale</option>
                <option value="DELIVERED">Livré à l'acheteur</option>
              </select>

              <input
                type="text"
                placeholder="Note ou contact livreur..."
                value={carrierNotes}
                onChange={(e) => setCarrierNotes(e.target.value)}
                className="flex-1 p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />

              <button
                type="submit"
                disabled={statusUpdating}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl"
              >
                {statusUpdating ? 'Mise à jour...' : 'Actualiser'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ORDER DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Product & Pricing breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            Article acheté
          </h3>

          <div className="flex gap-4 items-center">
            <img
              src={order.productImageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80'}
              alt={order.productTitle}
              className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shrink-0"
            />
            <div>
              <Link to={`/product/${order.productId}`} className="text-sm font-bold text-gray-900 hover:text-purple-700">
                {order.productTitle}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                {isBuyer ? `Vendeur : ${order.seller?.fullName}` : `Acheteur : ${order.buyer?.fullName}`}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Prix de l'article</span>
              <span>{order.itemPrice.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de protection Escrow (1%)</span>
              <span>{order.validationFee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span>{order.deliveryFee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
              <span>Total payé</span>
              <span className="text-purple-700">{order.totalAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>

            {isSeller && (
              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs font-bold text-emerald-800">
                <span>Rémunération nette vendeur (après 20% commission) :</span>
                <span>{order.sellerPayout.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Delivery address & Payment info */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            Livraison & Paiement
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Mode de livraison</span>
              <span className="font-bold text-gray-900">{order.deliveryModeLabel}</span>
            </div>

            {order.deliveryAddress && (
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Adresse</span>
                <span className="font-medium text-gray-800 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  {order.deliveryAddress}, {order.deliveryCity}
                </span>
              </div>
            )}

            {order.deliveryPhone && (
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Téléphone</span>
                <span className="font-medium text-gray-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {order.deliveryPhone}
                </span>
              </div>
            )}

            {order.payment && (
              <div className="pt-3 border-t border-gray-100">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Paiement Mobile</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {order.payment.paymentMethodName} • Réf : {order.payment.transactionReference}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {order.payment.escrowStatusDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-center border border-gray-100 space-y-4">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <h3 className="text-base font-bold text-gray-900">
              Évaluez votre transaction
            </h3>
            <p className="text-xs text-gray-500">
              Comment s'est passée votre expérience avec {order.seller?.fullName} ?
            </p>

            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold">
                Merci pour votre avis ! Il aide à renforcer la confiance dans la communauté.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star rating selector */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Partagez quelques mots sur l'état de l'article, la rapidité d'envoi..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                />

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  {reviewSubmitting ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
