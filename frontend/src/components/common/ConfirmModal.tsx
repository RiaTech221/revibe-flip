/**
 * Composant Modale de Confirmation ReVibe FliP
 *
 * Remplace les boîtes de dialogue natives du navigateur (window.confirm)
 * par une fenêtre modale cohérente avec le design system de la plateforme.
 */

import React from 'react';
import { AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconContainerClass =
    variant === 'danger'
      ? 'bg-rose-50 text-rose-600'
      : variant === 'warning'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-purple-50 text-purple-700';

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-purple-700 hover:bg-purple-800 text-white';

  const Icon =
    variant === 'danger'
      ? Trash2
      : variant === 'warning'
      ? AlertTriangle
      : CheckCircle;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-150 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconContainerClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-gray-900 leading-snug">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${confirmButtonClass}`}
          >
            {loading ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
