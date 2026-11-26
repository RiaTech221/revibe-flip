/**
 * Composant Suivi de Commande : OrderStatusTimeline
 * 
 * Affiche une section spécifique du suivi de commande, séquestre ou avis (OrderStatusTimeline).
 */

import React from 'react';
import { CheckCircle2, Clock, Truck, Package, XCircle } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatusTimelineProps {
  order: Order;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ order }) => {
  const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const isPaid = [
    'PAID_ESCROW_LOCKED',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'DISPUTED',
  ].includes(order.status);
  const isShipped =
    order.deliveryStatus === 'IN_TRANSIT' ||
    order.deliveryStatus === 'OUT_FOR_DELIVERY' ||
    order.deliveryStatus === 'DELIVERED';
  const isDelivered = order.deliveryStatus === 'DELIVERED' || order.status === 'COMPLETED';
  const isCompleted = order.status === 'COMPLETED';

  if (isCancelled) {
    return (
      <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-200 shadow-xs flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-black text-rose-950">
            {order.status === 'EXPIRED' ? 'Réservation expirée' : 'Commande annulée'}
          </h3>
          <p className="text-xs text-rose-800 mt-0.5">
            {order.payment?.status === 'FAILED'
              ? "Le paiement n'a pas abouti. La commande a été annulée et l'article est de nouveau disponible dans le catalogue."
              : "Cette commande a été annulée et l'article a été remis en vente."}
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: 'Paiement Séquestre Validé',
      subtitle: isPaid ? 'Fonds bloqués et sécurisés' : 'En attente de confirmation PayTech',
      completed: isPaid,
      current: !isPaid,
      icon: Clock,
    },
    {
      title: 'Préparation & Expédition',
      subtitle: 'Le vendeur prépare le colis',
      completed: isShipped,
      current: isPaid && !isShipped,
      icon: Package,
    },
    {
      title: 'En cours d\'acheminement',
      subtitle: 'Coursier moto en route',
      completed: isDelivered,
      current: isShipped && !isDelivered,
      icon: Truck,
    },
    {
      title: 'Livré & Escrow Débloqué',
      subtitle: 'Réception confirmée par l’acheteur',
      completed: isCompleted,
      current: isDelivered && !isCompleted,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4">
      <h3 className="text-sm font-black text-gray-900 tracking-tight">Suivi chronologique de la commande</h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="flex flex-col items-center text-center space-y-2 relative">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-colors z-10 ${
                  step.completed
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : step.current
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20 animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4
                  className={`text-xs font-bold ${
                    step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
