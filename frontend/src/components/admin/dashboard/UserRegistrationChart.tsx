import React, { useState } from 'react';

interface UserTrendPoint {
  date: string;
  label: string;
  count: number;
}

interface UserRegistrationChartProps {
  data?: UserTrendPoint[];
  onNavigateTab: (tab: string) => void;
}

export const UserRegistrationChart: React.FC<UserRegistrationChartProps> = ({
  data = [],
  onNavigateTab,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxCountRaw = Math.max(...data.map((d) => d.count), 0);
  const maxCount = maxCountRaw > 0 ? maxCountRaw : 5;
  const totalNewUsers = data.reduce((acc, d) => acc + (d.count || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Nouveaux inscrits
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalNewUsers}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('users')}
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
        >
          Voir tout
        </button>
      </div>

      <div className="relative pt-2">
        <div className="flex items-end justify-between gap-1 h-20 px-1">
          {data.map((pt, idx) => {
            const heightPct = Math.max(
              Math.round((pt.count / maxCount) * 100),
              pt.count > 0 ? 15 : 4
            );
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative"
              >
                <div className="w-full flex justify-center h-16 items-end">
                  <div
                    className={`w-full max-w-[12px] rounded-t-sm transition-all duration-200 ${
                      isHovered
                        ? 'bg-pink-500 scale-105'
                        : pt.count > 0
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-slate-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-md z-10 pointer-events-none">
            {data[hoveredIdx].label} : {data[hoveredIdx].count}
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 px-1 pt-1.5 border-t border-slate-100">
          <span>{data[0]?.label}</span>
          {data.length > 4 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationChart;
