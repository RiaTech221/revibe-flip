/**
 * Composant de Navigation Catalogue : CatalogActiveFilters
 * 
 * Composant interactif pour le filtrage, tri ou affichage des annonces du catalogue (CatalogActiveFilters).
 */

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Category } from '../../types';

interface CatalogActiveFiltersProps {
  categoryId: string;
  categories: Category[];
  selectedSubcategory: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  selectedSize: string;
  selectedColor: string;
  selectedFabric: string;
  city: string;
  query: string;
  onClearFilter: (key: string) => void;
  onResetAll: () => void;
}

export const CatalogActiveFilters: React.FC<CatalogActiveFiltersProps> = ({
  categoryId,
  categories,
  selectedSubcategory,
  minPrice,
  maxPrice,
  condition,
  selectedSize,
  selectedColor,
  selectedFabric,
  city,
  query,
  onClearFilter,
  onResetAll,
}) => {
  const activeTags: { key: string; label: string }[] = [];

  if (query) activeTags.push({ key: 'query', label: `Recherche : "${query}"` });
  if (categoryId) {
    const cat = categories.find((c) => String(c.id) === categoryId);
    if (cat) activeTags.push({ key: 'categoryId', label: cat.name });
  }
  if (selectedSubcategory) activeTags.push({ key: 'selectedSubcategory', label: `Sous-rayon : ${selectedSubcategory}` });
  if (minPrice || maxPrice) {
    activeTags.push({
      key: 'price',
      label: `Prix : ${minPrice || '0'} - ${maxPrice || '∞'} FCFA`,
    });
  }
  if (condition) activeTags.push({ key: 'condition', label: `État : ${condition}` });
  if (selectedSize) activeTags.push({ key: 'selectedSize', label: `Taille : ${selectedSize}` });
  if (selectedColor) activeTags.push({ key: 'selectedColor', label: `Couleur : ${selectedColor}` });
  if (selectedFabric) activeTags.push({ key: 'selectedFabric', label: `Matière : ${selectedFabric}` });
  if (city) activeTags.push({ key: 'city', label: `Ville : ${city}` });

  if (activeTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filtres actifs :</span>
      {activeTags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold"
        >
          <span>{tag.label}</span>
          <button
            type="button"
            onClick={() => onClearFilter(tag.key)}
            className="hover:text-rose-600 transition-colors cursor-pointer"
            title="Supprimer ce filtre"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onResetAll}
        className="text-xs font-bold text-gray-500 hover:text-purple-700 flex items-center gap-1 ml-2 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Réinitialiser tout</span>
      </button>
    </div>
  );
};
