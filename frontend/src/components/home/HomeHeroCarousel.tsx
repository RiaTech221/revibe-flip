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
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.themeGradient || 'from-slate-950 via-slate-950/80 to-purple-950/40'}`} />

                <div className="relative z-10 h-full p-5 sm:p-7 flex flex-col justify-between">
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
            onClick={onPrevSlide}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-md cursor-pointer"
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextSlide}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-md cursor-pointer"
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
                    ? 'w-6 bg-purple-500'
                    : 'w-2 bg-white/40 hover:bg-white/70'
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
  );
};
