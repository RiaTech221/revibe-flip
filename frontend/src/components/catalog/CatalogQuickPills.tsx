import React from 'react';
import { Zap, MapPin, Sparkles } from 'lucide-react';

interface CatalogQuickPillsProps {
  under10kOnly: boolean;
  setUnder10kOnly: (val: boolean) => void;
  dakarOnly: boolean;
  setDakarOnly: (val: boolean) => void;
  topConditionOnly: boolean;
  setTopConditionOnly: (val: boolean) => void;
}

export const CatalogQuickPills: React.FC<CatalogQuickPillsProps> = ({
  under10kOnly,
  setUnder10kOnly,
  dakarOnly,
  setDakarOnly,
  topConditionOnly,
  setTopConditionOnly,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs">
      <button
        type="button"
        onClick={() => setUnder10kOnly(!under10kOnly)}
        className={`px-3 py-1.5 rounded-full border font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          under10kOnly
            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>Moins de 10 000 FCFA</span>
      </button>

      <button
        type="button"
        onClick={() => setDakarOnly(!dakarOnly)}
        className={`px-3 py-1.5 rounded-full border font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          dakarOnly
            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
        }`}
      >
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        <span>Dakar uniquement</span>
      </button>

      <button
        type="button"
        onClick={() => setTopConditionOnly(!topConditionOnly)}
        className={`px-3 py-1.5 rounded-full border font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          topConditionOnly
            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span>Comme neuf & Neuf</span>
      </button>
    </div>
  );
};
