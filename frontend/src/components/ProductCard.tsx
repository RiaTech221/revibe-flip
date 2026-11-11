import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const imageSrc =
    product.primaryImage ||
    (product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80');

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  // Tag d'état épuré pour la seconde main
  const conditionShort = product.conditionLabel
    ? product.conditionLabel.replace('avec étiquette', '')
    : null;

  return (
    <div className="group flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
      {/* 1. PHOTO DE L'ARTICLE DE SECONDE MAIN (ÉPURÉE, RATIO 3:4) */}
      <Link
        to={`/product/${product.id}`}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-slate-50"
      >
        <img
          src={imageSrc}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
        />

        {/* État de l'article (unique badge essentiel en seconde main) */}
        {conditionShort && (
          <span className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs">
            {conditionShort}
          </span>
        )}

        {/* Bouton Favori discret */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-xs flex items-center justify-center transition-all shadow-xs ${
            isLiked
              ? 'bg-white text-red-500 scale-105'
              : 'bg-white/85 hover:bg-white text-slate-500 hover:text-red-500 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
        </button>

        {/* Badge Vendu si indisponible */}
        {product.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-purple-700 text-white font-black text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg transform -rotate-6">
              Vendu
            </span>
          </div>
        )}
      </Link>

      {/* 2. DÉTAILS ÉPURÉS SECONDE MAIN (AÉRÉS & SANS SURCHARGE) */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2">
        <Link to={`/product/${product.id}`} className="block">
          {/* Titre aéré sur 2 lignes sans coupure */}
          <h3 className="text-[13px] sm:text-sm font-semibold text-slate-800 line-clamp-2 min-h-[36px] sm:min-h-[40px] leading-snug group-hover:text-purple-700 transition-colors">
            {product.title}
          </h3>

          {/* Micro-détail seconde main : Taille ou Marque ou Ville */}
          <p className="text-xs text-slate-500 truncate mt-1">
            {product.size ? `Taille ${product.size}` : (product.brand || product.locationCity || 'Dakar')}
            {product.brand && product.size && <span className="text-slate-300"> • </span>}
            {product.brand && product.size && <span>{product.brand}</span>}
          </p>
        </Link>

        {/* 3. PRIX NET SECONDE MAIN + BOUTON PANIER */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
            {formatPrice(product.price)}
          </span>

          <button
            type="button"
            onClick={handleAdd}
            className={`h-7 px-2.5 rounded-full border transition-all active:scale-95 flex items-center gap-1 shadow-2xs ${
              justAdded
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-200 hover:border-purple-600 hover:bg-purple-600 hover:text-white text-slate-600 bg-white'
            }`}
            title="Ajouter au panier"
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
