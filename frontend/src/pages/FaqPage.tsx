import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { FaqItem } from '../types';
import {
  HelpCircle,
  Search,
  ChevronDown,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Package,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUTES');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    contentApi.getFaq()
      .then((res) => {
        if (res.data?.data) {
          setFaqItems(res.data.data);
          // Ouvrir les 2 premières questions par défaut
          if (res.data.data.length > 0) {
            setExpandedIds({
              [res.data.data[0].id]: true,
              ...(res.data.data[1] ? { [res.data.data[1].id]: true } : {})
            });
          }
        }
      })
      .catch((err) => console.error('Erreur chargement FAQ:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleAccordion = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    'TOUTES',
    ...Array.from(new Set(faqItems.map((item) => item.category))).filter(Boolean),
  ];

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'TOUTES' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* HERO SECTION */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
            <span>Centre d'Aide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Foire Aux Questions (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Retrouvez ici les réponses aux questions les plus fréquentes sur le fonctionnement des commandes, du paiement sécurisé, de la livraison et des litiges sur ReVibe FliP.
          </p>

          {/* BARRE DE RECHERCHE */}
          <div className="pt-2">
            <div className="relative max-w-lg mx-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question (séquestre, livraison, litige...)"
                className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:border-purple-600 text-xs shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* FILTRES PAR CATÉGORIES */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat === 'TOUTES' ? 'Toutes les questions' : cat}
            </button>
          ))}
        </div>

        {/* ACCORDÉONS FAQ */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 font-bold">Chargement des questions fréquentes...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-gray-150 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-black text-gray-800">Aucune réponse trouvée</h3>
            <p className="text-xs text-gray-500">Essayez un autre terme de recherche ou contactez directement notre support.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800"
            >
              <span>Poser ma question au support</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isOpen = !!expandedIds[item.id];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-150 shadow-2xs overflow-hidden transition-all hover:border-purple-200"
                >
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus:bg-purple-50/30"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-black uppercase shrink-0">
                        {item.category}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-purple-700' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-slate-50/50">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BLOC BESOIN D'AIDE */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-black">Vous n'avez pas trouvé votre réponse ?</h3>
            <p className="text-xs text-purple-200">Notre équipe de support basée à Dakar vous répond sous 24h.</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-purple-900 text-xs font-black hover:bg-purple-50 transition-all shadow-sm shrink-0"
          >
            <span>Envoyer un message au support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
