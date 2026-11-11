/**
 * Composant Suivi de Commande : OrderSummaryCard
 * 
 * Affiche une section spécifique du suivi de commande, séquestre ou avis (OrderSummaryCard).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageSquare, ExternalLink } from 'lucide-react';
import { Order } from '../../types';

interface OrderSummaryCardProps {
  order: Order;
  formatPrice: (amount: number) => string;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order, formatPrice }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-150">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-purple-700" />
          <h3 className="text-sm font-black text-gray-900">Récapitulatif financier</h3>
        </div>
        <span className="font-mono text-xs font-bold text-gray-400">
          {order.orderNumber}
        </span>
      </div>

      {/* Article unique */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
        <img
          src={
            order.productImageUrl ||
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=150&q=80'
          }
          alt={order.productTitle}
          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
        />
        <div className="min-w-0 flex-1">
          <Link
            to={order.productId ? `/product/${order.productId}` : '#'}
            className="font-bold text-gray-900 hover:text-purple-700 text-xs block truncate"
          >
            {order.productTitle || 'Article commandé'}
          </Link>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            <span>Vendeur : {order.seller?.fullName || 'Vendeur certifié'}</span>
            <span>•</span>
            <span className="font-bold text-purple-700">{formatPrice(order.itemPrice)}</span>
          </div>
        </div>
        {order.productId && (
          <Link
            to={`/messages?productId=${order.productId}`}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-purple-700 transition-colors shrink-0"
            title="Contacter le vendeur"
          >
            <MessageSquare className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Lignes de calcul */}
      <div className="space-y-2 pt-2 border-t border-gray-150 text-gray-600">
        <div className="flex justify-between items-center">
          <span>Prix de l'article :</span>
          <span className="font-bold text-gray-900">{formatPrice(order.itemPrice)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Frais de protection séquestre (1%) :</span>
          <span className="font-bold text-purple-700">+ {formatPrice(order.validationFee)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Frais de livraison :</span>
          <span className="font-bold text-gray-900">
            {order.deliveryFee > 0 ? `+ ${formatPrice(order.deliveryFee)}` : 'Gratuit (0 FCFA)'}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-900">
          <span>Total net débité :</span>
          <span className="text-purple-700 font-black text-base">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};
