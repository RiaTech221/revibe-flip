import React from 'react';
import { Receipt } from 'lucide-react';
import { Order } from '../../types';

interface TransactionHistoryTableProps {
  title: string;
  orders: Order[];
  role: 'buyer' | 'seller';
  formatPrice: (amount: number) => string;
}

const PAYMENT_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  COMPLETED: { label: 'Payé', badgeClass: 'bg-emerald-100 text-emerald-800' },
  PAID: { label: 'Payé', badgeClass: 'bg-emerald-100 text-emerald-800' },
  PENDING: { label: 'En attente', badgeClass: 'bg-amber-100 text-amber-800' },
  FAILED: { label: 'Échoué', badgeClass: 'bg-rose-100 text-rose-800' },
  REFUNDED: { label: 'Remboursé', badgeClass: 'bg-slate-100 text-slate-700' },
  CANCELLED: { label: 'Annulé', badgeClass: 'bg-slate-100 text-slate-600' },
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  title,
  orders,
  role,
  formatPrice,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden text-xs">
      <div className="p-4 sm:p-5 border-b border-gray-150 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-black text-gray-900 uppercase tracking-wider">
          <Receipt className="w-4 h-4 text-purple-700" />
          <span>{title}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Aucune transaction enregistrée pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">N° Transaction / Commande</th>
                <th className="p-3.5">Produit</th>
                <th className="p-3.5">{role === 'buyer' ? 'Montant Total' : 'Montant / Gain Net'}</th>
                <th className="p-3.5">Statut Paiement</th>
                <th className="p-3.5">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {orders.map((ord) => {
                const rawPayStatus = ord.payment?.status || (ord.status === 'PENDING_PAYMENT' || ord.status === 'AWAITING_PAYMENT' ? 'PENDING' : 'COMPLETED');
                const meta = PAYMENT_STATUS_META[rawPayStatus] || {
                  label: rawPayStatus,
                  badgeClass: 'bg-gray-100 text-gray-700',
                };
                const txNumber = ord.payment?.transactionReference || ord.orderNumber;

                return (
                  <tr key={ord.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-gray-900">{txNumber}</p>
                      {ord.payment?.transactionReference && (
                        <p className="text-[10px] text-gray-400 font-mono">Cmd: {ord.orderNumber}</p>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900 max-w-[200px] truncate">
                      {ord.productTitle}
                    </td>
                    <td className="p-3.5">
                      {role === 'buyer' ? (
                        <div>
                          <p className="font-black text-purple-700">{formatPrice(ord.totalAmount)}</p>
                          <p className="text-[10px] text-gray-400">
                            Article {formatPrice(ord.itemPrice)} + Frais {formatPrice((ord.validationFee || 0) + (ord.deliveryFee || 0))}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-black text-purple-700">{formatPrice(ord.sellerPayout)}</p>
                          <p className="text-[10px] text-gray-400">
                            Article {formatPrice(ord.itemPrice)} (Total {formatPrice(ord.totalAmount)})
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      {ord.payment?.paymentMethodName && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{ord.payment.paymentMethodName}</p>
                      )}
                    </td>
                    <td className="p-3.5 text-[11px] text-gray-500 whitespace-nowrap">
                      <p>Cmd : {formatDateTime(ord.createdAt)}</p>
                      {ord.payment?.paymentDate && (
                        <p className="text-[10px] text-gray-400">Payé : {formatDateTime(ord.payment.paymentDate)}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
