import React from 'react';
import { DollarSign } from 'lucide-react';
import { SellerDashboard, SellerTransaction } from '../../services/api';

interface SellerFinancesTabProps {
  dashboard: SellerDashboard | null;
  transactions: SellerTransaction[];
  formatPrice: (amount?: number) => string;
}

export const SellerFinancesTab: React.FC<SellerFinancesTabProps> = ({
  dashboard,
  transactions,
  formatPrice,
}) => {
  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finances & Gains</h1>
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
          <h3 className="text-2xl font-black text-amber-600">{formatPrice(dashboard?.pendingEscrowAmount ?? dashboard?.pendingEscrow?.value ?? 0)}</h3>
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
        <div className="p-5 border-b border-gray-150 font-black text-xs text-gray-900 uppercase tracking-wider">
          Historique des transactions & Payouts
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
                  <th className="p-4">N° Commande</th>
                  <th className="p-4">Article</th>
                  <th className="p-4">Acheteur</th>
                  <th className="p-4">Gain Net (Payout)</th>
                  <th className="p-4">Séquestre</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {transactions.map((t, idx) => (
                  <tr key={t.orderId || idx} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-gray-900">{t.orderNumber}</td>
                    <td className="p-4 font-bold text-gray-900 max-w-xs truncate">{t.productTitle}</td>
                    <td className="p-4 text-gray-600">{t.buyerName}</td>
                    <td className="p-4 font-black text-purple-700">{formatPrice(t.sellerPayout)}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {t.escrowStatus || 'LOCKED'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
