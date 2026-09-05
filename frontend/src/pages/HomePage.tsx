import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { EscrowShield } from '../components/EscrowShield';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
  Truck,
  CheckCircle,
  Tag,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { openAuthModal, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productApi.search({ limit: 8, sortBy: 'createdAt', sortDir: 'desc' }),
      categoryApi.getAll(),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data?.data?.content) {
          setProducts(prodRes.data.data.content);
        }
        if (catRes.data?.data) {
          setCategories(catRes.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-950 to-purple-950 text-white py-16 sm:py-24">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-800/80 border border-purple-700/60 text-purple-200 text-xs font-semibold">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Marketplace africaine de seconde main — Lancement Sénégal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Redonner une{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-300">
                  seconde vie
                </span>{' '}
                à vos vêtements & objets
              </h1>

              <p className="text-base sm:text-lg text-purple-100/90 max-w-2xl font-normal leading-relaxed">
                Achetez et vendez facilement en Afrique avec paiement sécurisé <strong className="text-white">Wave</strong>, <strong className="text-white">Orange Money</strong> & <strong className="text-white">Free Money</strong> sous protection séquestre (Escrow).
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/catalog"
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explorer le catalogue</span>
                </Link>

                <Link
                  to={isAuthenticated ? "/sell" : "#"}
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      openAuthModal('login');
                    }
                  }}
                  className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm backdrop-blur-sm transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-pink-400" />
                  <span>Vendre un article</span>
                </Link>
              </div>

              {/* Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-purple-800/60 text-xs text-purple-200">
                <div>
                  <strong className="block text-white text-base sm:text-lg font-black">100%</strong>
                  <span>Paiements locaux sécurisés</span>
                </div>
                <div>
                  <strong className="block text-white text-base sm:text-lg font-black">1%</strong>
                  <span>Frais de validation Escrow</span>
                </div>
                <div>
                  <strong className="block text-white text-base sm:text-lg font-black">Dakar & Régions</strong>
                  <span>Livraison à domicile & main propre</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="bg-white rounded-3xl p-6 shadow-2xl text-gray-900 border border-purple-100">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="ReVibe FliP" className="h-9 w-auto" />
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Garanti Escrow
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl overflow-hidden aspect-video bg-gray-100 relative">
                    <img
                      src="https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=600&q=80"
                      alt="Boubou brodé"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-purple-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                      Mode Traditionnelle & Wax
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-gray-900 text-sm">Grand Boubou Brodé Bazin</h4>
                      <span className="text-purple-700 font-extrabold text-base">35 000 FCFA</span>
                    </div>
                    <p className="text-xs text-gray-500">Vendeur vérifié à Dakar Plateau • Note 4.9 ★</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span>Livraison moto 2h à 24h</span>
                    </div>
                    <span className="text-emerald-700 font-bold">Disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Explorer par catégories
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Trouvez exactement ce que vous recherchez</p>
          </div>
          <Link
            to="/catalog"
            className="text-purple-700 font-bold text-xs hover:text-purple-900 flex items-center gap-1"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?categoryId=${cat.id}`}
              className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-center flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ESCROW & LOCAL TRUST BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <EscrowShield />
      </section>

      {/* LATEST LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Dernières annonces publiées
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Articles authentiques de seconde main au Sénégal</p>
          </div>
          <Link
            to="/catalog"
            className="text-purple-700 font-bold text-xs hover:text-purple-900 flex items-center gap-1"
          >
            Explorer tout le catalogue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-72 border border-gray-100 p-4" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">Aucune annonce disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Simple & Efficace</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Comment fonctionne ReVibe FliP ?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Le parcours complet de l'achat et de la vente, pensé pour le continent africain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 relative">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center mb-4">
                1
              </span>
              <h4 className="font-bold text-sm text-gray-900">Publiez ou Trouvez</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Prenez des photos de vos vêtements ou parcourez les articles mis en vente par des vendeurs près de chez vous.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 relative">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center mb-4">
                2
              </span>
              <h4 className="font-bold text-sm text-gray-900">Discutez & Négociez</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Échangez en temps réel avec le vendeur dans la messagerie intégrée pour poser vos questions ou convenir du prix.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 relative">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center mb-4">
                3
              </span>
              <h4 className="font-bold text-sm text-gray-900">Paiement Mobile Escrow</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Payez avec Wave, Orange Money ou Free Money. Vos fonds sont sécurisés en séquestre jusqu'à la livraison.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 relative">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center mb-4">
                4
              </span>
              <h4 className="font-bold text-sm text-gray-900">Réception & Évaluation</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Confirmez la bonne réception pour libérer les fonds au vendeur et donnez votre avis (1 à 5 étoiles).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
