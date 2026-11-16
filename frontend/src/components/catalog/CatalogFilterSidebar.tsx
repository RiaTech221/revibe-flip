/**
 * Composant de Navigation Catalogue : CatalogFilterSidebar
 * 
 * Composant interactif pour le filtrage, tri ou affichage des annonces du catalogue (CatalogFilterSidebar).
 */

import React, { useState } from 'react';
import { RotateCcw, X, Plus, Minus } from 'lucide-react';
import { Category, ProductCondition } from '../../types';

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200/70 py-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left py-0.5 cursor-pointer group"
      >
        <span className="font-bold text-gray-900 text-xs group-hover:text-purple-700 transition-colors">
          {title}
        </span>
        {open ? (
          <Minus className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <Plus className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      {open && <div className="pt-2.5">{children}</div>}
    </div>
  );
};

interface CatalogFilterSidebarProps {
  categories: Category[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (sub: string) => void;
  categorySubcategories: Record<string, { label: string; query: string }[]>;
  minPrice: string;
  setMinPrice: (p: string) => void;
  maxPrice: string;
  setMaxPrice: (p: string) => void;
  condition: string;
  setCondition: (c: string) => void;
  selectedSize: string;
  setSelectedSize: (s: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedFabric: string;
  setSelectedFabric: (f: string) => void;
  city: string;
  setCity: (c: string) => void;
  onResetAll: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  categories,
  categoryId,
  setCategoryId,
  selectedSubcategory,
  setSelectedSubcategory,
  categorySubcategories,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  condition,
  setCondition,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  selectedFabric,
  setSelectedFabric,
  city,
  setCity,
  onResetAll,
  isMobileDrawer,
  onCloseMobileDrawer,
}) => {
  const sizesList = ['XS', 'S', 'M', 'L', 'XL', '2XL', '36', '38', '40', '42', '44', 'Unique'];

  const colorOptions = [
    { name: 'Noir', hex: '#0f172a' },
    { name: 'Blanc', hex: '#f8fafc' },
    { name: 'Bleu', hex: '#2563eb' },
    { name: 'Rouge', hex: '#dc2626' },
    { name: 'Vert', hex: '#16a34a' },
    { name: 'Jaune', hex: '#eab308' },
    { name: 'Violet', hex: '#9333ea' },
    { name: 'Doré / Wax', hex: '#f59e0b' },
  ];

  const fabricsList = [
    'Wax authentique',
    'Bazin Riche Getzner',
    'Lin respirant',
    'Cuir artisanal',
    'Coton 100%',
    'Soie & Satin',
  ];

  const citiesList = [
    'Dakar',
    'Thiès',
    'Saint-Louis',
    'Mbour',
    'Ziguinchor',
    'Kaolack',
    'Touba',
  ];

  const conditionOptions: { value: ProductCondition; label: string }[] = [
    { value: 'NEW_WITH_TAG', label: 'Neuf avec étiquette' },
    { value: 'VERY_GOOD', label: 'Très bon état' },
    { value: 'GOOD', label: 'Bon état' },
    { value: 'SATISFACTORY', label: 'État satisfaisant' },
  ];

  const subcategoriesForSelected = categoryId ? categorySubcategories[categoryId] || [] : [];
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);

  return (
    <div className="text-xs">
      {/* En-tête minimaliste du panneau filtres */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/70">
        <h2 className="text-sm font-black text-gray-900">Filtre</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] font-semibold text-gray-400 hover:text-purple-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Effacer</span>
          </button>
          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Rayons / Catégories */}
      <FilterSection title="Catégories" defaultOpen={true}>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setCategoryId('');
              setSelectedSubcategory('');
            }}
            className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !categoryId
                ? 'text-purple-700 font-bold bg-purple-50/70'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Tous les rayons
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(String(cat.id));
                setSelectedSubcategory('');
              }}
              className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                categoryId === String(cat.id)
                  ? 'text-purple-700 font-bold bg-purple-50/70'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
          {categories.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="px-2 pt-1 text-[11px] font-bold text-gray-800 hover:text-purple-700 cursor-pointer"
            >
              {showAllCategories ? '- Voir moins' : '+ Voir plus'}
            </button>
          )}
        </div>
      </FilterSection>

      {/* 2. Sous-catégories ciblées */}
      {subcategoriesForSelected.length > 0 && (
        <FilterSection title="Sous-rayons" defaultOpen={true}>
          <div className="space-y-1">
            {subcategoriesForSelected.map((sub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setSelectedSubcategory(selectedSubcategory === sub.query ? '' : sub.query)
                }
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                  selectedSubcategory === sub.query
                    ? 'text-purple-700 font-bold bg-purple-50/70'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* 3. Fourchette de Prix (FCFA) */}
      <FilterSection title="Prix (FCFA)" defaultOpen={Boolean(minPrice || maxPrice)}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-transparent font-semibold text-gray-900 text-xs focus:outline-none focus:border-purple-600"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-transparent font-semibold text-gray-900 text-xs focus:outline-none focus:border-purple-600"
          />
        </div>
      </FilterSection>

      {/* 4. État du vêtement */}
      <FilterSection title="État de l'article" defaultOpen={Boolean(condition)}>
        <div className="space-y-1">
          {conditionOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCondition(condition === opt.value ? '' : opt.value)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                condition === opt.value
                  ? 'text-purple-700 font-bold bg-purple-50/70'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 5. Tailles */}
      <FilterSection title="Taille" defaultOpen={Boolean(selectedSize)}>
        <div className="flex flex-wrap gap-1.5">
          {sizesList.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedSize === sz
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-transparent text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 6. Couleurs */}
      <FilterSection title="Couleur" defaultOpen={Boolean(selectedColor)}>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() => setSelectedColor(selectedColor === col.name ? '' : col.name)}
              className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                selectedColor === col.name ? 'scale-125 ring-2 ring-purple-600' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: col.hex }}
              title={col.name}
            />
          ))}
        </div>
      </FilterSection>

      {/* 7. Matières phares */}
      <FilterSection title="Matières phares" defaultOpen={Boolean(selectedFabric)}>
        <div className="flex flex-wrap gap-1.5">
          {fabricsList.map((fab) => (
            <button
              key={fab}
              type="button"
              onClick={() => setSelectedFabric(selectedFabric === fab ? '' : fab)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                selectedFabric === fab
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-transparent text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {fab}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 8. Ville / Région */}
      <FilterSection title="Localisation" defaultOpen={Boolean(city)}>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-transparent font-semibold text-gray-900 text-xs focus:outline-none focus:border-purple-600 cursor-pointer"
        >
          <option value="">Tout le Sénégal</option>
          {citiesList.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </FilterSection>
    </div>
  );
};
