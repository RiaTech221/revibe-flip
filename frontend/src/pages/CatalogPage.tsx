import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import { Product, Category, ProductCondition } from '../types';
import { ProductCard } from '../components/ProductCard';
import { initialCuratedProducts } from '../data/curatedProducts';
import {
  Filter,
  RotateCcw,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  MapPin,
  Check,
  X,
  Layers
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtres principaux
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(searchParams.get('subcategory') || '');
  const [condition, setCondition] = useState<string>(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [selectedSize, setSelectedSize] = useState<string>(searchParams.get('size') || '');
  const [selectedColor, setSelectedColor] = useState<string>(searchParams.get('color') || '');
  const [selectedFabric, setSelectedFabric] = useState<string>(searchParams.get('fabric') || '');
  const [city, setCity] = useState<string>(searchParams.get('city') || '');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<string>('desc');

  // Filtres rapides horizontaux (style Shein / fast-fashion)
  const [under10kOnly, setUnder10kOnly] = useState<boolean>(false);
  const [dakarOnly, setDakarOnly] = useState<boolean>(false);
  const [topConditionOnly, setTopConditionOnly] = useState<boolean>(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sous-catégories adaptées par rayon pour ReVibe FliP (spécifiques et ciblées)
  const categorySubcategories: Record<string, { label: string; query: string }[]> = {
    '1': [ // Femmes
      { label: 'Tops, blouses & chemisiers pour femmes', query: 'top' },
      { label: 'Bas & jupes pour femme', query: 'jupe' },
      { label: 'Robes & tenues de soirée', query: 'robe' },
      { label: 'Jeans & pantalons pour femmes', query: 'pantalon' },
      { label: 'Costumes & tailleurs pour femmes', query: 'costume' },
      { label: 'Ensembles assortis & Wax', query: 'ensemble' },
      { label: 'Vêtements d’extérieur & vestes', query: 'veste' },
      { label: 'Combinaisons chic', query: 'combinaison' },
    ],
    '2': [ // Hommes
      { label: 'Chemises col mao & lin pour hommes', query: 'chemise' },
      { label: 'Pantalons, jeans & chinos', query: 'pantalon' },
      { label: 'Polos & t-shirts pour hommes', query: 'polo' },
      { label: 'Boubous & caftans traditionnels', query: 'boubou' },
      { label: 'Costumes, vestes & blazers', query: 'costume' },
      { label: 'Sweats & vestes légères', query: 'veste' },
    ],
    '3': [ // Wax & Bazin
      { label: 'Grands Boubous Bazin Getzner Riche', query: 'bazin' },
      { label: 'Robes & ensembles Wax Woodin', query: 'woodin' },
      { label: 'Couture sénégalaise brodée main', query: 'brodé' },
      { label: 'Coupons & tissus au mètre', query: 'tissu' },
      { label: 'Accessoires & étoles Wax', query: 'étool' },
    ],
    '4': [ // Chaussures
      { label: 'Baskets & sneakers Nike / Adidas', query: 'basket sneaker' },
      { label: 'Sandales cuir & nu-pieds touareg', query: 'sandale' },
      { label: 'Talons hauts & escarpins', query: 'talon' },
      { label: 'Mocassins & chaussures de ville', query: 'mocassin' },
      { label: 'Mules & claquettes', query: 'mule' },
    ],
    '5': [ // Maroquinerie
      { label: 'Sacs cabas & sacs à main', query: 'sac' },
      { label: 'Cuir artisanal de Ngaye Mékhé', query: 'ngaye' },
      { label: 'Pochettes & sacs bandoulière', query: 'pochette' },
      { label: 'Portefeuilles & ceintures cuir', query: 'portefeuille' },
    ],
    '6': [ // Enfants & Bébés
      { label: 'Filles (Robes & Ensembles)', query: 'fille' },
      { label: 'Garçons (Chemises & Pantalons)', query: 'garçon' },
      { label: 'Bébés & Naissance', query: 'bébé' },
      { label: 'Ensembles & pyjamas', query: 'ensemble' },
    ],
  };

  const sizesList = ['XS', 'S', 'M', 'L', 'XL', '2XL', '36', '38', '40', '42', '44', 'Unique'];

  const colorOptions = [
    { name: 'Noir', hex: '#0f172a' },
    { name: 'Blanc', hex: '#ffffff', border: true },
    { name: 'Bleu', hex: '#2563eb' },
    { name: 'Rouge', hex: '#dc2626' },
    { name: 'Vert', hex: '#16a34a' },
    { name: 'Kaki', hex: '#d97706' },
    { name: 'Rose', hex: '#ec4899' },
    { name: 'Orange', hex: '#ea580c' },
    { name: 'Violet', hex: '#7c3aed' },
    { name: 'Jaune', hex: '#eab308' },
    { name: 'Multicolore', gradient: 'linear-gradient(45deg, #ef4444, #eab308, #22c55e, #3b82f6)' },
  ];

  const fabricsList = [
    'Bazin Riche Getzner',
    'Wax Woodin Authentique',
    'Lin naturel',
    'Coton peigné',
    'Cuir de Ngaye',
    'Soie & Mousseline'
  ];

  const dakarDistricts = [
    'Dakar Plateau',
    'Almadies',
    'Mermoz',
    'Sacré-Cœur',
    'Ouakam',
    'Yoff',
    'Pikine / Guédiawaye',
    'Thiès'
  ];

  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    }).catch(console.error);
  }, []);

  const fetchProducts = () => {
    setLoading(true);

    // Calcul du terme de recherche combiné (texte + sous-catégorie + matière)
    let finalQuery = query.trim();
    if (selectedSubcategory) {
      finalQuery = finalQuery ? `${finalQuery} ${selectedSubcategory}` : selectedSubcategory;
    }
    if (selectedFabric) {
      finalQuery = finalQuery ? `${finalQuery} ${selectedFabric}` : selectedFabric;
    }

    const params: any = {
      page: 0,
      limit: 48,
      sortBy,
      sortDir,
    };

    if (finalQuery) params.query = finalQuery;
    if (categoryId) params.categoryId = Number(categoryId);

    // État
    if (topConditionOnly) {
      params.condition = 'VERY_GOOD';
    } else if (condition) {
      params.condition = condition;
    }

    // Prix
    if (under10kOnly) {
      params.maxPrice = 10000;
    } else {
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
    }

    // Taille
    if (selectedSize) params.size = selectedSize.trim();

    // Ville
    if (dakarOnly) {
      params.city = 'Dakar';
    } else if (city) {
      params.city = city.trim();
    }

    productApi.search(params)
      .then((res) => {
        if (res.data?.data?.content && res.data.data.content.length > 0) {
          setProducts(res.data.data.content);
          setTotalElements(res.data.data.totalElements);
        } else {
          // Filtrage intelligent sur les articles de référence si la base est encore vide
          let fallback = [...initialCuratedProducts];
          if (params.categoryId) {
            fallback = fallback.filter((p) => p.categoryId === params.categoryId);
          }
          if (params.query) {
            const qLower = String(params.query).toLowerCase();
            fallback = fallback.filter((p) =>
              p.title.toLowerCase().includes(qLower) ||
              (p.brand && p.brand.toLowerCase().includes(qLower)) ||
              (p.description && p.description.toLowerCase().includes(qLower))
            );
          }
          if (params.maxPrice) {
            fallback = fallback.filter((p) => Number(p.price) <= params.maxPrice);
          }
          if (params.minPrice) {
            fallback = fallback.filter((p) => Number(p.price) >= params.minPrice);
          }
          setProducts(fallback);
          setTotalElements(fallback.length);
        }
      })
      .catch(() => {
        setProducts(initialCuratedProducts);
        setTotalElements(initialCuratedProducts.length);
      })
      .finally(() => setLoading(false));
  };

  // Synchronisation avec les paramètres d'URL
  useEffect(() => {
    const q = searchParams.get('query') || '';
    const cat = searchParams.get('categoryId') || '';
    const cond = searchParams.get('condition') || '';
    const minP = searchParams.get('minPrice') || '';
    const maxP = searchParams.get('maxPrice') || '';
    const sz = searchParams.get('size') || '';
    const ct = searchParams.get('city') || '';

    setQuery(q);
    setCategoryId(cat);
    setCondition(cond);
    setMinPrice(minP);
    setMaxPrice(maxP);
    setSelectedSize(sz);
    setCity(ct);

    if (maxP === '10000') setUnder10kOnly(true);
    if (cond === 'VERY_GOOD' || cond === 'NEW_WITH_TAG') setTopConditionOnly(true);
    if (ct.toLowerCase().includes('dakar')) setDakarOnly(true);

    fetchProducts();
  }, [
    searchParams,
    sortBy,
    sortDir,
    selectedSubcategory,
    selectedColor,
    selectedFabric,
    selectedSize,
    under10kOnly,
    dakarOnly,
    topConditionOnly
  ]);

  const handleResetFilters = () => {
    setQuery('');
    setCategoryId('');
    setSelectedSubcategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('');
    setSelectedColor('');
    setSelectedFabric('');
    setCity('');
    setUnder10kOnly(false);
    setDakarOnly(false);
    setTopConditionOnly(false);
    setSortBy('createdAt');
    setSortDir('desc');
    setSearchParams({});
  };

  const handleSelectCategory = (catId: string) => {
    setCategoryId(catId);
    setSelectedSubcategory(''); // reset sous-catégorie
    const next = new URLSearchParams(searchParams);
    if (catId) {
      next.set('categoryId', catId);
    } else {
      next.delete('categoryId');
    }
    setSearchParams(next);
  };

  const currentCategory = categories.find((c) => String(c.id) === categoryId);
  const activeSubcategories = categoryId ? categorySubcategories[categoryId] || [] : [];

  // Compteur de filtres actifs
  const activeFilterCount = [
    categoryId,
    selectedSubcategory,
    condition,
    minPrice,
    maxPrice,
    selectedSize,
    selectedColor,
    selectedFabric,
    city,
    under10kOnly,
    dakarOnly,
    topConditionOnly
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* FIL D'ARIANE ÉPURÉ */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-600">
          <Link to="/" className="hover:text-purple-700 transition-colors">Accueil</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to="/catalog" className="hover:text-purple-700 transition-colors">Catalogue</Link>
          {currentCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-slate-900">{currentCategory.name}</span>
            </>
          )}
          {selectedSubcategory && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-bold text-purple-700">{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* EN-TÊTE DU CATALOGUE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {currentCategory ? currentCategory.name : 'Tous les articles de seconde main'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              <strong className="text-slate-900">{totalElements}</strong> article{totalElements > 1 ? 's' : ''} disponible{totalElements > 1 ? 's' : ''} vérifié{totalElements > 1 ? 's' : ''} à Dakar & Régions
            </p>
          </div>

          {/* Bouton filtres mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5 text-purple-700" />
              <span>Filtres ({activeFilterCount})</span>
            </button>
          </div>
        </div>

        {/* LIGNE HORIZONTALE DE FILTRES RAPIDES (STYLE SHEIN / FAST-FASHION REVIBE FLIP) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Menu Déroulant Tri */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-600">Trié par :</span>
            <div className="relative">
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [b, d] = e.target.value.split('-');
                  setSortBy(b);
                  setSortDir(d);
                }}
                className="text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-900 py-1.5 pl-3 pr-8 rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-all cursor-pointer appearance-none"
              >
                <option value="createdAt-desc">Plus récents d'abord</option>
                <option value="price-asc">Prix : du - cher au + cher</option>
                <option value="price-desc">Prix : du + cher au - cher</option>
                <option value="viewCount-desc">Les plus vus & populaires</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Chips horizontaux rapides avec état actif & bouton de désactivation (✕) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-category-scrollbar no-scrollbar py-0.5 flex-1">
            {/* 1. Moins de 10 000 FCFA */}
            <button
              onClick={() => setUnder10kOnly(!under10kOnly)}
              className={`h-7 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs ${
                under10kOnly
                  ? 'bg-purple-700 text-white border border-purple-800'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Moins de 10 000 FCFA</span>
              {under10kOnly && <X className="w-3 h-3 ml-0.5 hover:opacity-80" />}
            </button>

            {/* 2. Neuf / Très bon état */}
            <button
              onClick={() => setTopConditionOnly(!topConditionOnly)}
              className={`h-7 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs ${
                topConditionOnly
                  ? 'bg-slate-950 text-white border border-slate-950'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Comme neuf</span>
              {topConditionOnly && <X className="w-3 h-3 ml-0.5 hover:opacity-80" />}
            </button>

            {/* 3. Dispo à Dakar */}
            <button
              onClick={() => setDakarOnly(!dakarOnly)}
              className={`h-7 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs ${
                dakarOnly
                  ? 'bg-blue-600 text-white border border-blue-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 À Dakar</span>
              {dakarOnly && <X className="w-3 h-3 ml-0.5 hover:opacity-80" />}
            </button>
          </div>

          {/* Reset rapide si des filtres sont actifs */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Effacer tout ({activeFilterCount})
            </button>
          )}
        </div>

        {/* CONTENU PRINCIPAL : SIDEBAR GAUCHE + GRILLE PRODUITS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
          {/* SIDEBAR FILTRES COMPLÈTE (DESKTOP) */}
          <aside className="hidden lg:block space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-6">
              {/* EN-TÊTE DU BLOC CATÉGORIE / SOUS-CATÉGORIES */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-sm text-slate-900">
                    {categoryId && currentCategory ? currentCategory.name : 'Catégories'}
                  </span>
                </div>
                {categoryId && (
                  <button
                    onClick={() => handleSelectCategory('')}
                    className="text-[11px] font-bold text-slate-500 hover:text-purple-700 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Voir tous les rayons"
                  >
                    <span>Tous les rayons</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* QUAND UN RAYON EST SÉLECTIONNÉ (EX: FEMMES) : AFFICHER UNIQUEMENT SES SOUS-CATÉGORIES SANS LES AUTRES RAYONS */}
              {categoryId && currentCategory ? (
                <div className="space-y-1.5 animate-fade-in">
                  {/* Option Tout voir dans ce rayon */}
                  <button
                    onClick={() => setSelectedSubcategory('')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group cursor-pointer ${
                      selectedSubcategory === '' ? 'font-black text-slate-950 bg-slate-100/70' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        selectedSubcategory === '' ? 'border-purple-700 bg-purple-700' : 'border-slate-300 group-hover:border-slate-400'
                      }`}>
                        {selectedSubcategory === '' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="truncate">Tout dans {currentCategory.name}</span>
                    </div>
                  </button>

                  {/* Liste exclusive des sous-catégories avec puces radio rondes style Shein */}
                  {activeSubcategories.map((sub, sIdx) => {
                    const isSubActive = selectedSubcategory === sub.query;
                    return (
                      <button
                        key={sIdx}
                        onClick={() => setSelectedSubcategory(isSubActive ? '' : sub.query)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group cursor-pointer ${
                          isSubActive ? 'font-black text-slate-950 bg-purple-50/70' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSubActive ? 'border-purple-700 bg-purple-700' : 'border-slate-300 group-hover:border-slate-400'
                          }`}>
                            {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="truncate">{sub.label}</span>
                        </div>
                        <span className="text-slate-400 text-xs font-light ml-1 shrink-0 group-hover:text-slate-600">+</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* QUAND AUCUN RAYON N'EST CHOISI (TOUT VOIR) : AFFICHER LES GRANDS RAYONS */
                <div className="space-y-1">
                  <button
                    onClick={() => handleSelectCategory('')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all text-left bg-purple-50 text-purple-700"
                  >
                    <span>Tous les rayons</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCategory(String(c.id))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left text-slate-700 hover:bg-slate-50 group cursor-pointer"
                    >
                      <span>{c.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Filtre Taille / Pointure (Pills compacts) */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Taille / Pointure</span>
                  {selectedSize && (
                    <button
                      onClick={() => setSelectedSize('')}
                      className="text-[10.5px] text-purple-700 hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sizesList.map((sz) => {
                    const isSzActive = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(isSzActive ? '' : sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          isSzActive
                            ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Filtre Couleur (Nuancier Shein avec pastilles) */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Couleur dominante</span>
                  {selectedColor && (
                    <button
                      onClick={() => setSelectedColor('')}
                      className="text-[10.5px] text-purple-700 hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((c, cIdx) => {
                    const isColorActive = selectedColor === c.name;
                    return (
                      <button
                        key={cIdx}
                        onClick={() => setSelectedColor(isColorActive ? '' : c.name)}
                        className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${
                          isColorActive ? 'ring-2 ring-purple-600 bg-purple-50' : 'hover:bg-slate-50'
                        }`}
                        title={c.name}
                      >
                        <span
                          className={`w-6 h-6 rounded-full aspect-square ${c.border ? 'border border-slate-300' : ''}`}
                          style={{
                            background: c.gradient || c.hex,
                          }}
                        />
                        <span className="text-[10px] text-slate-600 truncate max-w-full font-medium">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Tissus & Matières (spécifique mode sénégalaise) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Matière & Tissu</span>
                  {selectedFabric && (
                    <button
                      onClick={() => setSelectedFabric('')}
                      className="text-[10.5px] text-purple-700 hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {fabricsList.map((fab, fIdx) => {
                    const isFabActive = selectedFabric === fab;
                    return (
                      <button
                        key={fIdx}
                        onClick={() => setSelectedFabric(isFabActive ? '' : fab)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                          isFabActive
                            ? 'text-purple-700 font-bold bg-purple-50'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{fab}</span>
                        {isFabActive && <Check className="w-3 h-3 text-purple-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. État de l'article (Seconde main) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">État de l'article</span>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="">Tous les états</option>
                  <option value="NEW_WITH_TAG">Neuf avec étiquette</option>
                  <option value="VERY_GOOD">Très bon état</option>
                  <option value="GOOD">Bon état</option>
                  <option value="SATISFACTORY">État satisfaisant</option>
                </select>
              </div>

              {/* 7. Gamme de Prix (FCFA) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Budget (FCFA)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 font-semibold focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 font-semibold focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 8. Quartiers & Villes du Sénégal */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Localisation</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="">Tous les secteurs</option>
                  {dakarDistricts.map((d, dIdx) => (
                    <option key={dIdx} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* GRILLE D'ARTICLES DE SECONDE MAIN (4 COLONNES) */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl aspect-[3/4] border border-slate-100 p-2" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs space-y-3">
                <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Aucun article ne correspond à vos filtres</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Essayez d'élargir votre recherche, de changer de rayon ou de réinitialiser vos critères.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DRAWER MOBILE POUR FILTRES */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-5 animate-fade-in flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Filtres de recherche</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sélection Rayon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rayon</label>
                <select
                  value={categoryId}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                >
                  <option value="">Tous les rayons</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sélection Sous-catégorie spécifique sur Mobile */}
              {activeSubcategories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sous-catégorie ({currentCategory?.name})
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="">Toutes les sous-catégories</option>
                    {activeSubcategories.map((s, idx) => (
                      <option key={idx} value={s.query}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* État */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">État</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                >
                  <option value="">Tous les états</option>
                  <option value="NEW_WITH_TAG">Neuf avec étiquette</option>
                  <option value="VERY_GOOD">Très bon état</option>
                  <option value="GOOD">Bon état</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix Max (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 15000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Effacer
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-xs"
              >
                Voir ({totalElements})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
