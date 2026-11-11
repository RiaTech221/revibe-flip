/**
 * Composant Tableau de Bord Admin : DashboardError
 * 
 * Affiche et gère les indicateurs et visualisations pour les administrateurs ReVibe FliP (DashboardError).
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  message?: string;
  onRetry: () => void;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({
  message = "Impossible de récupérer les indicateurs du tableau de bord.",
  onRetry,
}) => {
  return (
    <div className="bg-white rounded-3xl p-10 border border-rose-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-black text-slate-900">
        Erreur de chargement du tableau de bord
      </h3>

      <p className="text-xs text-slate-500 leading-relaxed">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Réessayer</span>
      </button>
    </div>
  );
};

export default DashboardError;
