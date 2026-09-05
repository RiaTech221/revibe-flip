import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Smartphone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 pt-16 pb-12 border-t border-purple-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Propositions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-gray-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-900/60 text-purple-400 rounded-2xl border border-purple-800/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Paiement Escrow 100% Sécurisé</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Votre argent est bloqué en toute sécurité et n'est versé au vendeur qu'après confirmation de votre part.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-pink-900/60 text-pink-400 rounded-2xl border border-pink-800/50">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Paiements Mobiles Locaux</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Réglez facilement avec vos applications favorites : Wave, Orange Money et Free Money sans carte bancaire.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-900/60 text-emerald-400 rounded-2xl border border-emerald-800/50">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Livraison Adaptée & Suivie</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Livraison à domicile rapide par moto coursier ou remise en main propre gratuite convenue entre vous.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-gray-800 text-xs">
          <div>
            <img src="/logo.png" alt="ReVibe FliP" className="h-12 w-auto object-contain mb-3 brightness-125" />
            <p className="text-gray-400 leading-relaxed">
              La marketplace africaine de seconde main qui donne une seconde vie aux vêtements et objets du quotidien.
            </p>
            <p className="text-purple-400 font-bold mt-2">
              🇸🇳 Lancement officiel au Sénégal
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Découvrir</h5>
            <ul className="space-y-2">
              <li><Link to="/catalog?categoryId=1" className="hover:text-purple-400 transition-colors">Mode Femmes</Link></li>
              <li><Link to="/catalog?categoryId=2" className="hover:text-purple-400 transition-colors">Mode Hommes</Link></li>
              <li><Link to="/catalog?categoryId=3" className="hover:text-purple-400 transition-colors">Wax & Bazin Traditionnel</Link></li>
              <li><Link to="/catalog?categoryId=4" className="hover:text-purple-400 transition-colors">Chaussures & Sneakers</Link></li>
              <li><Link to="/catalog?categoryId=5" className="hover:text-purple-400 transition-colors">Maroquinerie & Accessoires</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Acheter & Vendre</h5>
            <ul className="space-y-2">
              <li><Link to="/sell" className="hover:text-purple-400 transition-colors">Comment vendre ?</Link></li>
              <li><Link to="/catalog" className="hover:text-purple-400 transition-colors">Acheter en toute confiance</Link></li>
              <li><span className="text-gray-400">Commission plateforme : 20%</span></li>
              <li><span className="text-gray-400">Frais de validation : 1%</span></li>
              <li><span className="text-gray-400">Système Escrow (Séquestre)</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Moyens de Paiement</h5>
            <div className="flex flex-col gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-sky-950/80 text-sky-300 font-bold border border-sky-800 inline-block w-max">
                Wave Sénégal 🐧
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-orange-950/80 text-orange-300 font-bold border border-orange-800 inline-block w-max">
                Orange Money 🍊
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-red-950/80 text-red-300 font-bold border border-red-800 inline-block w-max">
                Free Money 📱
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 ReVibe FliP. Tous droits réservés. Version 1 (MVP).</p>
          <p className="flex items-center gap-1">
            Fait avec <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> pour le Sénégal & l'Afrique
          </p>
        </div>
      </div>
    </footer>
  );
};
