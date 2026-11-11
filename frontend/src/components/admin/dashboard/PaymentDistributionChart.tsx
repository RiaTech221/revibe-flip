import React from 'react';

interface PaymentDistributionPoint {
  paymentMethod: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface PaymentDistributionChartProps {
  distributions?: PaymentDistributionPoint[];
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const PaymentDistributionChart: React.FC<PaymentDistributionChartProps> = ({
  distributions = [],
  formatPrice,
  onNavigateTab,
}) => {
  const methods = [
    { key: 'WAVE', label: 'Wave', color: '#00D1FF' },
    { key: 'ORANGE_MONEY', label: 'Orange Money', color: '#FF7900' },
    { key: 'FREE_MONEY', label: 'Free Money', color: '#CD1224' },
  ];

  const totalPaymentsCount = distributions.reduce((acc, d) => acc + (d.count || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Moyens de paiement
        </h3>
        <button
          type="button"
          onClick={() => onNavigateTab('payments')}
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
        >
          Détails
        </button>
      </div>

      {/* Segmented bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
        {methods.map((m) => {
          const item =
            distributions.find(
              (d) =>
                d.paymentMethod?.toLowerCase().includes(m.key.toLowerCase()) ||
                d.paymentMethod?.toLowerCase().includes(m.label.toLowerCase())
            ) || { count: 0, totalAmount: 0, percentage: 0 };

          const pct =
            totalPaymentsCount > 0
              ? Math.round((item.count / totalPaymentsCount) * 100)
              : 33;

          return (
            <div
              key={`bar-${m.key}`}
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.max(pct, 4)}%`,
                backgroundColor: m.color,
              }}
              title={`${m.label}: ${pct}%`}
            />
          );
        })}
      </div>

      {/* 3 rows */}
      <div className="space-y-1.5 pt-1">
        {methods.map((m) => {
          const item =
            distributions.find(
              (d) =>
                d.paymentMethod?.toLowerCase().includes(m.key.toLowerCase()) ||
                d.paymentMethod?.toLowerCase().includes(m.label.toLowerCase())
            ) || { count: 0, totalAmount: 0, percentage: 0 };

          const pct =
            totalPaymentsCount > 0
              ? Math.round((item.count / totalPaymentsCount) * 100)
              : 0;

          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onNavigateTab('payments', m.key)}
              className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span className="font-semibold text-slate-800">{m.label}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="font-bold text-slate-900">{formatPrice(item.totalAmount)}</span>
                <span className="text-slate-400 text-[11px] w-9">({pct}%)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentDistributionChart;
