import React from 'react';
import { RotateCcw, X, Layers } from 'lucide-react';
import { Category, ProductCondition } from '../../types';

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

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs space-y-6 text-xs">
      {/* En-tête du panneau filtres */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-150">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-700" />
          <h2 className="text-sm font-black text-gray-900">Filtres de recherche</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] font-bold text-gray-400 hover:text-purple-700 flex items-center gap-1 transition-colors cursor-pointer"
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
      <div className="space-y-2">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Rayons & Univers
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setCategoryId('');
              setSelectedSubcategory('');
            }}
            className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              !categoryId
                ? 'bg-purple-700 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tous les rayons
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(String(cat.id));
                setSelectedSubcategory('');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-between ${
                categoryId === String(cat.id)
                  ? 'bg-purple-700 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Sous-catégories ciblées */}
      {subcategoriesForSelected.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-150">
          <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
            Sous-rayons spécifiques
          </label>
          <div className="space-y-1">
            {subcategoriesForSelected.map((sub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setSelectedSubcategory(selectedSubcategory === sub.query ? '' : sub.query)
                }
                className={`w-full text-left px-3 py-1.5 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                  selectedSubcategory === sub.query
                    ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Fourchette de Prix (FCFA) */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Fourchette de prix (FCFA)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min FCFA"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
          />
          <input
            type="number"
            placeholder="Max FCFA"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* 4. État du vêtement */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          État de l'article
        </label>
        <div className="space-y-1">
          {conditionOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCondition(condition === opt.value ? '' : opt.value)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                condition === opt.value
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Tailles */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Taille
        </label>
        <div className="flex flex-wrap gap-1.5">
          {sizesList.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selectedSize === sz
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Couleurs */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Couleur
        </label>
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
      </div>

      {/* 7. Matières phares */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Matières phares
        </label>
        <div className="flex flex-wrap gap-1.5">
          {fabricsList.map((fab) => (
            <button
              key={fab}
              type="button"
              onClick={() => setSelectedFabric(selectedFabric === fab ? '' : fab)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                selectedFabric === fab
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {fab}
            </button>
          ))}
        </div>
      </div>

      {/* 8. Ville / Région */}
      <div className="space-y-2 pt-2 border-t border-gray-150">
        <label className="block font-black text-gray-900 uppercase tracking-wider text-[11px]">
          Localisation
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-600 cursor-pointer"
        >
          <option value="">Tout le Sénégal</option>
          {citiesList.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
