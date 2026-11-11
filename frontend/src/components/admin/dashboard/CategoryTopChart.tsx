import React, { useState } from 'react';

interface CategoryTopPoint {
  name: string;
  productCount: number;
  orderCount?: number;
  totalAmount?: number;
  percentage: number;
}

interface CategoryTopChartProps {
  categoriesBySales?: CategoryTopPoint[];
  categoriesByProducts?: CategoryTopPoint[];
  categories?: CategoryTopPoint[];
  formatPrice: (amount?: number) => string;
  onNavigateTab: (tab: string) => void;
}

export const CategoryTopChart: React.FC<CategoryTopChartProps> = ({
  categoriesBySales = [],
  categoriesByProducts = [],
  categories = [],
  formatPrice,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'sales' | 'products'>('sales');

  const salesList =
    categoriesBySales && categoriesBySales.length > 0
      ? categoriesBySales
      : categories;
  const productsList =
    categoriesByProducts && categoriesByProducts.length > 0
      ? categoriesByProducts
      : categories;

  const currentList = viewMode === 'sales' ? salesList : productsList;

  if (!currentList || currentList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs text-center py-8">
        <p className="text-xs text-slate-400">Aucun rayon</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Top Rayons
        </h3>

        {/* Toggle */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setViewMode('sales')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'sales'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Ventes
          </button>
          <button
            type="button"
            onClick={() => setViewMode('products')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'products'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Annonces
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 pt-1">
        {currentList.slice(0, 5).map((cat, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                <span className="text-slate-400 font-normal mr-1.5">#{idx + 1}</span>
                {cat.name}
              </span>

              <span className="text-slate-500 font-semibold text-[11px] shrink-0">
                {viewMode === 'sales' ? (
                  <span className="text-purple-700 font-bold">
                    {formatPrice(cat.totalAmount ?? 0)}
                  </span>
                ) : (
                  <span>{cat.productCount} art.</span>
                )}
              </span>
            </div>

            <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(cat.percentage || 0, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTopChart;
