import React from 'react';
interface AdminReportsSectionProps {
  reports: any[];
  reportFilter: 'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED';
  setReportFilter: (filter: 'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED') => void;
  reportPage: number;
  reportTotalPages: number;
  reportTotalElements: number;
  setReportPage: (page: number) => void;
  onOpenReportModal: (report: any) => void;
  renderPagination: (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

export const AdminReportsSection: React.FC<AdminReportsSectionProps> = ({
  reports,
  reportFilter,
  setReportFilter,
  reportPage,
  reportTotalPages,
  reportTotalElements,
  setReportPage,
  onOpenReportModal,
  renderPagination,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Signalements & Litiges</h3>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setReportFilter(st);
                  setReportPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  reportFilter === st
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'ALL' && `Tous (${reportTotalElements})`}
                {st === 'PENDING' && 'En attente'}
                {st === 'RESOLVED' && 'Résolus'}
                {st === 'DISMISSED' && 'Rejetés'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des signalements */}
        <div className="divide-y divide-gray-100">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Aucun signalement dans cette section.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 rounded-2xl px-3 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                      {rep.reasonLabel || rep.reason || 'Autre'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {rep.status || 'PENDING'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-gray-900">
                    {rep.details || 'Aucun commentaire fourni.'}
                  </p>

                  <p className="text-[11px] text-gray-500">
                    Signalé par :{' '}
                    <strong>{rep.reporter?.fullName || rep.reporter?.firstName || 'Utilisateur'}</strong> •
                    Cible :{' '}
                    {rep.reportedProduct ? (
                      <strong className="text-purple-700">
                        Annonce: {rep.reportedProduct.title || 'Article'}
                      </strong>
                    ) : rep.reportedUser ? (
                      <strong className="text-purple-700">
                        Utilisateur: {rep.reportedUser.fullName || rep.reportedUser.firstName || 'Profil'}
                      </strong>
                    ) : (
                      'Contenu non spécifié'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onOpenReportModal(rep)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    Traiter le litige
                  </button>
                </div>
              </div>
            ))
          )}
          {renderPagination(reportPage, reportTotalPages, reportTotalElements, setReportPage)}
        </div>
      </div>
    </div>
  );
};
