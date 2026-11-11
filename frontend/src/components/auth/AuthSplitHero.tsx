import React from 'react';
import { Logo } from '../Logo';

interface AuthSplitHeroProps {
  heading: React.ReactNode;
  subtitle: string;
}

/**
 * Panneau visuel latéral pour les pages de connexion et d'inscription.
 * Fond sombre dégradé avec branding ReVibe FliP et reflets modernes.
 */
export const AuthSplitHero: React.FC<AuthSplitHeroProps> = ({ heading, subtitle }) => {
  return (
    <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding */}
      <div className="relative z-10 flex items-center">
        <Logo variant="dark" size="md" />
      </div>

      {/* Center Copy */}
      <div className="relative z-10 space-y-4 my-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
          {heading}
        </h1>

        <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-sm">
          {subtitle}
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 text-[11px] text-slate-400">
        © {new Date().getFullYear()} ReVibe FliP. Tous droits réservés.
      </div>
    </div>
  );
};
