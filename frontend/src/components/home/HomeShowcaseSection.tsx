/**
 * Section Page d'Accueil : HomeShowcaseSection
 * 
 * Composant visuel et interactif de la page d'accueil ReVibe FliP (HomeShowcaseSection).
 */

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';

export interface ShowcaseTab {
  id: string;
  label: string;
  categoryId?: number;
  keywords?: string[];
  maxPrice?: number;
}

interface HomeShowcaseSectionProps {
  tabs: ShowcaseTab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  products: Product[];
  loading: boolean;
}

export const HomeShowcaseSection: React.FC<HomeShowcaseSectionProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  products,
  loading,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-8">
      {/* Onglets des univers */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto hide-category-scrollbar no-scrollbar">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all border-b-2 -mb-[1px] cursor-pointer ${
                  isSelected
                    ? 'text-slate-950 border-slate-950 font-black'
                    : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille de cartes produits */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl aspect-[3/4] border border-slate-100 p-2" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-150 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Aucun article dans cette sélection</h3>
          <button
            onClick={() => setActiveTab('all')}
            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
          >
            Afficher toute la sélection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </main>
  );
};
