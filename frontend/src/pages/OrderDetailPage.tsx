/**
 * Page de Détail et Suivi de Commande ReVibe FliP
 * 
 * Affichage complet d'une commande passée ou reçue :
 *  * - Frise chronologique interactive du statut de livraison et du séquestre
 *  * - Récapitulatif des articles, adresse d'expédition et montant consigné sous séquestre
 *  * - Actions selon le rôle : confirmer l'envoi (vendeur), valider la réception conforme (acheteur)
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, reviewApi } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, AlertCircle, ShoppingBag } from 'lucide-react';
import { OrderStatusTimeline } from '../components/order/OrderStatusTimeline';
import { OrderEscrowCard } from '../components/order/OrderEscrowCard';
import { OrderDeliveryCard } from '../components/order/OrderDeliveryCard';
import { OrderSummaryCard } from '../components/order/OrderSummaryCard';
import { OrderReviewModal } from '../components/order/OrderReviewModal';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const fetchOrder = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const numId = Number(id);

    orderApi
      .getById(numId)
      .then((res) => {
        if (res.data?.data) {
          setOrder(res.data.data);
        } else {
          setError('Commande introuvable.');
        }
      })
      .catch(() => {
        setError('Impossible de charger les détails de cette commande.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirmReceipt = async () => {
    if (!order) return;
    if (!confirm("Avez-vous bien reçu l'article conforme ? Cette action débloquera les fonds sous séquestre au vendeur.")) {
      return;
    }
    try {
      setConfirmingReceipt(true);
      await orderApi.confirmReceipt(order.id);
      fetchOrder();
      setIsReviewModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de la confirmation de réception.");
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const handleCopyTracking = () => {
    if (order?.delivery?.trackingNumber) {
      navigator.clipboard.writeText(order.delivery.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setReviewSubmitting(true);
      await reviewApi.create({
        orderId: order.id,
        rating,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement de l'avis.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-gray-400">
        Chargement des détails de la commande...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Commande introuvable</h2>
        <Link to="/profile" className="text-xs font-bold text-purple-700 hover:underline">
          Retour à mes commandes
        </Link>
      </div>
    );
  }

  const isBuyer = order.buyer?.id === user?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Retour et En-tête */}
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-purple-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Mes commandes</span>
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-gray-500">Commande :</span>
          <span className="font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
            {order.orderNumber}
          </span>
        </div>
      </div>

      {/* 1. Chronologie de commande */}
      <OrderStatusTimeline order={order} />

      {/* 2. Statut Séquestre & Bouton de confirmation */}
      <OrderEscrowCard
        order={order}
        isBuyer={isBuyer}
        onConfirmReceipt={handleConfirmReceipt}
        confirmingReceipt={confirmingReceipt}
        onOpenReviewModal={() => setIsReviewModalOpen(true)}
      />

      {/* 3. Détails en 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <OrderDeliveryCard
          order={order}
          copiedTracking={copiedTracking}
          onCopyTracking={handleCopyTracking}
        />
        <OrderSummaryCard order={order} formatPrice={formatPrice} />
      </div>

      {/* 4. Modale d'évaluation */}
      <OrderReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewSubmitted(false);
        }}
        rating={rating}
        setRating={setRating}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        reviewSubmitting={reviewSubmitting}
        reviewSubmitted={reviewSubmitted}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};
