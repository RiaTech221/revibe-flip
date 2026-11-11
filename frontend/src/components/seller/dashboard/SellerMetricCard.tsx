import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface SellerMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changePercentage?: number | null;
  sparkline?: number[];
  icon: React.ReactNode;
  iconBgColor?: string;
  tooltipText?: string;
  onClick?: () => void;
  badgeLabel?: string;
  badgeAction?: () => void;
  isPositiveGood?: boolean;
  disabled?: boolean;
}

export const SellerMetricCard: React.FC<SellerMetricCardProps> = ({
  title,
  value,
  subtitle,
  changePercentage,
  sparkline,
  icon,
  iconBgColor = 'bg-purple-50 text-purple-700',
  tooltipText,
  onClick,
  badgeLabel,
  badgeAction,
  isPositiveGood = true,
  disabled = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const hasChange = changePercentage !== undefined && changePercentage !== null;
  const isZero = hasChange && Math.abs(changePercentage) < 0.01;
  const isPositive = hasChange && changePercentage > 0;
  const isNegative = hasChange && changePercentage < 0;

  const isGood = isPositiveGood ? isPositive : isNegative;

  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 50;
    const height = 18;

    const points = sparkline
      .map((val, idx) => {
        const x = (idx / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isGood ? '#10B981' : '#7E22CE';

    return (
      <svg width={width} height={height} className="shrink-0 overflow-visible" aria-hidden="true">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs transition-all flex flex-col justify-between ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-purple-300 hover:shadow-xs cursor-pointer group'
      }`}
    >
      {/* Haut : Titre + Info tooltip + Icône */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
            {title}
          </span>
          {tooltipText && (
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                className="text-slate-400 hover:text-purple-700 p-0.5 cursor-pointer"
                aria-label="Information"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed font-normal rounded-xl shadow-xl z-50 pointer-events-none">
                  {tooltipText}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {/* Centre : Valeur & Sparkline */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        {renderSparkline()}
      </div>

      {/* Bas : Variation % / sous-titre / badge */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
        {hasChange ? (
          <span
            className={`font-semibold inline-flex items-center gap-0.5 ${
              isZero
                ? 'text-slate-400'
                : isGood
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {isZero ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{changePercentage! > 0 ? `+${changePercentage}` : changePercentage}%</span>
          </span>
        ) : subtitle ? (
          <span className="text-slate-400 font-medium truncate">{subtitle}</span>
        ) : (
          <span />
        )}

        {badgeLabel && (
          <button
            type="button"
            onClick={(e) => {
              if (badgeAction) {
                e.stopPropagation();
                badgeAction();
              }
            }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            {badgeLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerMetricCard;
