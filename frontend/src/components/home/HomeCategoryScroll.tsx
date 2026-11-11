import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface VisualCategory {
  id: string;
  name: string;
  link: string;
  visual: string;
  isSpecial?: boolean;
}

interface HomeCategoryScrollProps {
  row1: VisualCategory[];
  row2: VisualCategory[];
}

export const HomeCategoryScroll: React.FC<HomeCategoryScrollProps> = ({ row1, row2 }) => {
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-7 sm:my-10">
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
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="absolute -left-2 sm:-left-3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-purple-700 shadow-md border border-slate-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Précédent (<)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={categoryScrollRef}
            data-no-scrollbar="true"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex flex-col gap-4 sm:gap-6 overflow-x-auto scroll-smooth hide-category-scrollbar no-scrollbar scrollbar-none py-3 px-8 sm:px-12 w-full"
          >
            {/* LIGNE 1 */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0">
              {row1.map((cat) => (
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
                        className="w-full h-full rounded-full aspect-square object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-purple-700 mt-2 text-center line-clamp-1">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* LIGNE 2 */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0">
              {row2.map((cat) => (
                <Link
                  key={cat.id}
                  to={cat.link}
                  className="group flex flex-col items-center shrink-0 w-[84px] sm:w-[96px] transition-transform active:scale-95"
                >
                  <div className="w-[66px] h-[66px] sm:w-[78px] sm:h-[78px] rounded-full aspect-square overflow-hidden border-2 border-white bg-slate-50 hover:border-purple-400 group-hover:scale-105 transition-all p-0.5 shadow-xs">
                    <img
                      src={cat.visual}
                      alt={cat.name}
                      className="w-full h-full rounded-full aspect-square object-cover"
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-purple-700 mt-2 text-center line-clamp-1">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

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
  );
};
