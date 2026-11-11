/**
 * Page Catalogue et Recherche de Produits ReVibe FliP
 * 
 * Interface principale d'exploration des articles en vente :
 *  * - Grille de produits responsive avec pagination
 *  * - Filtres latéraux par catégorie, prix, état, pays et options de livraison
 *  * - Barre de tri dynamique (prix croissant/décroissant, nouveautés, popularité)
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import { Product, Category } from '../types';
import { initialCuratedProducts } from '../data/curatedProducts';
import { CatalogSortBar } from '../components/catalog/CatalogSortBar';
import { CatalogQuickPills } from '../components/catalog/CatalogQuickPills';
import { CatalogActiveFilters } from '../components/catalog/CatalogActiveFilters';
import { CatalogFilterSidebar } from '../components/catalog/CatalogFilterSidebar';
import { CatalogGrid } from '../components/catalog/CatalogGrid';

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

  // Filtres rapides horizontaux
  const [under10kOnly, setUnder10kOnly] = useState<boolean>(false);
  const [dakarOnly, setDakarOnly] = useState<boolean>(false);
  const [topConditionOnly, setTopConditionOnly] = useState<boolean>(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categorySubcategories: Record<string, { label: string; query: string }[]> = {
    '1': [
      { label: 'Tops, blouses & chemisiers pour femmes', query: 'top' },
      { label: 'Bas & jupes pour femme', query: 'jupe' },
      { label: 'Robes & tenues de soirée', query: 'robe' },
      { label: 'Jeans & pantalons pour femmes', query: 'pantalon' },
      { label: 'Costumes & tailleurs pour femmes', query: 'costume' },
      { label: 'Ensembles assortis & Wax', query: 'ensemble' },
      { label: 'Vêtements d’extérieur & vestes', query: 'veste' },
      { label: 'Combinaisons chic', query: 'combinaison' },
    ],
    '2': [
      { label: 'Chemises col mao & lin pour hommes', query: 'chemise' },
      { label: 'Pantalons, jeans & chinos', query: 'pantalon' },
      { label: 'Polos & t-shirts pour hommes', query: 'polo' },
      { label: 'Boubous & caftans traditionnels', query: 'boubou' },
      { label: 'Costumes, vestes & blazers', query: 'costume' },
      { label: 'Sweats & vestes légères', query: 'veste' },
    ],
    '3': [
      { label: 'Grands Boubous Bazin Getzner Riche', query: 'bazin' },
      { label: 'Robes & ensembles Wax Woodin', query: 'woodin' },
      { label: 'Couture sénégalaise brodée main', query: 'brodé' },
      { label: 'Coupons & tissus au mètre', query: 'tissu' },
      { label: 'Accessoires & étoles Wax', query: 'étole' },
    ],
    '4': [
      { label: 'Baskets & sneakers Nike / Adidas', query: 'basket sneaker' },
      { label: 'Sandales cuir & nu-pieds touareg', query: 'sandale' },
      { label: 'Talons hauts & escarpins', query: 'talon' },
      { label: 'Mocassins & chaussures de ville', query: 'mocassin' },
      { label: 'Mules & claquettes', query: 'mule' },
    ],
    '5': [
      { label: 'Sacs cabas & sacs à main', query: 'sac' },
      { label: 'Cuir artisanal de Ngaye Mékhé', query: 'ngaye' },
      { label: 'Pochettes & sacs bandoulière', query: 'pochette' },
      { label: 'Portefeuilles & ceintures cuir', query: 'portefeuille' },
    ],
    '6': [
      { label: 'Filles (Robes & Ensembles)', query: 'fille' },
      { label: 'Garçons (Chemises & Pantalons)', query: 'garçon' },
      { label: 'Bébés & Naissance', query: 'bébé' },
      { label: 'Ensembles & pyjamas', query: 'ensemble' },
    ],
  };

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res?.data?.data) setCategories(res.data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: 0,
          size: 40,
          sortBy,
          sortDir,
        };

        if (query) params.query = query;
        if (categoryId) params.categoryId = categoryId;
        if (condition) params.condition = condition;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (city) params.city = city;

        const res = await productApi.search(params);
        let list = res?.data?.data?.content || [];

        if (list.length === 0) {
          list = initialCuratedProducts;
        }

        // Filtrage côté client pour les affinements visuels
        let filtered = [...list];

        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              (p.brand && p.brand.toLowerCase().includes(q))
          );
        }

        if (categoryId) {
          filtered = filtered.filter((p) => String((p as any).categoryId) === String(categoryId));
        }

        if (selectedSubcategory) {
          const subQuery = selectedSubcategory.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(subQuery) ||
              (p.description && p.description.toLowerCase().includes(subQuery))
          );
        }

        if (under10kOnly) {
          filtered = filtered.filter((p) => p.price <= 10000);
        } else if (maxPrice) {
          filtered = filtered.filter((p) => p.price <= Number(maxPrice));
        }

        if (minPrice) {
          filtered = filtered.filter((p) => p.price >= Number(minPrice));
        }

        if (dakarOnly) {
          filtered = filtered.filter((p) => (p.locationCity || '').toLowerCase().includes('dakar'));
        } else if (city) {
          filtered = filtered.filter((p) => (p.locationCity || '').toLowerCase().includes(city.toLowerCase()));
        }

        if (topConditionOnly) {
          filtered = filtered.filter(
            (p) => p.condition === 'NEW_WITH_TAG' || p.condition === 'VERY_GOOD'
          );
        } else if (condition) {
          filtered = filtered.filter((p) => p.condition === condition);
        }

        if (selectedSize) {
          filtered = filtered.filter((p) => p.size === selectedSize);
        }

        if (selectedColor) {
          filtered = filtered.filter((p) => (p.color || '').toLowerCase().includes(selectedColor.toLowerCase()));
        }

        if (selectedFabric) {
          const fab = selectedFabric.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(fab) ||
              (p.description && p.description.toLowerCase().includes(fab))
          );
        }

        // Tri local
        if (sortBy === 'price') {
          filtered.sort((a, b) => (sortDir === 'asc' ? a.price - b.price : b.price - a.price));
        }

        setProducts(filtered);
        setTotalElements(filtered.length);
      } catch {
        setProducts(initialCuratedProducts);
        setTotalElements(initialCuratedProducts.length);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [
    query,
    categoryId,
    selectedSubcategory,
    condition,
    minPrice,
    maxPrice,
    selectedSize,
    selectedColor,
    selectedFabric,
    city,
    sortBy,
    sortDir,
    under10kOnly,
    dakarOnly,
    topConditionOnly,
  ]);

  const handleResetAll = () => {
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
    setSearchParams({});
  };

  const handleClearFilter = (key: string) => {
    if (key === 'query') setQuery('');
    if (key === 'categoryId') {
      setCategoryId('');
      setSelectedSubcategory('');
    }
    if (key === 'selectedSubcategory') setSelectedSubcategory('');
    if (key === 'price') {
      setMinPrice('');
      setMaxPrice('');
      setUnder10kOnly(false);
    }
    if (key === 'condition') {
      setCondition('');
      setTopConditionOnly(false);
    }
    if (key === 'selectedSize') setSelectedSize('');
    if (key === 'selectedColor') setSelectedColor('');
    if (key === 'selectedFabric') setSelectedFabric('');
    if (key === 'city') {
      setCity('');
      setDakarOnly(false);
    }
  };

  const activeFiltersCount = [
    query,
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
    topConditionOnly,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Barre de tri et compteur */}
      <CatalogSortBar
        totalElements={totalElements}
        loading={loading}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(sb, sd) => {
          setSortBy(sb);
          setSortDir(sd);
        }}
        onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      {/* 2. Filtres rapides horizontaux */}
      <CatalogQuickPills
        under10kOnly={under10kOnly}
        setUnder10kOnly={setUnder10kOnly}
        dakarOnly={dakarOnly}
        setDakarOnly={setDakarOnly}
        topConditionOnly={topConditionOnly}
        setTopConditionOnly={setTopConditionOnly}
      />

      {/* 3. Tags des filtres actifs */}
      <CatalogActiveFilters
        categoryId={categoryId}
        categories={categories}
        selectedSubcategory={selectedSubcategory}
        minPrice={minPrice}
        maxPrice={maxPrice}
        condition={condition}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        selectedFabric={selectedFabric}
        city={city}
        query={query}
        onClearFilter={handleClearFilter}
        onResetAll={handleResetAll}
      />

      {/* 4. Grille principale avec Sidebar filtres */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar desktop */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <CatalogFilterSidebar
            categories={categories}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
            categorySubcategories={categorySubcategories}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            condition={condition}
            setCondition={setCondition}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedFabric={selectedFabric}
            setSelectedFabric={setSelectedFabric}
            city={city}
            setCity={setCity}
            onResetAll={handleResetAll}
          />
        </div>

        {/* Grille des articles (3 cols) */}
        <div className="lg:col-span-3">
          <CatalogGrid
            products={products}
            loading={loading}
            onResetFilters={handleResetAll}
          />
        </div>
      </div>

      {/* 5. Tiroir Mobile pour filtres */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="w-5/6 max-w-sm bg-white h-full overflow-y-auto p-4">
            <CatalogFilterSidebar
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              selectedSubcategory={selectedSubcategory}
              setSelectedSubcategory={setSelectedSubcategory}
              categorySubcategories={categorySubcategories}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              condition={condition}
              setCondition={setCondition}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedFabric={selectedFabric}
              setSelectedFabric={setSelectedFabric}
              city={city}
              setCity={setCity}
              onResetAll={handleResetAll}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
            />
          </div>
          <div
            className="flex-1"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
