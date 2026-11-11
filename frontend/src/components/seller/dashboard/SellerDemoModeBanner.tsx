import React from 'react';
import { Info } from 'lucide-react';

interface SellerDemoModeBannerProps {
  demoMode?: boolean;
}

export const SellerDemoModeBanner: React.FC<SellerDemoModeBannerProps> = ({
  demoMode,
}) => {
  if (!demoMode) return null;

  return (
    <div className="bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs text-slate-600">
      <Info className="w-4 h-4 text-slate-500 shrink-0" />
      <span>Mode démonstration : les paiements sont simulés, aucun argent réel n’est versé.</span>
    </div>
  );
};

export default SellerDemoModeBanner;
