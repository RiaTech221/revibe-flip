/**
 * Section Page d'Accueil : HomeHeroCarousel
 * 
 * Composant visuel et interactif de la page d'accueil ReVibe FliP (HomeHeroCarousel).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

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
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* COLONNE GAUCHE (3 MINI BANNIÈRES VIBRANTES) */}
        <div className="hidden md:flex md:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
          <Link
            to="/catalog?categoryId=1"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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

          <Link
            to="/catalog?categoryId=2"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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

          <Link
            to="/catalog?categoryId=5"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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

        {/* COLONNE CENTRALE : CARROUSEL INSPIRÉ TRENDS (SHEIN) */}
        <div className="col-span-12 md:col-span-9 lg:col-span-6 relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-700 via-purple-600 to-purple-100 shadow-sm h-[250px] sm:h-[280px]">
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                {/* Fond dégradé doux façon Trends */}
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.themeGradient || 'from-purple-800 via-purple-600/90 to-purple-200/95'}`} />

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
                      <p className="text-[11px] text-white/85 font-medium line-clamp-2">
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
                        className="group relative w-24 sm:w-28 h-32 sm:h-40 rounded-xl bg-white p-1.5 shadow-md shrink-0 transition-transform hover:-translate-y-1"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer"
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer"
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

        {/* COLONNE DROITE (3 SÉLECTIONS PHARES) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-between gap-2.5 h-[280px]">
          <Link
            to="/catalog?categoryId=3"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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

          <Link
            to="/catalog?categoryId=4"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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

          <Link
            to="/catalog?maxPrice=15000"
            className="group relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xs flex items-center transition-all hover:border-purple-500/60"
          >
            <img
              src="/placeholder-product.svg"
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
  );
};
