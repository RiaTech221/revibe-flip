/**
 * Section de Gestion Admin : AdminAuditSection
 *
 * Onglet dédié au Journal d'Audit des Actions Administrateur (en dehors des paramètres).
 */

import React from 'react';
import { History } from 'lucide-react';
import { AdminActionLog } from '../../types';

interface AdminAuditSectionProps {
  auditLogs: AdminActionLog[];
  auditPage: number;
  auditTotalPages: number;
  auditTotalElements: number;
  setAuditPage: (page: number) => void;
  formatDate: (dateStr?: string) => string;
  renderPagination: (
    currentPage: number,
    totalPages: number,
    totalElements: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

export const AdminAuditSection: React.FC<AdminAuditSectionProps> = ({
  auditLogs,
  auditPage,
  auditTotalPages,
  auditTotalElements,
  setAuditPage,
  formatDate,
  renderPagination,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              <span>Journal d'Audit des Actions Administrateur</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Traçabilité complète des suspensions, modifications de statut, violations de sécurité bloquées et suppressions
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Aucune action d'audit enregistrée pour le moment.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span
                    className={`font-black mr-2 px-2 py-0.5 rounded-md border text-[11px] ${
                      log.actionType.includes('SECURITY')
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}
                  >
                    {log.actionType}
                  </span>
                  <span className="text-gray-800 font-medium">{log.details}</span>
                </div>
                <div className="text-[11px] text-gray-400 text-right shrink-0">
                  {log.adminName} • {formatDate(log.createdAt)}
                </div>
              </div>
            ))
          )}
          {renderPagination(auditPage, auditTotalPages, auditTotalElements, setAuditPage)}
        </div>
      </div>
    </div>
  );
};
