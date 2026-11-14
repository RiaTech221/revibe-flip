/**
 * Section de Gestion Admin : AdminSettingsSection
 * 
 * Module de gestion dédié du back-office ReVibe FliP (AdminSettingsSection).
 */

import React from 'react';
import { Check, History } from 'lucide-react';
import { PlatformSettings, AdminActionLog } from '../../types';

interface AdminSettingsSectionProps {
  platformSettings: PlatformSettings | null;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
  validationFeeRate: number;
  setValidationFeeRate: (rate: number) => void;
  offerValidityHours: number;
  setOfferValidityHours: (hours: number) => void;
  reservationDurationHours: number;
  setReservationDurationHours: (hours: number) => void;
  platformName: string;
  setPlatformName: (name: string) => void;
  currency: string;
  setCurrency: (cur: string) => void;
  supportEmail: string;
  setSupportEmail: (email: string) => void;
  supportPhone: string;
  setSupportPhone: (phone: string) => void;
  settingsSavedMessage: boolean;
  actionLoading: boolean;
  onSaveSettings: (e: React.FormEvent) => void;
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

export const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  platformSettings,
  commissionRate,
  setCommissionRate,
  validationFeeRate,
  setValidationFeeRate,
  offerValidityHours,
  setOfferValidityHours,
  reservationDurationHours,
  setReservationDurationHours,
  platformName,
  setPlatformName,
  currency,
  setCurrency,
  supportEmail,
  setSupportEmail,
  supportPhone,
  setSupportPhone,
  settingsSavedMessage,
  actionLoading,
  onSaveSettings,
  auditLogs,
  auditPage,
  auditTotalPages,
  auditTotalElements,
  setAuditPage,
  formatDate,
  renderPagination,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Formulaire des paramètres de la plateforme */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-black text-gray-900">Paramètres de la Plateforme</h3>
        </div>

        {settingsSavedMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Paramètres enregistrés avec succès. Tous les calculs ont été actualisés.</span>
          </div>
        )}

        <form onSubmit={onSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">
              Commission Plateforme (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Actuellement appliqué : {platformSettings?.commissionRate || 20}% sur chaque vente
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">
              Frais de Validation Séquestre (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={validationFeeRate}
              onChange={(e) => setValidationFeeRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Actuellement appliqué : {platformSettings?.validationFeeRate || 1}% pour la garantie Escrow
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">
              Validité de l'offre directe chat (heures)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={offerValidityHours}
              onChange={(e) => setOfferValidityHours(parseInt(e.target.value) || 24)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Délai d'acceptation de l'offre (défaut : 24h)
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">
              Durée de réservation d'article (heures)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={reservationDurationHours}
              onChange={(e) => setReservationDurationHours(parseInt(e.target.value) || 24)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Temps accordé pour payer après acceptation avant remise en vente (défaut : 24h)
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Nom de la Marketplace</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Devise</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Email Support</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1.5">Téléphone Support (+221...)</label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-2xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-all shadow-md shadow-purple-700/20 disabled:opacity-50 cursor-pointer"
            >
              Enregistrer les Paramètres
            </button>
          </div>
        </form>
      </div>

      {/* Journal d'audit admin paginé */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              <span>Journal d'Audit des Actions Administrateur</span>
            </h3>
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
