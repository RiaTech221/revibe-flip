/**
 * Page de Retour Paiement PayTech ReVibe FliP
 *
 * Vérifie côté serveur le statut réel du paiement après redirection depuis PayTech
 * (succès, annulation ou échec) et affiche le résultat synchronisé avec la base.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderApi, paymentApi } from '../services/api';
import { Order, Payment } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const statusParam = (searchParams.get('status') || '').toLowerCase();
  const orderIdParam = searchParams.get('orderId');

  const resolvedOrderId = Number(
    orderIdParam || sessionStorage.getItem('revibe_pending_payment_order_id') || 0
  );

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncPaymentState = useCallback(
    async (forceCancel: boolean) => {
      if (!resolvedOrderId) {
        setError("Identifiant de commande introuvable lors du retour de paiement.");
        setLoading(false);
        return;
      }

      setVerifying(true);
      setError(null);
      try {
        let currentPayment: Payment | null = null;
        if (forceCancel) {
          const cancelRes = await paymentApi.cancelByOrder(resolvedOrderId);
          currentPayment = cancelRes.data?.data || null;
        } else {
          for (let attempt = 0; attempt < 3; attempt++) {
            const verifyRes = await paymentApi.verifyByOrder(resolvedOrderId);
            currentPayment = verifyRes.data?.data || null;
            if (currentPayment && currentPayment.status !== 'INITIATED') {
              break;
            }
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        }

        const orderRes = await orderApi.getById(resolvedOrderId);
        const fetchedOrder = orderRes.data?.data || null;
        setOrder(fetchedOrder);
        setPayment(currentPayment || fetchedOrder?.payment || null);

        if (
          currentPayment?.status === 'SUCCESS' ||
          currentPayment?.status === 'FAILED' ||
          fetchedOrder?.status === 'PAID_ESCROW_LOCKED' ||
          fetchedOrder?.status === 'CANCELLED'
        ) {
          sessionStorage.removeItem('revibe_pending_payment_order_id');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Impossible de vérifier le statut du paiement auprès de PayTech."
        );
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    },
    [resolvedOrderId]
  );

  useEffect(() => {
    const isCancelReturn =
      statusParam === 'cancel' ||
      statusParam === 'cancelled' ||
      statusParam === 'failed' ||
      window.location.pathname.endsWith('/cancel');
    syncPaymentState(isCancelReturn);
  }, [statusParam, syncPaymentState]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-12 h-12 border-4 border-purple-700 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-base font-black text-gray-900">
          Vérification de votre paiement Mobile Money...
        </h2>
        <p className="text-xs text-gray-500 text-center max-w-sm">
          Nous confirmons le statut de la transaction auprès de PayTech. Veuillez patienter quelques secondes.
        </p>
      </div>
    );
  }

  const isSuccess =
    payment?.status === 'SUCCESS' || order?.status === 'PAID_ESCROW_LOCKED';
  const isFailed =
    payment?.status === 'FAILED' ||
    order?.status === 'CANCELLED' ||
    order?.status === 'EXPIRED';

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-7 border border-gray-150 shadow-sm text-center space-y-5">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                Fonds sécurisés sous séquestre
              </span>
              <h1 className="text-xl font-black text-gray-900">
                Paiement confirmé !
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                Votre règlement via{' '}
                <strong>{payment?.paymentMethodName || 'Mobile Money'}</strong> pour la commande{' '}
                <strong className="font-mono">{order?.orderNumber}</strong> a été validé.
              </p>
            </div>
          </>
        ) : isFailed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-black text-gray-900">
                Paiement non abouti ou annulé
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                La transaction n'a pas été confirmée. La commande{' '}
                <strong className="font-mono">{order?.orderNumber}</strong> a été annulée et l'article est de nouveau disponible à l'achat.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-black text-gray-900">
                Paiement en attente de confirmation
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                {error ||
                  "La notification de PayTech est encore en cours de traitement. Vous pouvez actualiser le statut ci-dessous."}
              </p>
            </div>
          </>
        )}

        {order && (
          <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-2 border border-gray-150">
            <div className="flex justify-between">
              <span className="text-gray-500">Article :</span>
              <span className="font-bold text-gray-900 truncate max-w-[230px]">
                {order.productTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Montant total :</span>
              <span className="font-black text-purple-700">
                {Number(order.totalAmount || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            {payment?.transactionReference && (
              <div className="flex justify-between">
                <span className="text-gray-500">Référence :</span>
                <span className="font-mono font-bold text-gray-800">
                  {payment.transactionReference}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {!isSuccess && !isFailed && resolvedOrderId > 0 && (
            <button
              type="button"
              onClick={() => syncPaymentState(false)}
              disabled={verifying}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              <span>Actualiser le statut</span>
            </button>
          )}

          {isFailed && order?.productId && (
            <Link
              to={`/product/${order.productId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Revoir l'article</span>
            </Link>
          )}

          {resolvedOrderId > 0 && (
            <Link
              to={`/orders/${resolvedOrderId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black transition-all"
            >
              <span>Voir la commande</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to="/catalog"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
          >
            <span>Catalogue</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturnPage;
