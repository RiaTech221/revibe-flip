import React from 'react';
import { Truck, MapPin, Phone, Copy, Check } from 'lucide-react';
import { Order } from '../../types';

interface OrderDeliveryCardProps {
  order: Order;
  copiedTracking: boolean;
  onCopyTracking: () => void;
}

export const OrderDeliveryCard: React.FC<OrderDeliveryCardProps> = ({
  order,
  copiedTracking,
  onCopyTracking,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-150">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-700" />
          <h3 className="text-sm font-black text-gray-900">Coordonnées de livraison</h3>
        </div>
        <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-[11px]">
          {order.deliveryModeLabel || (order.deliveryMode === 'HOME_DELIVERY' ? 'Livraison à domicile' : 'Remise en main propre')}
        </span>
      </div>

      <div className="space-y-3 text-gray-700">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-900 block">Adresse de réception :</span>
            <span className="text-gray-600">{order.deliveryAddress || 'Adresse communiquée au livreur'}</span>
            <span className="block text-gray-500 font-medium">{order.deliveryCity || 'Dakar, Sénégal'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <span className="font-bold text-gray-900">Téléphone de contact : </span>
            <span className="text-purple-700 font-bold">{order.deliveryPhone || '+221 77 000 00 00'}</span>
          </div>
        </div>

        {order.delivery?.trackingNumber && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-500">N° de suivi coursier :</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                {order.delivery.trackingNumber}
              </span>
              <button
                type="button"
                onClick={onCopyTracking}
                className="p-1 text-gray-400 hover:text-purple-700 transition-colors cursor-pointer"
                title="Copier le numéro de suivi"
              >
                {copiedTracking ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
