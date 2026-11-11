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
import { initialCuratedProducts } from '../data/curatedProducts';
import { HomeHeroCarousel, HeroSlide } from '../components/home/HomeHeroCarousel';
import { HomeCategoryScroll, VisualCategory } from '../components/home/HomeCategoryScroll';
import { HomeShowcaseSection, ShowcaseTab } from '../components/home/HomeShowcaseSection';
import { HomeLoginPrompt } from '../components/home/HomeLoginPrompt';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  const [products, setProducts] = useState<Product[]>(initialCuratedProducts);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<string>('all');

  const visualCategoriesRow1: VisualCategory[] = [
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

  const visualCategoriesRow2: VisualCategory[] = [
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
      bgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-rose-950 via-slate-950/85 to-purple-950/40',
      catalogLink: '/catalog?categoryId=3',
      buttonText: 'Achetez maintenant',
      items: [
        {
          title: 'Grand Boubou Bazin Getzner',
          price: '35 000 FCFA',
          image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=400&q=80',
          link: '/product/1'
        },
        {
          title: 'Robe Évasée Wax Woodin',
          price: '18 500 FCFA',
          image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
          link: '/product/2'
        }
      ]
    },
    {
      id: 2,
      tag: 'SÉLECTION SPÉCIALE DAKAR',
      title: 'ROBES & WAX TENDANCE',
      subtitle: 'JUSQU’À -70% PAR RAPPORT AU NEUF',
      bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-purple-950 via-slate-950/85 to-indigo-950/40',
      catalogLink: '/catalog?categoryId=1',
      buttonText: 'Découvrir la sélection',
      items: [
        {
          title: 'Ensemble Bazin Riche Émeraude',
          price: '32 000 FCFA',
          image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80',
          link: '/product/13'
        },
        {
          title: 'Tailleur Pantalon Chic Terracotta',
          price: '24 000 FCFA',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          link: '/product/14'
        }
      ]
    },
    {
      id: 3,
      tag: 'STREETWEAR SÉNÉGAL',
      title: 'SNEAKERS & CASUAL HOMME',
      subtitle: 'AUTHENTIQUES & VÉRIFIÉES AVANT EXPÉDITION',
      bgImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-emerald-950 via-slate-950/85 to-teal-950/40',
      catalogLink: '/catalog?categoryId=4',
      buttonText: 'Voir les sneakers',
      items: [
        {
          title: 'Nike Air Max 90 Dakar Clean',
          price: '28 000 FCFA',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
          link: '/product/3'
        },
        {
          title: 'Chemise Casual Lin Écru',
          price: '11 000 FCFA',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
          link: '/product/18'
        }
      ]
    },
    {
      id: 4,
      tag: 'ARTISANAT LOCAL SÉNÉGALAIS',
      title: 'MAROQUINERIE DE NGAYE',
      subtitle: 'SACS & ACCESSOIRES EN CUIR VÉRITABLE',
      bgImage: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-amber-950 via-slate-950/85 to-orange-950/40',
      catalogLink: '/catalog?categoryId=5',
      buttonText: 'Soutenir les artisans',
      items: [
        {
          title: 'Sac Cabas Cuir Artisanal Ngaye',
          price: '15 000 FCFA',
          image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
          link: '/product/4'
        },
        {
          title: 'Sandales Cuir Tressées Ngaye',
          price: '8 500 FCFA',
          image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80',
          link: '/product/20'
        }
      ]
    },
    {
      id: 5,
      tag: 'BONS PLANS DAKAR',
      title: 'PÉPITES À MOINS DE 10 000 FCFA',
      subtitle: 'RENOUVELEZ VOTRE GARDE-ROBE À PETIT PRIX',
      bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
      themeGradient: 'from-blue-950 via-slate-950/85 to-cyan-950/40',
      catalogLink: '/catalog?maxPrice=10000',
      buttonText: 'Voir les pépites',
      items: [
        {
          title: 'Jean Levi\'s 501 Vintage Bleu',
          price: '9 500 FCFA',
          image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80',
          link: '/product/16'
        },
        {
          title: 'Robe Courte Imprimée Fleurs',
          price: '7 500 FCFA',
          image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80',
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

        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data?.content?.length) {
          const apiProducts = prodRes.value.data.data.content;
          const merged = [...apiProducts];
          initialCuratedProducts.forEach((curated) => {
            if (!merged.some((p) => p.id === curated.id)) {
              merged.push(curated);
            }
          });
          setProducts(merged);
        } else {
          setProducts(initialCuratedProducts);
        }

        if (catRes.status === 'fulfilled' && catRes.value?.data?.data) {
          setCategories(catRes.value.data.data);
        }
      } catch {
        setProducts(initialCuratedProducts);
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
