import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productApi, categoryApi } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { initialCuratedProducts } from '../data/curatedProducts';
import {
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  X
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  const [products, setProducts] = useState<Product[]>(initialCuratedProducts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrousel Hero interactif (5 slides vibrants)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Regroupement d'univers / sélections de la vitrine
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<string>('all');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Carrousel des Catégories en DEUX LIGNES (22 catégories riches et variées pour ReVibe FliP)
  const visualCategoriesRow1 = [
    { id: 'all', name: 'Tout voir', link: '/catalog', visual: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=80', isSpecial: true },
    { id: '1', name: 'Femmes', link: '/catalog?categoryId=1', visual: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=240&q=80' },
    { id: '2', name: 'Hommes', link: '/catalog?categoryId=2', visual: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80' },
    { id: '3', name: 'Wax & Bazin', link: '/catalog?categoryId=3', visual: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=240&q=80' },
    { id: '4', name: 'Chaussures', link: '/catalog?categoryId=4', visual: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80' },
    { id: '5', name: 'Sacs & Cuir', link: '/catalog?categoryId=5', visual: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=240&q=80' },
    { id: '6', name: 'Enfants', link: '/catalog?categoryId=6', visual: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=240&q=80' },
    { id: '7', name: 'Bijoux', link: '/catalog?query=bijoux', visual: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=240&q=80' },
    { id: '8', name: 'Robes Soirée', link: '/catalog?query=robe', visual: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=240&q=80' },
    { id: '9', name: 'Tops & Blouses', link: '/catalog?query=top', visual: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=240&q=80' },
    { id: '10', name: 'Lingerie', link: '/catalog?query=lingerie', visual: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?auto=format&fit=crop&w=240&q=80' },
  ];

  const visualCategoriesRow2 = [
    { id: '11', name: 'Jeans & Denim', link: '/catalog?query=jean', visual: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=240&q=80' },
    { id: '12', name: 'Vestes', link: '/catalog?query=veste', visual: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=240&q=80' },
    { id: '13', name: 'Mode Curvy', link: '/catalog?query=curvy', visual: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=240&q=80' },
    { id: '14', name: 'Maison & Déco', link: '/catalog?categoryId=8', visual: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=240&q=80' },
    { id: '15', name: 'Beauté & Soins', link: '/catalog?query=beaute', visual: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80' },
    { id: '16', name: 'Accs Téléphone', link: '/catalog?query=accessoires', visual: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=240&q=80' },
    { id: '17', name: 'Sandales', link: '/catalog?query=sandale', visual: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=240&q=80' },
    { id: '18', name: 'Bébés', link: '/catalog?query=bebe', visual: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=240&q=80' },
    { id: '19', name: 'Sportswear', link: '/catalog?query=sport', visual: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=240&q=80' },
    { id: '20', name: '< 10 000 FCFA', link: '/catalog?maxPrice=10000', visual: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=240&q=80' },
    { id: '21', name: 'Créateurs Dakar', link: '/catalog?query=artisanat', visual: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=240&q=80' },
  ];

  // Onglets de sélection pour la vitrine principale (épurés, élégants et aérés)
  const showcaseTabs = [
    { id: 'all', label: '✨ Coups de Cœur ReVibe' },
    { id: 'femmes', label: 'Femmes', categoryId: 1, keywords: ['femme', 'robe', 'jupe', 'top', 'blouse', 'lingerie', 'tailleur'] },
    { id: 'hommes', label: 'Hommes', categoryId: 2, keywords: ['homme', 'chemise', 'pantalon', 'polo', 'costume', 'jean'] },
    { id: 'wax', label: 'Wax & Bazin Chic', categoryId: 3, keywords: ['wax', 'bazin', 'boubou', 'getzner', 'woodin', 'couture', 'teinté', 'vlisco', 'artisanat'] },
    { id: 'chaussures', label: 'Sneakers & Souliers', categoryId: 4, keywords: ['chaussure', 'basket', 'sneaker', 'sandale', 'air max', 'nike', 'adidas', 'stan smith', 'dunk', 'tropéziennes'] },
    { id: 'sacs', label: 'Sacs & Maroquinerie', categoryId: 5, keywords: ['sac', 'cuir', 'maroquinerie', 'cabas', 'pochette', 'ngaye', 'bandoulière'] },
    { id: 'petits-prix', label: 'Pépites < 10 000 F', maxPrice: 10000 },
  ];

  const heroSlides = [
    {
      id: 1,
      tag: 'FÊTES & SOIRÉES DAKAR',
      title: 'FÊTES DE FIN D’ANNÉE',
      subtitle: 'MODE SÉNÉGALAISE FESTIVE & LOOKS COCOONING',
      bgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-rose-950 via-slate-950/85 to-purple-950/40',
      catalogLink: '/catalog?categoryId=3',
      buttonText: 'Achetez maintenant',
      items: [
        {
          title: 'Grand Boubou Bazin Getzner',
          price: '35 000 FCFA',
          image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=400&q=80',
          link: '/products/1'
        },
        {
          title: 'Robe Évasée Wax Woodin',
          price: '18 500 FCFA',
          image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
          link: '/products/2'
        }
      ]
    },
    {
      id: 2,
      tag: '1 000+ MARQUES À LA UNE',
      title: 'OFFRES DE MARQUES À L’HONNEUR',
      subtitle: 'NIKE • ZARA • MANGO • VÊTEMENTS VÉRIFIÉS',
      bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-red-950 via-slate-950/85 to-slate-950/50',
      catalogLink: '/catalog',
      buttonText: 'Explorer les marques',
      items: [
        {
          title: 'Baskets Nike Air Max 90',
          price: '28 000 FCFA',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
          link: '/products/3'
        },
        {
          title: 'Sac Cabas Cuir de Ngaye',
          price: '15 000 FCFA',
          image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
          link: '/products/4'
        }
      ]
    },
    {
      id: 3,
      tag: 'COLLECTION FRAÎCHEUR & SAISON',
      title: 'HABILLÉ POUR LA SAISON',
      subtitle: 'CHEMISES LIN, TRICOTS & VESTES DE SECONDE MAIN',
      bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-amber-950 via-slate-950/80 to-purple-950/35',
      catalogLink: '/catalog?categoryId=2',
      buttonText: 'Découvrir la sélection',
      items: [
        {
          title: 'Chemise Lin Col Mao & Wax',
          price: '12 500 FCFA',
          image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
          link: '/products/5'
        },
        {
          title: 'Sandales Cuir Touareg',
          price: '9 500 FCFA',
          image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80',
          link: '/products/6'
        }
      ]
    },
    {
      id: 4,
      tag: 'STREETWEAR DAKAR',
      title: 'SNEAKERS & STYLE URBAIN',
      subtitle: 'BASKETS NIKE, ADIDAS & VINTAGE D’OCCASION',
      bgImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-purple-950 via-slate-950/85 to-indigo-950/40',
      catalogLink: '/catalog?categoryId=4',
      buttonText: 'Voir les sneakers dakar',
      items: [
        {
          title: 'Baskets Nike Air Max 90',
          price: '28 000 FCFA',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
          link: '/products/3'
        },
        {
          title: 'Sandales Cuir Touareg',
          price: '9 500 FCFA',
          image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80',
          link: '/products/6'
        }
      ]
    },
    {
      id: 5,
      tag: 'VIDE-DRESSING ÉCO-RESPONSABLE',
      title: 'PÉPITES À PRIX DOUX',
      subtitle: 'DONNEZ UNE SECONDE VIE AU STYLE DÈS 5 000 FCFA',
      bgImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-emerald-950 via-slate-950/85 to-slate-950/40',
      catalogLink: '/catalog?maxPrice=15000',
      buttonText: 'Profiter des bons plans',
      items: [
        {
          title: 'Sac Cabas Cuir de Ngaye',
          price: '15 000 FCFA',
          image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
          link: '/products/4'
        },
        {
          title: 'Robe Évasée Wax Woodin',
          price: '18 500 FCFA',
          image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
          link: '/products/2'
        }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  useEffect(() => {
    Promise.all([
      productApi.search({ limit: 50, sortBy: 'createdAt', sortDir: 'desc' }),
      categoryApi.getAll(),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data?.data?.content && prodRes.data.data.content.length > 0) {
          const apiProducts = prodRes.data.data.content;
          const existingIds = new Set(apiProducts.map((p) => p.id));
          const combined = [
            ...apiProducts,
            ...initialCuratedProducts.filter((p) => !existingIds.has(p.id))
          ];
          setProducts(combined);
        }
        if (catRes.data?.data) {
          setCategories(catRes.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayedProducts = products.filter((p) => {
    if (activeShowcaseTab === 'all') return true;
    const tab = showcaseTabs.find((t) => t.id === activeShowcaseTab);
    if (!tab) return true;

    if (tab.maxPrice !== undefined) {
      return p.price <= tab.maxPrice;
    }

    if (tab.categoryId && p.categoryId === tab.categoryId) {
      return true;
    }

    if (tab.keywords && tab.keywords.length > 0) {
      const text = `${p.title} ${p.description || ''} ${p.categoryName || ''} ${p.categorySlug || ''} ${p.brand || ''}`.toLowerCase();
      return tab.keywords.some((k) => text.includes(k));
    }

    return false;
  });

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case 'femmes':
        return '👗';
      case 'hommes':
        return '👔';
      case 'traditionnel-wax':
        return '🪡';
      case 'chaussures':
        return '👟';
      case 'accessoires':
        return '👜';
      case 'enfants-bebes':
        return '🧸';
      default:
        return '✨';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* 1. VITRINE STYLE CARROUSEL E-COMMERCE MODERNE (INSPIRÉ SHEIN / TRENDYOL) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">

          {/* COLONNE GAUCHE (3 MINI BANNIÈRES VIBRANTES STYLE DAKAR CHIC) */}
          <div className="hidden md:flex md:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
            {/* Carte 1 : Mode Féminine */}
            <Link
              to="/catalog?categoryId=1"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"
                alt="Mode Féminine"
                className="absolute inset-0 w-full h-full object-cover object-top opacity-65 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors">
                  Dressing Femme
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Robes, Wax & Tops chic</span>
              </div>
            </Link>

            {/* Carte 2 : Style Homme */}
            <Link
              to="/catalog?categoryId=2"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80"
                alt="Style Homme"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-65 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors">
                  Élégance Homme
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Chemises col mao & lin</span>
              </div>
            </Link>

            {/* Carte 3 : Artisans de Ngaye */}
            <Link
              to="/catalog?categoryId=5"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80"
                alt="Artisanat de Ngaye"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-65 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors">
                  Cuir de Ngaye
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Maroquinerie artisanale</span>
              </div>
            </Link>
          </div>

          {/* COLONNE CENTRALE : LE GRAND CARROUSEL AVEC MINI-CARTES PRODUITS */}
          <div className="col-span-12 md:col-span-9 lg:col-span-6 relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md h-[280px]">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                  }`}
                >
                  {/* Photo de fond authentique et haute résolution */}
                  <img
                    src={slide.bgImage}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.themeGradient || 'from-slate-950 via-slate-950/80 to-purple-950/40'}`} />

                  {/* Contenu du slide */}
                  <div className="relative z-10 h-full p-5 sm:p-7 flex flex-col justify-between">
                    {/* En-tête textuel percutant */}
                    <div className="space-y-1.5 max-w-xs sm:max-w-sm">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
                        {slide.tag}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                        {slide.title}
                      </h2>
                      <p className="text-[11px] text-purple-200 font-semibold tracking-wide uppercase">
                        {slide.subtitle}
                      </p>
                    </div>

                    {/* Zone inférieure : 2 Mini-Cartes Produits avec Prix nets en FCFA */}
                    <div className="flex items-end justify-between gap-3">
                      <Link
                        to={slide.catalogLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-purple-50 text-slate-950 hover:text-purple-700 text-[11px] font-black shadow-md transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                        <span>{slide.buttonText || 'Explorer la sélection'}</span>
                      </Link>

                      <div className="flex items-center gap-2 sm:gap-3">
                        {slide.items.map((it, itemIdx) => (
                          <Link
                            key={itemIdx}
                            to={it.link}
                            className="group relative w-22 sm:w-26 h-26 sm:h-30 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/90 shadow-xl shrink-0 transition-transform hover:scale-105"
                            title={it.title}
                          >
                            <img
                              src={it.image}
                              alt={it.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Pastille de Prix nette en bas */}
                            <div className="absolute bottom-1 inset-x-1 bg-white/95 backdrop-blur-xs text-slate-950 text-[10px] sm:text-[11px] font-black text-center py-1 px-1 rounded-xl shadow-xs">
                              {it.price}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Boutons Flèches Précédent / Suivant */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-md"
              title="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-md"
              title="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Indicateurs de pagination en bas au centre (dots) */}
            <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5">
              {heroSlides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentSlide(dotIdx)}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIdx === currentSlide
                      ? 'w-6 bg-purple-500'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Aller au slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* COLONNE DROITE (3 SÉLECTIONS PHARES REVIBE FLIP) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
            {/* Sélection 1 : Créateurs Wax */}
            <Link
              to="/catalog?categoryId=3"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=500&q=80"
                alt="Créateurs Wax"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2 text-right w-full">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors uppercase">
                  Boutiques Wax
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Woodin & Bazin Getzner</span>
              </div>
            </Link>

            {/* Sélection 2 : Sneakers DKR */}
            <Link
              to="/catalog?categoryId=4"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80"
                alt="Sneakers DKR"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2 text-right w-full">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors uppercase">
                  Sneakers DKR
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Nike, Adidas vérifiées</span>
              </div>
            </Link>

            {/* Sélection 3 : Petits Prix */}
            <Link
              to="/catalog?maxPrice=15000"
              className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
            >
              <img
                src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80"
                alt="Moins de 15 000 FCFA"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/75 to-transparent" />
              <div className="relative z-10 px-4 py-2 text-right w-full">
                <span className="text-white text-xs font-black tracking-wide group-hover:text-purple-300 transition-colors uppercase">
                  Pépites &lt; 15 000 F
                </span>
                <span className="block text-[10px] text-purple-200/90 font-medium">Les meilleures affaires</span>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* 2. RUBRIQUE RAYONS & CATÉGORIES (AÉRATION GÉNÉREUSE & ÉPURÉE) */}
      <section className="my-7 sm:my-10">
        {/* Règles CSS prioritaires pour supprimer toute trace de scrollbar horizontale */}
        <style>{`
          .hide-category-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .hide-category-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
            background: transparent !important;
            opacity: 0 !important;
          }
          .hide-category-scrollbar::-webkit-scrollbar-thumb,
          .hide-category-scrollbar::-webkit-scrollbar-track {
            display: none !important;
            background: transparent !important;
            opacity: 0 !important;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Carrousel avec flèches gauche (<) et droite (>) intégrées */}
          <div className="relative flex items-center">
            {/* Flèche gauche (<) */}
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="absolute -left-2 sm:-left-3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-purple-700 shadow-md border border-slate-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Précédent (<)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Conteneur défilant des DEUX LIGNES de catégories (Aéré, spacieux & épuré) */}
            <div
              ref={categoryScrollRef}
              data-no-scrollbar="true"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex flex-col gap-4 sm:gap-6 overflow-x-auto scroll-smooth hide-category-scrollbar no-scrollbar scrollbar-none py-3 px-8 sm:px-12 w-full"
            >
              {/* LIGNE 1 DE CATÉGORIES CIRCULAIRES */}
              <div className="flex items-center gap-5 sm:gap-7 shrink-0">
                {visualCategoriesRow1.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.link}
                    className="group flex flex-col items-center shrink-0 w-[84px] sm:w-[96px] transition-transform active:scale-95"
                  >
                    <div className="w-[66px] h-[66px] sm:w-[78px] sm:h-[78px] rounded-full aspect-square overflow-hidden border-2 border-white bg-slate-50 hover:border-purple-400 group-hover:scale-105 transition-all p-0.5 shadow-xs">
                      {cat.isSpecial ? (
                        <div className="w-full h-full rounded-full aspect-square bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                          <Sparkles className="w-7 h-7" />
                        </div>
                      ) : (
                        <img
                          src={cat.visual}
                          alt={cat.name}
                          className="w-full h-full object-cover rounded-full aspect-square"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-center mt-2 transition-colors w-full line-clamp-2 leading-tight text-slate-700 group-hover:text-purple-700 min-h-[26px] sm:min-h-[28px] flex items-center justify-center px-0.5">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* LIGNE 2 DE CATÉGORIES CIRCULAIRES */}
              <div className="flex items-center gap-5 sm:gap-7 shrink-0">
                {visualCategoriesRow2.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.link}
                    className="group flex flex-col items-center shrink-0 w-[84px] sm:w-[96px] transition-transform active:scale-95"
                  >
                    <div className="w-[66px] h-[66px] sm:w-[78px] sm:h-[78px] rounded-full aspect-square overflow-hidden border-2 border-white bg-slate-50 hover:border-purple-400 group-hover:scale-105 transition-all p-0.5 shadow-xs">
                      <img
                        src={cat.visual}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-full aspect-square"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-center mt-2 transition-colors w-full line-clamp-2 leading-tight text-slate-700 group-hover:text-purple-700 min-h-[26px] sm:min-h-[28px] flex items-center justify-center px-0.5">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Flèche droite (>) */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="absolute -right-2 sm:-right-3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-purple-700 shadow-md border border-slate-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Suivant (>)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. VITRINE DES ARTICLES RECOMMANDÉS (4 COLONNES AÉRÉES & HAUT DE GAMME) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-8">
        {/* Onglets des univers / catégories (Épurés, généreusement espacés) */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto hide-category-scrollbar no-scrollbar">
            {showcaseTabs.map((tab) => {
              const isSelected = activeShowcaseTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveShowcaseTab(tab.id)}
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

        {/* Grille de cartes produits aérée (4 colonnes de prestige, espacements généreux) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl aspect-[3/4] border border-slate-100 p-2" />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-150 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Aucun article dans cette sélection</h3>
            <button
              onClick={() => setActiveShowcaseTab('all')}
              className="text-xs font-bold text-purple-700 hover:underline"
            >
              Afficher toute la sélection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {displayedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </main>
      {/* 4. BANDEAU FLOTTANT : CONNECTEZ-VOUS ET PROFITEZ-EN PLUS ! (EXACTEMENT COMME L'IMAGE MODÈLE) */}
      {!isAuthenticated && showLoginPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center justify-between gap-4 max-w-lg w-[92%] sm:w-auto animate-fade-in">
          <span className="text-xs sm:text-sm font-semibold text-slate-100">
            Connectez-vous et profitez-en plus !
          </span>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Se connecter
            </Link>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
