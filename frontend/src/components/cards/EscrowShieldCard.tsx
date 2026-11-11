import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface EscrowShieldCardProps {
  compact?: boolean;
}

/**
 * Badge & Carte de protection séquestre ReVibe FliP (Garantie de paiement sécurisé).
 */
export const EscrowShieldCard: React.FC<EscrowShieldCardProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
        <span>Paiement sécurisé</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-2xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-purple-50 text-purple-700 rounded-xl shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-bold text-gray-900 text-xs">Paiement sécurisé</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500">
        <span className="flex items-center gap-1 text-purple-700">
          <Lock className="w-3 h-3" /> Garanti
        </span>
        <span className="flex items-center gap-1 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> Déblocage après réception
        </span>
      </div>
    </div>
  );
};

export const EscrowShield = EscrowShieldCard;
