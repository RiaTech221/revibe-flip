import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface EasyReportsSectionProps {
  reports: any[];
  onOpenReportModal: (report: any) => void;
  formatDate: (dateStr?: string) => string;
}

export const EasyReportsSection: React.FC<EasyReportsSectionProps> = ({
  reports,
  onOpenReportModal,
  formatDate,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  const filteredReports = reports.filter((r) => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'RESOLVED') return r.status === 'RESOLVED' || r.status === 'DISMISSED';
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EN-TÊTE FACILE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Réclamations & Litiges</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Régler les Problèmes et Réclamations
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Quand un acheteur ou vendeur signale un souci sur un colis ou une annonce, vous tranchez ici en toute simplicité.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                pendingCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {pendingCount > 0 ? `⚠️ ${pendingCount} réclamation(s) à traiter` : '✅ Zéro litige en attente'}
            </span>
          </div>
        </div>

        {/* Filtres simples */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl w-fit text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            Toutes ({reports.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'PENDING' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            À traiter ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            Réglés / Fermés ({reports.length - pendingCount})
          </button>
        </div>
      </div>

      {/* 2. LISTE DES LITIGES */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-150">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-800">Aucun signalement dans cette liste</h4>
          <p className="text-xs text-gray-400 mt-1">
            Tous les clients sont satisfaits et aucun litige n'est ouvert.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => {
            const isPending = rep.status === 'PENDING';
            const isResolved = rep.status === 'RESOLVED';
            const isDismissed = rep.status === 'DISMISSED';

            let statusBadge = {
              text: '⏳ À examiner par vous',
              bg: 'bg-amber-100 text-amber-800 border-amber-200',
            };

            if (isResolved) {
              statusBadge = {
                text: '✅ Litige résolu',
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              };
            } else if (isDismissed) {
              statusBadge = {
                text: '❌ Réclamation classée sans suite',
                bg: 'bg-gray-100 text-gray-700 border-gray-200',
              };
            }

            return (
              <div
                key={rep.id}
                className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-200 transition-all"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-xl">
                      Signalement #{rep.id}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${statusBadge.bg}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-gray-900">
                      Motif : {rep.reasonLabel || rep.reason || 'Problème signalé'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-3 rounded-2xl border border-gray-100 italic">
                      « {rep.details || 'Aucune description fournie.'} »
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      Signalé par :{' '}
                      <strong className="text-gray-800">
                        {rep.reporter?.fullName || rep.reporter?.firstName || rep.reporterName || rep.reporterPhone || 'Utilisateur'}
                      </strong>
                    </span>
                    {rep.reportedProduct && (
                      <span>
                        &bull; Annonce : <strong className="text-purple-700">{rep.reportedProduct.title || 'Article'}</strong>
                      </span>
                    )}
                    {!rep.reportedProduct && rep.reportedUser && (
                      <span>
                        &bull; Membre : <strong className="text-purple-700">{rep.reportedUser.fullName || rep.reportedUser.firstName || 'Profil'}</strong>
                      </span>
                    )}
                    <span>&bull; Date : {formatDate(rep.createdAt)}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenReportModal(rep)}
                    className="h-11 px-5 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <span>Prendre une décision</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
