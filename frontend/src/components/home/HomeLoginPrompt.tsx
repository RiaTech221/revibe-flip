/**
 * Section Page d'Accueil : HomeLoginPrompt
 * 
 * Composant visuel et interactif de la page d'accueil ReVibe FliP (HomeLoginPrompt).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface HomeLoginPromptProps {
  show: boolean;
  onClose: () => void;
}

export const HomeLoginPrompt: React.FC<HomeLoginPromptProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center justify-between gap-4 max-w-lg w-[92%] sm:w-auto animate-fade-in">
      <span className="text-xs sm:text-sm font-semibold text-slate-100">
        Connectez-vous et profitez-en plus !
      </span>
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          to="/login"
          className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
        >
          Se connecter
        </Link>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
