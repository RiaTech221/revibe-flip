/**
 * Onglet / Vue Vendeur : SellerFinancesTab
 * 
 * Module interactif pour la gestion des finances, payouts et historique des transactions vendeur.
 * Cliquer sur une ligne de transaction ouvre le détail complet de la commande (/orders/:id).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SellerDashboard, SellerTransaction } from '../../services/api';

interface SellerFinancesTabProps {
  dashboard: SellerDashboard | null;
  transactions: SellerTransaction[];
  formatPrice: (amount?: number) => string;
}

function formatPaymentLabel(status?: string): { label: string; cls: string } {
  switch (status) {
    case 'SUCCESS':
    case 'PAID':
    case 'COMPLETED':
      return { label: 'Payé', cls: 'bg-blue-50 text-blue-800' };
    case 'FAILED':
      return { label: 'Échoué', cls: 'bg-rose-50 text-rose-700' };
    case 'REFUNDED':
      return { label: 'Remboursé', cls: 'bg-slate-100 text-slate-700' };
    default:
      return { label: status || 'En attente', cls: 'bg-amber-50 text-amber-800' };
  }
}

function formatEscrowLabel(status?: string): { label: string; cls: string } {
  switch (status) {
    case 'RELEASED_TO_SELLER':
    case 'RELEASED':
      return { label: 'Libéré au vendeur', cls: 'bg-emerald-100 text-emerald-800' };
    case 'REFUNDED_TO_BUYER':
      return { label: 'Remboursé', cls: 'bg-slate-100 text-slate-700' };
    case 'LOCKED':
      return { label: 'Sous séquestre', cls: 'bg-purple-100 text-purple-800' };
    default:
      return { label: status || 'LOCKED', cls: 'bg-gray-100 text-gray-700' };
  }
}

export const SellerFinancesTab: React.FC<SellerFinancesTabProps> = ({
  dashboard,
  transactions,
  formatPrice,
}) => {
  const navigate = useNavigate();

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finances &amp; Gains</h1>
        <p className="text-xs text-gray-400 mt-0.5">Suivi de vos versements et de la protection séquestre</p>
      </div>

      {/* Cartes financières */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Solde Disponible</span>
          <h3 className="text-2xl font-black text-purple-700">{formatPrice(dashboard?.netEarnings)}</h3>
          <p className="text-[11px] text-gray-500">Prêt pour virement Wave / Orange Money</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bloqué sous Séquestre</span>
          <h3 className="text-2xl font-black text-amber-600">
            {formatPrice(dashboard?.pendingEscrowAmount ?? dashboard?.pendingEscrow?.value ?? 0)}
          </h3>
          <p className="text-[11px] text-gray-500">Libéré dès confirmation de livraison par l'acheteur</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Commission ReVibe (20%)</span>
          <h3 className="text-2xl font-black text-gray-900">{dashboard?.commissionRate || 20}%</h3>
          <p className="text-[11px] text-gray-500">Frais de mise en relation et protection anti-fraude</p>
        </div>
      </div>

      {/* Historique des transactions */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex items-center justify-between gap-2">
          <span className="font-black text-xs text-gray-900 uppercase tracking-wider">
            Mes commandes / Mes transactions &amp; Payouts
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            Cliquez sur une ligne pour voir le détail
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucun historique de transaction disponible pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">N° Transaction / Commande</th>
                  <th className="p-4">Article</th>
                  <th className="p-4">Montants (Total / Frais 1% / Net)</th>
                  <th className="p-4">Statut Paiement &amp; Séquestre</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {transactions.map((t, idx) => {
                  const txRef = t.transactionReference || t.orderNumber;
                  const totalBuyer =
                    (t.itemPrice || 0) + (t.validationFee || 0) + (t.deliveryFee || 0);
                  const payMeta = formatPaymentLabel(t.paymentStatus);
                  const escrowMeta = formatEscrowLabel(t.escrowStatus);

                  return (
                    <tr
                      key={t.orderId || idx}
                      onClick={() => t.orderId && navigate(`/orders/${t.orderId}`)}
                      className={`transition-colors ${
                        t.orderId ? 'hover:bg-purple-50/40 cursor-pointer group' : ''
                      }`}
                    >
                      <td className="p-4">
                        <p className="font-mono font-bold text-gray-900">{txRef}</p>
                        {t.transactionReference && (
                          <p className="text-[10px] text-gray-400 font-mono">Cmd : {t.orderNumber}</p>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-900 max-w-xs truncate">
                        {t.productTitle}
                      </td>
                      <td className="p-4">
                        <p className="font-black text-purple-700">
                          Net vendeur : {formatPrice(t.sellerPayout)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Total : {formatPrice(totalBuyer)} • Frais 1% : {formatPrice(t.validationFee)}
                        </p>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${payMeta.cls}`}>
                            {payMeta.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${escrowMeta.cls}`}>
                            {escrowMeta.label}
                          </span>
                        </div>
                        {(t.paymentMethodName || t.paymentMethod) && (
                          <p className="text-[10px] text-gray-400">
                            {t.paymentMethodName || t.paymentMethod}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 whitespace-nowrap text-[11px]">
                        <p>Créée : {formatDateTime(t.createdAt)}</p>
                        {t.releasedAt && (
                          <p className="text-[10px] text-emerald-700">
                            Libérée : {formatDateTime(t.releasedAt)}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {t.orderId && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-[11px] group-hover:bg-purple-700 group-hover:text-white transition-colors">
                            <span>Voir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
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
    </div>
  );
};
