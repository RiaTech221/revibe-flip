import React from 'react';
import { AlertOctagon, HelpCircle } from 'lucide-react';

interface SellerSuspendedBannerProps {
  isSuspended?: boolean;
}

export const SellerSuspendedBanner: React.FC<SellerSuspendedBannerProps> = ({
  isSuspended,
}) => {
  if (!isSuspended) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
            Compte Vendeur Suspendu
          </h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
            Votre compte vendeur est actuellement suspendu par l'administration. Vos annonces ne sont plus visibles et aucune action commerciale n'est autorisée.
          </p>
        </div>
      </div>

      <a
        href="mailto:support@revibeflip.com"
        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 self-start sm:self-center transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Contacter le support</span>
      </a>
    </div>
  );
};

export default SellerSuspendedBanner;
