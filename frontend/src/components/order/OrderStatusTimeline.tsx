import React from 'react';
import { CheckCircle2, Clock, Truck, Package } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatusTimelineProps {
  order: Order;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ order }) => {
  const isPaid = order.status !== 'PENDING_PAYMENT';
  const isShipped =
    order.deliveryStatus === 'IN_TRANSIT' ||
    order.deliveryStatus === 'OUT_FOR_DELIVERY' ||
    order.deliveryStatus === 'DELIVERED';
  const isDelivered = order.deliveryStatus === 'DELIVERED' || order.status === 'COMPLETED';
  const isCompleted = order.status === 'COMPLETED';

  const steps = [
    {
      title: 'Paiement Séquestre Validé',
      subtitle: 'Fonds bloqués et sécurisés',
      completed: isPaid,
      current: order.status === 'PAID_ESCROW_LOCKED' && !isShipped,
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
