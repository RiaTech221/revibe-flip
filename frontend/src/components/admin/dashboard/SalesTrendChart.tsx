/**
 * Composant Tableau de Bord Admin : SalesTrendChart
 * 
 * Affiche et gère les indicateurs et visualisations pour les administrateurs ReVibe FliP (SalesTrendChart).
 */

import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface SalesTrendPoint {
  date?: string;
  label: string;
  amount: number;
  orderCount: number;
}

interface SalesTrendChartProps {
  data?: SalesTrendPoint[];
  formatPrice: (amount?: number) => string;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data = [],
  formatPrice,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalAmount = data.reduce((acc, d) => acc + (d.amount || 0), 0);
  const totalOrders = data.reduce((acc, d) => acc + (d.orderCount || 0), 0);
  const isPeriodEmpty = totalAmount === 0 && totalOrders === 0;

  const maxAmountRaw = Math.max(...data.map((d) => d.amount || 0), 0);
  const maxAmount = maxAmountRaw > 0 ? Math.ceil(maxAmountRaw / 10000) * 10000 : 50000;

  const maxOrdersRaw = Math.max(...data.map((d) => d.orderCount || 0), 0);
  const maxOrders = maxOrdersRaw > 0 ? Math.max(maxOrdersRaw, 4) : 4;

  const svgWidth = 600;
  const svgHeight = 200;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = data.map((pt, idx) => {
    const x =
      data.length > 1
        ? paddingLeft + (idx / (data.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const yAmount =
      paddingTop + chartHeight - (maxAmount > 0 ? (pt.amount / maxAmount) * chartHeight : 0);
    const yOrders =
      paddingTop + chartHeight - (maxOrders > 0 ? (pt.orderCount / maxOrders) * chartHeight : 0);
    return { x, yAmount, yOrders, pt, idx };
  });

  const pathAmount = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.yAmount}` : `${acc} L ${p.x} ${p.yAmount}`;
  }, '');

  const areaAmount =
    points.length > 0
      ? `${pathAmount} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  const pathOrders = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.yOrders}` : `${acc} L ${p.x} ${p.yOrders}`;
  }, '');

  const yTicksAmount = [
    { value: maxAmount, y: paddingTop },
    { value: Math.round(maxAmount / 2), y: paddingTop + chartHeight / 2 },
    { value: 0, y: paddingTop + chartHeight },
  ];

  const yTicksOrders = [
    { value: maxOrders, y: paddingTop },
    { value: Math.round(maxOrders / 2), y: paddingTop + chartHeight / 2 },
    { value: 0, y: paddingTop + chartHeight },
  ];

  const stepX = Math.max(1, Math.ceil(data.length / 7));
  const xLabels = points.filter((_, idx) => idx % stepX === 0 || idx === points.length - 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-2xs space-y-3">
      {/* En-tête sobre sans surcharge */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Ventes & Commandes
          </h3>
          <p className="text-xs text-slate-400">
            {formatPrice(totalAmount)} • {totalOrders} commande(s)
          </p>
        </div>

        {/* Légende simple */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-700" />
            <span>Montant</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>Commandes</span>
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 overflow-visible"
          role="img"
          aria-label={`Graphique des ventes`}
        >
          <defs>
            <linearGradient id="salesAmountGradClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lignes repères */}
          {yTicksAmount.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={svgWidth - paddingRight}
                y2={tick.y}
                stroke={idx === 2 ? '#CBD5E1' : '#F1F5F9'}
                strokeWidth={idx === 2 ? '1' : '0.8'}
                strokeDasharray={idx === 2 ? undefined : '3 3'}
              />
              <text
                x={paddingLeft - 6}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[9px] font-semibold fill-slate-400"
              >
                {tick.value >= 1000 ? `${Math.round(tick.value / 1000)}k` : tick.value}
              </text>
            </g>
          ))}

          {/* Graduations Droite */}
          {yTicksOrders.map((tick, idx) => (
            <text
              key={idx}
              x={svgWidth - paddingRight + 6}
              y={tick.y + 3}
              textAnchor="start"
              className="text-[9px] font-semibold fill-pink-400"
            >
              {tick.value}
            </text>
          ))}

          {areaAmount && <path d={areaAmount} fill="url(#salesAmountGradClean)" />}

          {pathAmount && (
            <path
              d={pathAmount}
              fill="none"
              stroke="#7E22CE"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {pathOrders && (
            <path
              d={pathOrders}
              fill="none"
              stroke="#EC4899"
              strokeWidth="1.8"
              strokeDasharray="3 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {hoveredIdx !== null && points[hoveredIdx] && (
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={paddingTop + chartHeight}
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {points.map((p) => (
            <circle
              key={`amt-${p.idx}`}
              cx={p.x}
              cy={p.yAmount}
              r={hoveredIdx === p.idx ? 4.5 : p.pt.amount > 0 ? 3 : 1.5}
              fill={p.pt.amount > 0 ? '#7E22CE' : '#CBD5E1'}
            />
          ))}

          {points.map((p, idx) => {
            const sliceWidth = chartWidth / Math.max(1, points.length);
            return (
              <rect
                key={`slice-${idx}`}
                x={p.x - sliceWidth / 2}
                y={paddingTop}
                width={sliceWidth}
                height={chartHeight + 10}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {xLabels.map((p) => (
            <text
              key={`xl-${p.idx}`}
              x={p.x}
              y={paddingTop + chartHeight + 15}
              textAnchor="middle"
              className="text-[9px] font-medium fill-slate-400"
            >
              {p.pt.label}
            </text>
          ))}
        </svg>

        {isPeriodEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-2xs rounded-xl text-center">
            <p className="text-xs font-semibold text-slate-500">
              Aucune vente sur cette période
            </p>
          </div>
        )}

        {hoveredIdx !== null && points[hoveredIdx] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[11px] shadow-lg pointer-events-none flex items-center gap-2">
            <span className="font-bold">{points[hoveredIdx].pt.label}</span>
            <span>•</span>
            <span className="font-bold text-purple-300">
              {formatPrice(points[hoveredIdx].pt.amount)}
            </span>
            <span>•</span>
            <span className="text-pink-300">
              {points[hoveredIdx].pt.orderCount} cmd
            </span>
          </div>
        )}
      </div>

      <div className="sr-only">
        <p>Total : {formatPrice(totalAmount)} pour {totalOrders} commande(s).</p>
      </div>
    </div>
  );
};

export default SalesTrendChart;
