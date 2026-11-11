import React from 'react';
import { Lightbulb, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { SellerTip } from '../../../services/sellerService';

interface SellerContextualTipsProps {
  tips?: SellerTip[];
  onNavigateTab: (tab: string, filter?: string) => void;
  disabled?: boolean;
}

export const SellerContextualTips: React.FC<SellerContextualTipsProps> = ({
  tips = [],
  onNavigateTab,
  disabled = false,
}) => {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span>Conseils pour développer vos ventes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tips.map((tip) => {
          const isWarning = tip.type === 'WARNING';
          const isSuggestion = tip.type === 'SUGGESTION';

          return (
            <div
              key={tip.id}
              onClick={!disabled && tip.actionTab ? () => onNavigateTab(tip.actionTab!, tip.actionFilter) : undefined}
              className={`p-3.5 rounded-2xl border transition-all text-xs flex items-start gap-3 ${
                disabled
                  ? 'opacity-60 bg-slate-50 border-slate-200'
                  : isWarning
                  ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60 cursor-pointer'
                  : isSuggestion
                  ? 'bg-purple-50/70 border-purple-200/80 hover:bg-purple-100/60 cursor-pointer'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl shrink-0 ${
                  isWarning
                    ? 'bg-amber-100 text-amber-700'
                    : isSuggestion
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isSuggestion ? (
                  <Lightbulb className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h5 className="font-bold text-slate-900 leading-snug">{tip.title}</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">{tip.message}</p>
                {tip.actionTab && !disabled && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 pt-1">
                    <span>Agir</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerContextualTips;
