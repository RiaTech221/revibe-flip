/**
 * Page d'Accueil Principale ReVibe FliP
 * 
 * Vitrine principale de la marketplace ReVibe FliP :
 *  * - Carrousel promotionnel interactif mettant en avant la protection séquestre et offres phares
 *  * - Défilement horizontal des catégories tendances et culturelles (Wax, Bazin, etc.)
 *  * - Sections vitrines (Nouveautés, Bonnes affaires, Tendances) avec cartes produits interactives
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productApi, categoryApi } from '../services/api';
import { Product, Category } from '../types';
import { HomeHeroCarousel, HeroSlide } from '../components/home/HomeHeroCarousel';
import { HomeCategoryScroll, VisualCategory } from '../components/home/HomeCategoryScroll';
import { HomeShowcaseSection, ShowcaseTab } from '../components/home/HomeShowcaseSection';
import { HomeLoginPrompt } from '../components/home/HomeLoginPrompt';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<string>('all');

  const visualCategoriesRow1: VisualCategory[] = [
    { id: 'all', name: 'Tout voir', link: '/catalog', visual: '/placeholder-product.svg', isSpecial: true },
    { id: '1', name: 'Femmes', link: '/catalog?categoryId=1', visual: '/placeholder-product.svg' },
    { id: '2', name: 'Hommes', link: '/catalog?categoryId=2', visual: '/placeholder-product.svg' },
    { id: '3', name: 'Wax & Bazin', link: '/catalog?categoryId=3', visual: '/placeholder-product.svg' },
    { id: '4', name: 'Chaussures', link: '/catalog?categoryId=4', visual: '/placeholder-product.svg' },
    { id: '5', name: 'Sacs & Cuir', link: '/catalog?categoryId=5', visual: '/placeholder-product.svg' },
    { id: '6', name: 'Enfants', link: '/catalog?categoryId=6', visual: '/placeholder-product.svg' },
    { id: '7', name: 'Bijoux', link: '/catalog?query=bijoux', visual: '/placeholder-product.svg' },
    { id: '8', name: 'Robes Soirée', link: '/catalog?query=robe', visual: '/placeholder-product.svg' },
    { id: '9', name: 'Tops & Blouses', link: '/catalog?query=top', visual: '/placeholder-product.svg' },
    { id: '10', name: 'Lingerie', link: '/catalog?query=lingerie', visual: '/placeholder-product.svg' },
  ];

  const visualCategoriesRow2: VisualCategory[] = [
    { id: '11', name: 'Jeans & Denim', link: '/catalog?query=jean', visual: '/placeholder-product.svg' },
    { id: '12', name: 'Vestes', link: '/catalog?query=veste', visual: '/placeholder-product.svg' },
    { id: '13', name: 'Mode Curvy', link: '/catalog?query=curvy', visual: '/placeholder-product.svg' },
    { id: '14', name: 'Maison & Déco', link: '/catalog?categoryId=8', visual: '/placeholder-product.svg' },
    { id: '15', name: 'Beauté & Soins', link: '/catalog?query=beaute', visual: '/placeholder-product.svg' },
    { id: '16', name: 'Accs Téléphone', link: '/catalog?query=accessoires', visual: '/placeholder-product.svg' },
    { id: '17', name: 'Sandales', link: '/catalog?query=sandale', visual: '/placeholder-product.svg' },
    { id: '18', name: 'Bébés', link: '/catalog?query=bebe', visual: '/placeholder-product.svg' },
    { id: '19', name: 'Sportswear', link: '/catalog?query=sport', visual: '/placeholder-product.svg' },
    { id: '20', name: '< 10 000 FCFA', link: '/catalog?maxPrice=10000', visual: '/placeholder-product.svg' },
    { id: '21', name: 'Créateurs Dakar', link: '/catalog?query=artisanat', visual: '/placeholder-product.svg' },
  ];

  const showcaseTabs: ShowcaseTab[] = [
    { id: 'all', label: '✨ Coups de Cœur ReVibe' },
    { id: 'femmes', label: 'Femmes', categoryId: 1, keywords: ['femme', 'robe', 'jupe', 'top', 'blouse', 'lingerie', 'tailleur'] },
    { id: 'hommes', label: 'Hommes', categoryId: 2, keywords: ['homme', 'chemise', 'pantalon', 'polo', 'costume', 'jean'] },
    { id: 'wax', label: 'Wax & Bazin Chic', categoryId: 3, keywords: ['wax', 'bazin', 'boubou', 'getzner', 'woodin', 'couture', 'teinté', 'vlisco', 'artisanat'] },
    { id: 'chaussures', label: 'Sneakers & Souliers', categoryId: 4, keywords: ['chaussure', 'basket', 'sneaker', 'sandale', 'air max', 'nike', 'adidas', 'stan smith', 'dunk', 'tropéziennes'] },
    { id: 'sacs', label: 'Sacs & Maroquinerie', categoryId: 5, keywords: ['sac', 'cuir', 'maroquinerie', 'cabas', 'pochette', 'ngaye', 'bandoulière'] },
    { id: 'petits-prix', label: 'Pépites < 10 000 F', maxPrice: 10000 },
  ];

  const heroSlides: HeroSlide[] = [
    {
      id: 1,
      tag: 'FÊTES & SOIRÉES DAKAR',
      title: 'FÊTES DE FIN D’ANNÉE',
      subtitle: 'MODE SÉNÉGALAISE FESTIVE & LOOKS COCOONING',
      bgImage: '/placeholder-product.svg',
      themeGradient: 'from-rose-950 via-slate-950/85 to-purple-950/40',
      catalogLink: '/catalog?categoryId=3',
      buttonText: 'Achetez maintenant',
      items: [
        {
          title: 'Grand Boubou Bazin Getzner',
          price: '35 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/1'
        },
        {
          title: 'Robe Évasée Wax Woodin',
          price: '18 500 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/2'
        }
      ]
    },
    {
      id: 2,
      tag: 'SÉLECTION SPÉCIALE DAKAR',
      title: 'ROBES & WAX TENDANCE',
      subtitle: 'JUSQU’À -70% PAR RAPPORT AU NEUF',
      bgImage: '/placeholder-product.svg',
      themeGradient: 'from-purple-950 via-slate-950/85 to-indigo-950/40',
      catalogLink: '/catalog?categoryId=1',
      buttonText: 'Découvrir la sélection',
      items: [
        {
          title: 'Ensemble Bazin Riche Émeraude',
          price: '32 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/13'
        },
        {
          title: 'Tailleur Pantalon Chic Terracotta',
          price: '24 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/14'
        }
      ]
    },
    {
      id: 3,
      tag: 'STREETWEAR SÉNÉGAL',
      title: 'SNEAKERS & CASUAL HOMME',
      subtitle: 'AUTHENTIQUES & VÉRIFIÉES AVANT EXPÉDITION',
      bgImage: '/placeholder-product.svg',
      themeGradient: 'from-emerald-950 via-slate-950/85 to-teal-950/40',
      catalogLink: '/catalog?categoryId=4',
      buttonText: 'Voir les sneakers',
      items: [
        {
          title: 'Nike Air Max 90 Dakar Clean',
          price: '28 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/3'
        },
        {
          title: 'Chemise Casual Lin Écru',
          price: '11 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/18'
        }
      ]
    },
    {
      id: 4,
      tag: 'ARTISANAT LOCAL SÉNÉGALAIS',
      title: 'MAROQUINERIE DE NGAYE',
      subtitle: 'SACS & ACCESSOIRES EN CUIR VÉRITABLE',
      bgImage: '/placeholder-product.svg',
      themeGradient: 'from-amber-950 via-slate-950/85 to-orange-950/40',
      catalogLink: '/catalog?categoryId=5',
      buttonText: 'Soutenir les artisans',
      items: [
        {
          title: 'Sac Cabas Cuir Artisanal Ngaye',
          price: '15 000 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/4'
        },
        {
          title: 'Sandales Cuir Tressées Ngaye',
          price: '8 500 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/20'
        }
      ]
    },
    {
      id: 5,
      tag: 'BONS PLANS DAKAR',
      title: 'PÉPITES À MOINS DE 10 000 FCFA',
      subtitle: 'RENOUVELEZ VOTRE GARDE-ROBE À PETIT PRIX',
      bgImage: '/placeholder-product.svg',
      themeGradient: 'from-blue-950 via-slate-950/85 to-cyan-950/40',
      catalogLink: '/catalog?maxPrice=10000',
      buttonText: 'Voir les pépites',
      items: [
        {
          title: 'Jean Levi\'s 501 Vintage Bleu',
          price: '9 500 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/16'
        },
        {
          title: 'Robe Courte Imprimée Fleurs',
          price: '7 500 FCFA',
          image: '/placeholder-product.svg',
          link: '/product/25'
        }
      ]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.allSettled([
          productApi.search({ size: 24 }),
          categoryApi.getAll(),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data?.content) {
          setProducts(prodRes.value.data.data.content);
        } else {
          setProducts([]);
        }

        if (catRes.status === 'fulfilled' && catRes.value?.data?.data) {
          setCategories(catRes.value.data.data);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Défilement automatique du Carrousel Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const currentTab = showcaseTabs.find((t) => t.id === activeShowcaseTab) || showcaseTabs[0];
  const displayedProducts = products.filter((prod) => {
    if (currentTab.id === 'all') return true;
    if (currentTab.categoryId && (prod as any).categoryId === currentTab.categoryId) return true;
    if (currentTab.maxPrice && prod.price <= currentTab.maxPrice) return true;
    if (currentTab.keywords && currentTab.keywords.length > 0) {
      const searchTarget = `${prod.title} ${prod.description || ''} ${prod.brand || ''}`.toLowerCase();
      return currentTab.keywords.some((kw) => searchTarget.includes(kw.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <HomeHeroCarousel
        slides={heroSlides}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
      />

      <HomeCategoryScroll
        row1={visualCategoriesRow1}
        row2={visualCategoriesRow2}
      />

      <HomeShowcaseSection
        tabs={showcaseTabs}
        activeTab={activeShowcaseTab}
        setActiveTab={setActiveShowcaseTab}
        products={displayedProducts}
        loading={loading}
      />

      <HomeLoginPrompt
        show={!isAuthenticated && showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
};
