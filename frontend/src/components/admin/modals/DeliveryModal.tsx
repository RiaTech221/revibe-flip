import React from 'react';
import { X } from 'lucide-react';
import { Order, DeliveryStatus } from '../../../types';

interface DeliveryModalProps {
  order: Order | null;
  newDeliveryStatus: DeliveryStatus;
  setNewDeliveryStatus: (status: DeliveryStatus) => void;
  deliveryNote: string;
  setDeliveryNote: (note: string) => void;
  actionLoading: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  order,
  newDeliveryStatus,
  setNewDeliveryStatus,
  deliveryNote,
  setDeliveryNote,
  actionLoading,
  onClose,
  onSave,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-150 pb-3">
          <div>
            <h3 className="text-base font-black text-gray-900">
              Suivi Livraison {order.orderNumber}
            </h3>
            <p className="text-xs text-gray-500">Mettre à jour l'étape de livraison logistique</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Étape de livraison</label>
            <select
              value={newDeliveryStatus}
              onChange={(e) => setNewDeliveryStatus(e.target.value as DeliveryStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="PENDING">1. En attente de prise en charge (PENDING)</option>
              <option value="PICKED_UP">2. Colis pris en charge (PICKED_UP)</option>
              <option value="IN_TRANSIT">3. En cours d'acheminement (IN_TRANSIT)</option>
              <option value="OUT_FOR_DELIVERY">4. En cours de livraison (OUT_FOR_DELIVERY)</option>
              <option value="DELIVERED">5. Livré au destinataire (DELIVERED)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Note de suivi / Observation</label>
            <textarea
              rows={3}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Ex: Livreur Abdoulaye en route, contact client établi..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 disabled:opacity-50 cursor-pointer"
            >
              Valider l'étape
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
