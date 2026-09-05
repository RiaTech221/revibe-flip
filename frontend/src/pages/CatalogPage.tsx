import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import { Product, Category, ProductCondition } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, RotateCcw, ShoppingBag } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [condition, setCondition] = useState<string>(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [size, setSize] = useState<string>(searchParams.get('size') || '');
  const [city, setCity] = useState<string>(searchParams.get('city') || '');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<string>('desc');

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    }).catch(console.error);
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const params: any = {
      page: 0,
      limit: 40,
      sortBy,
      sortDir,
    };
    if (query.trim()) params.query = query.trim();
    if (categoryId) params.categoryId = Number(categoryId);
    if (condition) params.condition = condition;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (size) params.size = size.trim();
    if (city) params.city = city.trim();

    productApi.search(params)
      .then((res) => {
        if (res.data && res.data.data) {
          setProducts(res.data.data.content);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Sync state and fetch products whenever URL searchParams change
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
    setSize(sz);
    setCity(ct);

    // Trigger fetch with current params
    setLoading(true);
    const params: any = {
      page: 0,
      limit: 40,
      sortBy,
      sortDir,
    };
    if (q.trim()) params.query = q.trim();
    if (cat) params.categoryId = Number(cat);
    if (cond) params.condition = cond;
    if (minP) params.minPrice = Number(minP);
    if (maxP) params.maxPrice = Number(maxP);
    if (sz) params.size = sz.trim();
    if (ct) params.city = ct.trim();

    productApi.search(params)
      .then((res) => {
        if (res.data && res.data.data) {
          setProducts(res.data.data.content);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchParams, sortBy, sortDir]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setQuery('');
    setCategoryId('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSize('');
    setCity('');
    setSortBy('createdAt');
    setSortDir('desc');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Catalogue d'articles
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {totalElements} article{totalElements > 1 ? 's' : ''} disponible{totalElements > 1 ? 's' : ''}
          </p>
        </div>

        {/* Search form in catalog */}
        <form onSubmit={handleApplyFilters} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par mot-clé, marque..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            Filtrer
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* SIDEBAR FILTERS (DESKTOP) */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-700" />
                Filtres de recherche
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-purple-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Trier par</label>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [b, d] = e.target.value.split('-');
                  setSortBy(b);
                  setSortDir(d);
                }}
                className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="createdAt-desc">Plus récents d'abord</option>
                <option value="price-asc">Prix : croissant</option>
                <option value="price-desc">Prix : décroissant</option>
                <option value="viewCount-desc">Popularité</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryId(val);
                  const nextParams = new URLSearchParams(searchParams);
                  if (val) {
                    nextParams.set('categoryId', val);
                  } else {
                    nextParams.delete('categoryId');
                  }
                  setSearchParams(nextParams);
                }}
                className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">État de l'article</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Tous les états</option>
                <option value="NEW_WITH_TAG">Neuf avec étiquette</option>
                <option value="VERY_GOOD">Très bon état</option>
                <option value="GOOD">Bon état</option>
                <option value="SATISFACTORY">État satisfaisant</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Prix (FCFA)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Taille / Pointure</label>
              <input
                type="text"
                placeholder="Ex: M, L, XL, 42, 43..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Localisation / Ville</label>
              <input
                type="text"
                placeholder="Ex: Dakar, Thiès, Saint-Louis..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100 p-4" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-800">Aucun article ne correspond à vos critères</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Essayez d'élargir votre recherche, de changer de catégorie ou de réinitialiser les filtres.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-5 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-full shadow transition-all"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
