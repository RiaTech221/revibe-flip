import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface EscrowShieldProps {
  compact?: boolean;
}

export const EscrowShield: React.FC<EscrowShieldProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Paiement Sécurisé Escrow</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-emerald-50 rounded-2xl p-4 border border-purple-100/60 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">Protection Achat & Vente Sécurisée (Escrow)</h4>
            <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Frais 1%</span>
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Vos fonds restent bloqués en lieu sûr sur un compte séquestre. Le vendeur n'est payé qu'une fois que vous confirmez la bonne réception de votre article.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-purple-600" /> Argent bloqué temporairement</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Déblocage sur confirmation acheteur</span>
          </div>
        </div>
      </div>
    </div>
  );
};
