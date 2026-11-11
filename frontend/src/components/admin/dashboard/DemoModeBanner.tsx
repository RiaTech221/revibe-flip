import React from 'react';
import { Info } from 'lucide-react';

interface DemoModeBannerProps {
  demoMode?: boolean;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ demoMode }) => {
  if (!demoMode) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold animate-fadeIn"
    >
      <Info className="w-4 h-4 text-amber-600 shrink-0" />
      <span>
        <strong>Mode démonstration :</strong> les paiements sont simulés, aucun argent réel n’est encaissé.
      </span>
    </div>
  );
};

export default DemoModeBanner;
