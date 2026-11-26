import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Search,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { AdminPayment, AdminDashboard } from '../../../types';

interface EasyPaymentsSectionProps {
  payments: AdminPayment[];
  dashboard: AdminDashboard | null;
  formatPrice: (amount?: number | null) => string;
  formatDate: (dateStr?: string) => string;
}

export const EasyPaymentsSection: React.FC<EasyPaymentsSectionProps> = ({
  payments,
  dashboard,
  formatPrice,
  formatDate,
}) => {
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY'>('ALL');
  const [search, setSearch] = useState('');

  const filteredPayments = payments.filter((p) => {
    const matchesMethod = filterMethod === 'ALL' || p.paymentMethod === filterMethod;
    const matchesSearch =
      search.trim() === '' ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(search.toLowerCase())) ||
      (p.orderNumber && p.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
      (p.payerPhoneNumber && p.payerPhoneNumber.includes(search));

    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EN-TÊTE & EXPLICATION TRÈS PÉDAGOGIQUE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protection & Sécurité des fonds</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              L'Argent des Ventes & Le Séquestre
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tous les paiements Mobile Money (Wave, Orange Money) sont protégés jusqu'à la livraison.
            </p>
          </div>
        </div>

        {/* Bannière explicative "Comment ça marche" */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 space-y-1">
            <strong className="text-emerald-900 font-bold block">
              💡 C'est quoi l'argent sous "Séquestre" ?
            </strong>
            <p className="text-gray-600 leading-relaxed">
              C'est la garantie ReVibe FliP : quand un acheteur paie, son argent n'est pas donné tout de suite au vendeur. La plateforme le garde en sécurité. Une fois le colis bien reçu et validé, l'argent est envoyé automatiquement au vendeur.
            </p>
          </div>
        </div>
      </div>

      {/* 2. LES 3 BLOCS FINANCIERS CLAIRS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* BLOC 1 : ARGENT EN SÉCURITÉ */}
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatPrice(dashboard?.escrowLockedFunds?.value)}
          </div>
          <div className="text-xs font-bold text-gray-800 mt-1">Argent actuellement protégé</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Argent des commandes en cours d'expédition ou en attente d'approbation.
          </p>
        </div>

        {/* BLOC 2 : COMMISSIONS DU SITE */}
        <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <Percent className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {formatPrice(dashboard?.totalCommissions)}
          </div>
          <div className="text-xs font-bold text-gray-800 mt-1">Gains du site ReVibe FliP</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Vos commissions (20%) et frais de validation (1%) prélevés sur chaque vente.
          </p>
        </div>

        {/* BLOC 3 : TOTAL PAIEMENTS REÇUS */}
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            {formatPrice(dashboard?.totalTransactionsAmount)}
          </div>
          <div className="text-xs font-bold text-gray-800 mt-1">Total des transactions</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Somme de tous les achats réglés par Mobile Money.
          </p>
        </div>
      </div>

      {/* 3. HISTORIQUE DES TRANSACTIONS SIMPLIFIÉ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-black text-gray-900">
            Détail des paiements par client
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-2xl shrink-0 text-xs font-bold">
            <button
              onClick={() => setFilterMethod('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMethod === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterMethod('WAVE')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMethod === 'WAVE' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Wave 🌊
            </button>
            <button
              onClick={() => setFilterMethod('ORANGE_MONEY')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMethod === 'ORANGE_MONEY' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Orange Money 🟠
            </button>
            <button
              onClick={() => setFilterMethod('FREE_MONEY')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMethod === 'FREE_MONEY' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              Free Money 📱
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de commande ou téléphone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Tableau épuré et compréhensible */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Aucun paiement correspondant trouvé.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((p) => {
              const isLocked = p.escrowStatus === 'LOCKED';
              const isReleased = p.escrowStatus === 'RELEASED_TO_SELLER';
              const isRefunded = p.escrowStatus === 'REFUNDED_TO_BUYER';

              let badgeBg = 'bg-gray-100 text-gray-700';
              let badgeText = 'En attente';

              if (isLocked) {
                badgeBg = 'bg-amber-100 text-amber-800 border border-amber-200';
                badgeText = '🔒 Argent en sécurité (Non débloqué)';
              } else if (isReleased) {
                badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                badgeText = '✅ Versé au vendeur';
              } else if (isRefunded) {
                badgeBg = 'bg-rose-100 text-rose-800 border border-rose-200';
                badgeText = '↩️ Remboursé au client';
              }

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-100/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-gray-900">
                        {p.orderNumber || `Réf: ${p.transactionReference}`}
                      </strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {p.paymentMethod === 'WAVE'
                          ? '🌊 Wave'
                          : p.paymentMethod === 'FREE_MONEY'
                          ? '📱 Free Money'
                          : '🟠 Orange Money'}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Payé par : <strong className="text-gray-700">{p.payerPhoneNumber || 'Client'}</strong> &bull; Date : {formatDate(p.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:text-right">
                    <div className="space-y-0.5">
                      <div className="text-sm font-black text-gray-900">
                        {formatPrice(p.totalAmount)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Part vendeur : <strong className="text-gray-800">{formatPrice(p.sellerPayout)}</strong> (Commission site : {formatPrice(p.platformCommission)})
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 text-center ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
