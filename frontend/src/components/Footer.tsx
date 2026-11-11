/**
 * Pied de Page Principal ReVibe FliP
 * 
 * Composant de pied de page présent sur toutes les vues de l'application :
 *  * - Liens de navigation (Catalogue, Vendre, À propos, Comment ça marche)
 *  * - Liens d'assistance (FAQ, Contact, Résolution de litiges, Signalement)
 *  * - Réseaux sociaux, pays acceptés et mentions légales
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentApi, categoryApi } from '../services/api';
import { FooterConfig, Category } from '../types';
import { Logo } from './Logo';
import {
  ChevronDown,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  Compass,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [config, setConfig] = useState<FooterConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Accordéons mobile (par défaut fermés sur petit écran)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    discover: false,
    help: false,
    legal: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    Promise.all([
      contentApi.getFooter().then((res) => {
        if (res.data?.data) setConfig(res.data.data);
      }),
      categoryApi.getAll().then((res) => {
        if (res.data?.data) setCategories(res.data.data.slice(0, 4));
      }),
    ]).catch((err) => console.warn('Erreur chargement footer:', err));
  }, []);

  const currentYear = new Date().getFullYear();
  const copyrightText = (config?.copyright || '© {year} ReVibe FliP. Tous droits réservés.')
    .replace('{year}', currentYear.toString())
    .replace('{année en cours}', currentYear.toString());

  const catchphrase =
    config?.catchphrase ||
    'La marketplace sénégalaise de seconde main dédiée aux vêtements et articles du quotidien.';

  const supportEmail = config?.supportEmail || 'contact@revibeflip.com';
  const supportPhone = config?.supportPhone || '+221 77 123 45 67';

  // Réseaux sociaux filtrés
  const socialLinks = config?.socialLinks || {};

  return (
    <footer className="bg-slate-950 text-slate-300 text-xs border-t border-slate-800/80 font-sans pb-10 sm:pb-6 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* GRILLE PRINCIPALE (4 Colonnes desktop / Accordéons mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-6 border-b border-slate-800/80">

          {/* 1. COLONNE MARQUE */}
          <div className="space-y-3">
            <Link to="/" title="ReVibe FliP" className="inline-block">
              <Logo variant="dark" size="md" showTagline />
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              {catchphrase}
            </p>

            {/* Coordonnées Support */}
            <div className="space-y-1.5 pt-1 text-slate-300">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
                aria-label={`Email : ${supportEmail}`}
              >
                <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{supportEmail}</span>
              </a>

              <a
                href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
                aria-label={`Téléphone : ${supportPhone}`}
              >
                <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{supportPhone}</span>
              </a>
            </div>

            {/* Réseaux sociaux */}
            {Object.values(socialLinks).some(Boolean) && (
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/60 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-all"
                    aria-label="Instagram"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/60 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-all"
                    aria-label="Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/60 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-all"
                    aria-label="TikTok"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 flex items-center justify-center transition-all"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.x && (
                  <a
                    href={socialLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/60 text-slate-400 hover:text-purple-300 flex items-center justify-center transition-all"
                    aria-label="X"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 2. COLONNE DÉCOUVRIR */}
          <div className="border-t border-slate-800/80 md:border-t-0 pt-3 md:pt-0">
            <button
              onClick={() => toggleSection('discover')}
              className="w-full flex items-center justify-between text-left font-bold text-white uppercase tracking-wider text-[11px] mb-2.5 md:cursor-default"
              aria-expanded={openSections.discover}
            >
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Découvrir</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${
                  openSections.discover ? 'rotate-180' : ''
                }`}
              />
            </button>

            <ul className={`space-y-2 ${openSections.discover ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link
                  to="/catalog?sort=newest"
                  className="flex items-center gap-1.5 text-purple-300 font-semibold hover:text-purple-200 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Nouveautés</span>
                </Link>
              </li>

              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/catalog?categoryId=${cat.id}`}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}

              <li>
                <Link
                  to="/catalog"
                  className="text-[11px] text-slate-500 hover:text-purple-300 transition-colors inline-block pt-0.5"
                >
                  Tout le catalogue &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. COLONNE AIDE (Sans doublon avec profil ou ctas) */}
          <div className="border-t border-slate-800/80 md:border-t-0 pt-3 md:pt-0">
            <button
              onClick={() => toggleSection('help')}
              className="w-full flex items-center justify-between text-left font-bold text-white uppercase tracking-wider text-[11px] mb-2.5 md:cursor-default"
              aria-expanded={openSections.help}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Aide & Support</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${
                  openSections.help ? 'rotate-180' : ''
                }`}
              />
            </button>

            <ul className={`space-y-2 ${openSections.help ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link
                  to="/comment-ca-marche"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Foire aux questions (FAQ)
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Nous contacter
                </Link>
              </li>

              {/* Pages dynamiques CMS ajoutées dans Aide */}
              {config?.helpPages &&
                config.helpPages
                  .filter(
                    (p) =>
                      p.slug !== 'comment-ca-marche' &&
                      p.slug !== 'faq' &&
                      p.slug !== 'contact'
                  )
                  .map((page) => (
                    <li key={page.id}>
                      <Link
                        to={`/p/${page.slug}`}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>

          {/* 4. COLONNE LÉGAL */}
          <div className="border-t border-slate-800/80 md:border-t-0 pt-3 md:pt-0">
            <button
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between text-left font-bold text-white uppercase tracking-wider text-[11px] mb-2.5 md:cursor-default"
              aria-expanded={openSections.legal}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Informations Légales</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${
                  openSections.legal ? 'rotate-180' : ''
                }`}
              />
            </button>

            <ul className={`space-y-2 ${openSections.legal ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link
                  to="/cgu"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Conditions Générales d'Utilisation
                </Link>
              </li>
              <li>
                <Link
                  to="/confidentialite"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Mentions Légales
                </Link>
              </li>

              {/* Pages dynamiques CMS ajoutées dans Légal */}
              {config?.legalPages &&
                config.legalPages
                  .filter(
                    (p) =>
                      p.slug !== 'cgu' &&
                      p.slug !== 'confidentialite' &&
                      p.slug !== 'mentions-legales'
                  )
                  .map((page) => (
                    <li key={page.id}>
                      <Link
                        to={`/p/${page.slug}`}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>
        </div>

        {/* BARRE DU BAS ÉPURÉE */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-500">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
};
