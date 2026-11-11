/**
 * Composant Logo de la Marque ReVibe FliP
 * 
 * Rendu graphique SVG et vectoriel du logo ReVibe FliP avec déclinaisons de taille et thème.
 */

import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark'; // 'light' pour fond blanc (texte foncé), 'dark' pour fond sombre (texte blanc)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'stacked';
  showTagline?: boolean;
  className?: string;
}

/**
 * Logo ReVibe FliP Vectoriel & Épuré (Moderne, minimaliste, sans surcharge).
 * Badge monogramme « RF » avec anneaux circulaires de seconde main + typographie nette ReVibe FliP.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  layout = 'horizontal',
  showTagline = false,
  className = '',
}) => {
  const isDarkBg = variant === 'dark';

  const iconSizes = {
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const iconBadge = (
    <div
      className={`${iconSizes[size]} relative bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-purple-500/20 transition-transform duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center overflow-hidden`}
    >
      {/* Reflet subtil */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        {/* Boucle circulaire de renouvellement (flèche supérieure) */}
        <path
          d="M 12 18 C 12 12.5, 17 8, 23 8 C 28.5 8, 32.5 12, 33 16.5"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 30.5 11.5 L 33 16.5 L 36.5 14"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Boucle circulaire inverse (flèche inférieure) */}
        <path
          d="M 28 22 C 28 27.5, 23 32, 17 32 C 11.5 32, 7.5 28, 7 23.5"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 9.5 28.5 L 7 23.5 L 3.5 26"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Monogramme central net : RF */}
        <text
          x="20"
          y="23"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          RF
        </text>
      </svg>
    </div>
  );

  const typography = (
    <div className={`flex flex-col leading-none ${layout === 'stacked' ? 'items-center mt-2.5' : ''}`}>
      <div className={`font-black tracking-tight ${textSizes[size]} flex items-center`}>
        <span className={isDarkBg ? 'text-white' : 'text-slate-900'}>ReVibe</span>
        <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent ml-0.5">
          FliP
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 ml-1 animate-pulse" />
      </div>

      {showTagline && (
        <span
          className={`text-[9px] font-bold tracking-wider uppercase mt-1 ${
            isDarkBg ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Seconde Main Sécurisée
        </span>
      )}
    </div>
  );

  if (layout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center select-none group ${className}`}>
        {iconBadge}
        {typography}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group ${className}`}>
      {iconBadge}
      {typography}
    </div>
  );
};
