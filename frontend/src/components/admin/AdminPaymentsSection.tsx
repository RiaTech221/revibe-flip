import React from 'react';
import { Search } from 'lucide-react';
import { AdminPayment } from '../../types';

interface AdminPaymentsSectionProps {
  payments: AdminPayment[];
  paymentMethodFilter: string;
  setPaymentMethodFilter: (method: string) => void;
  paymentSearch: string;
  setPaymentSearch: (query: string) => void;
  paymentPage: number;
  paymentTotalPages: number;
  paymentTotalElements: number;
  setPaymentPage: (page: number) => void;
  formatPrice: (price?: number | null) => string;
  formatDate: (dateStr?: string) => string;
  renderPagination: (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

export const AdminPaymentsSection: React.FC<AdminPaymentsSectionProps> = ({
  payments,
  paymentMethodFilter,
  setPaymentMethodFilter,
  paymentSearch,
  setPaymentSearch,
  paymentPage,
  paymentTotalPages,
  paymentTotalElements,
  setPaymentPage,
  formatPrice,
  formatDate,
  renderPagination,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Paiements & Séquestre</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPaymentPage(0);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">Tous les moyens de paiement</option>
              <option value="WAVE">Wave</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="FREE_MONEY">Free Money</option>
            </select>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={paymentSearch}
            onChange={(e) => {
              setPaymentSearch(e.target.value);
              setPaymentPage(0);
            }}
            placeholder="Rechercher par référence, n° commande, client..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
          />
        </div>

        {/* Table Paiements épurée */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[10px] font-black">
                <th className="py-3 px-3">Réf / Commande</th>
                <th className="py-3 px-3">Moyen & Date</th>
                <th className="py-3 px-3">Prix Article</th>
                <th className="py-3 px-3">Total Payé</th>
                <th className="py-3 px-3">Commission</th>
                <th className="py-3 px-3">Net Vendeur</th>
                <th className="py-3 px-3">Statut Séquestre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Aucune transaction trouvée.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-gray-900 block">{p.transactionReference}</span>
                      <span className="text-[10px] text-gray-400 block">{p.orderNumber}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-purple-700 block">
                        {p.paymentMethodName || p.paymentMethod}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{formatDate(p.createdAt)}</span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-800">{formatPrice(p.itemPrice)}</td>
                    <td className="py-3.5 px-3 font-black text-gray-900">{formatPrice(p.totalAmount)}</td>
                    <td className="py-3.5 px-3 font-bold text-purple-700">
                      {formatPrice(p.platformCommission)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600">{formatPrice(p.sellerPayout)}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.escrowStatus || 'LOCKED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(paymentPage, paymentTotalPages, paymentTotalElements, setPaymentPage)}
      </div>
    </div>
  );
};
