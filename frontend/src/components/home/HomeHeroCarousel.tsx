/**
 * Section Page d'Accueil : HomeHeroCarousel
 * 
 * Composant visuel et interactif de la page d'accueil ReVibe FliP (HomeHeroCarousel).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shirt,
  ShoppingBag,
  Footprints,
  Tag,
  Gem,
} from 'lucide-react';

export interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  bgImage: string;
  themeGradient?: string;
  catalogLink: string;
  buttonText?: string;
  items: {
    title: string;
    price: string;
    image: string;
    link: string;
  }[];
}

interface HomeHeroCarouselProps {
  slides: HeroSlide[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
}

export const HomeHeroCarousel: React.FC<HomeHeroCarouselProps> = ({
  slides,
  currentSlide,
  setCurrentSlide,
  onPrevSlide,
  onNextSlide,
}) => {
  const slidePalettes = [
    'from-purple-700 via-purple-600 to-fuchsia-500',
    'from-indigo-700 via-purple-700 to-pink-500',
    'from-violet-700 via-indigo-600 to-sky-500',
    'from-amber-600 via-orange-500 to-rose-500',
    'from-emerald-600 via-teal-600 to-cyan-500',
  ];

  const leftCards = [
    {
      to: '/catalog?categoryId=1',
      title: 'Dressing Femme',
      subtitle: 'Robes, Wax & Tops chic',
      icon: <Sparkles className="w-4 h-4 text-purple-700" />,
      iconBg: 'bg-purple-100/90',
    },
    {
      to: '/catalog?categoryId=2',
      title: 'Élégance Homme',
      subtitle: 'Chemises col mao & lin',
      icon: <Shirt className="w-4 h-4 text-indigo-700" />,
      iconBg: 'bg-indigo-100/90',
    },
    {
      to: '/catalog?categoryId=5',
      title: 'Cuir de Ngaye',
      subtitle: 'Maroquinerie artisanale',
      icon: <ShoppingBag className="w-4 h-4 text-amber-700" />,
      iconBg: 'bg-amber-100/90',
    },
  ];

  const rightCards = [
    {
      to: '/catalog?categoryId=3',
      title: 'Boutiques Wax',
      subtitle: 'Woodin & Bazin Getzner',
      icon: <Gem className="w-4 h-4 text-pink-700" />,
      iconBg: 'bg-pink-100/90',
    },
    {
      to: '/catalog?categoryId=4',
      title: 'Sneakers DKR',
      subtitle: 'Nike, Adidas vérifiées',
      icon: <Footprints className="w-4 h-4 text-sky-700" />,
      iconBg: 'bg-sky-100/90',
    },
    {
      to: '/catalog?maxPrice=15000',
      title: 'Pépites < 15 000 F',
      subtitle: 'Les meilleures affaires',
      icon: <Tag className="w-4 h-4 text-emerald-700" />,
      iconBg: 'bg-emerald-100/90',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        {/* COLONNE GAUCHE (3 CARTES MODERNES ÉPURÉES) */}
        <div className="hidden md:flex md:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
          {leftCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group flex-1 rounded-2xl bg-white border border-gray-200/80 px-4 py-3 flex items-center justify-between gap-3 shadow-2xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span className="block text-gray-900 text-xs font-extrabold tracking-tight group-hover:text-purple-700 transition-colors truncate">
                    {card.title}
                  </span>
                  <span className="block text-[11px] text-gray-500 font-medium truncate">
                    {card.subtitle}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>

        {/* COLONNE CENTRALE : CARROUSEL INSPIRÉ TRENDS (SHEIN) */}
        <div className="col-span-12 md:col-span-9 lg:col-span-6 relative rounded-2xl overflow-hidden shadow-md h-[250px] sm:h-[280px]">
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            const palette = slidePalettes[idx % slidePalettes.length];
            const hasRealBg = slide.bgImage && slide.bgImage !== '/placeholder-product.svg';

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br ${palette} ${
                  isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                {hasRealBg && (
                  <img
                    src={slide.bgImage}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
                  />
                )}
                {/* Décor lumineux discret */}
                <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/15 blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-12 w-48 h-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 h-full px-5 sm:px-7 py-5 flex items-center justify-between gap-4">
                  {/* Bloc Texte / Trend à gauche */}
                  <div className="flex flex-col justify-between h-full max-w-[52%] sm:max-w-[46%] py-1">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        <span className="truncate">{slide.tag}</span>
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug tracking-tight line-clamp-2">
                        {slide.title}
                      </h2>
                      <p className="text-[11px] text-white/90 font-medium line-clamp-2">
                        {slide.subtitle}
                      </p>
                    </div>

                    <div>
                      <Link
                        to={slide.catalogLink}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-purple-50 text-slate-900 hover:text-purple-700 text-[11px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        <span>{slide.buttonText || 'Explorer'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Mini-cartes encadrées façon SHEIN à droite */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pr-5 sm:pr-6">
                    {slide.items.slice(0, 2).map((it, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={it.link}
                        className="group relative w-24 sm:w-28 h-32 sm:h-40 rounded-xl bg-white p-1.5 shadow-lg shrink-0 transition-transform hover:-translate-y-1"
                        title={it.title}
                      >
                        <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={it.image}
                            alt={it.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                            {it.price}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Boutons Flèches Précédent / Suivant épurés */}
          <button
            type="button"
            onClick={onPrevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer"
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer"
            title="Suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicateurs dots */}
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentSlide(dotIdx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  dotIdx === currentSlide
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/45 hover:bg-white/75'
                }`}
                title={`Aller au slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* COLONNE DROITE (3 CARTES MODERNES ÉPURÉES) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
          {rightCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group flex-1 rounded-2xl bg-white border border-gray-200/80 px-4 py-3 flex items-center justify-between gap-3 shadow-2xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span className="block text-gray-900 text-xs font-extrabold tracking-tight group-hover:text-purple-700 transition-colors truncate">
                    {card.title}
                  </span>
                  <span className="block text-[11px] text-gray-500 font-medium truncate">
                    {card.subtitle}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
