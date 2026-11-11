/**
 * Composant de Navigation Catalogue : CatalogSortBar
 * 
 * Composant interactif pour le filtrage, tri ou affichage des annonces du catalogue (CatalogSortBar).
 */

import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';

interface CatalogSortBarProps {
  totalElements: number;
  loading: boolean;
  sortBy: string;
  sortDir: string;
  onSortChange: (sortBy: string, sortDir: string) => void;
  onOpenMobileFilter: () => void;
  activeFiltersCount: number;
}

export const CatalogSortBar: React.FC<CatalogSortBarProps> = ({
  totalElements,
  loading,
  sortBy,
  sortDir,
  onSortChange,
  onOpenMobileFilter,
  activeFiltersCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-150">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black text-gray-900 tracking-tight">Catalogue ReVibe FliP</h1>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {loading ? '...' : `${totalElements} articles`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Bouton Filtres Mobile */}
        <button
          type="button"
          onClick={onOpenMobileFilter}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-xs active:scale-95 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-purple-700" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Menu Déroulant Tri */}
        <div className="relative flex items-center gap-1.5 text-xs text-gray-600">
          <span className="font-bold text-gray-400 hidden sm:inline">Trier par :</span>
          <div className="relative">
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split('-');
                onSortChange(sb, sd);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 font-bold text-gray-800 text-xs focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-xs"
            >
              <option value="createdAt-desc">Plus récents d'abord</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="viewCount-desc">Popularité & Vues</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
