/**
 * Composant Carte Réutilisable : ProductCard
 * 
 * Élément graphique d'affichage de données sous forme de carte interactive (ProductCard).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Heart, ShoppingCart, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

/**
 * Carte produit seconde main ultra-épurée (Ratio 3:4, prix en FCFA, actions directes panier et like).
 */
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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
        />

        {/* Badge Vendeur Express ou Ville (Dakar, etc.) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.locationCity && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
              {product.locationCity}
            </span>
          )}
          {conditionShort && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/75 backdrop-blur-xs text-white">
              {conditionShort}
            </span>
          )}
        </div>

        {/* Bouton Like Flottant Minimaliste */}
        <button
          onClick={handleToggleLike}
          aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isLiked
              ? 'bg-rose-50 text-rose-500 scale-105'
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Bouton Action Rapide Panier (apparaît au hover sur desktop) */}
        <div className="absolute bottom-2.5 right-2.5">
          <button
            onClick={handleAdd}
            aria-label="Ajouter au panier"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
              justAdded
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-purple-700 hover:bg-purple-800 text-white hover:scale-105'
            }`}
          >
            {justAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </Link>

      {/* 2. DÉTAILS DE L'ARTICLE (ÉPURÉS, AUCUN BRUIT) */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
        <Link to={`/product/${product.id}`} className="block group-hover:text-purple-700 transition-colors">
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-0.5">
            <span className="font-semibold truncate uppercase tracking-wider text-slate-500">
              {product.brand || 'Sans marque'}
            </span>
            {product.size && (
              <span className="font-bold text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.2 rounded">
                {product.size}
              </span>
            )}
          </div>
          <h3 className="font-medium text-xs sm:text-sm text-slate-900 truncate">
            {product.title}
          </h3>
        </Link>

        {/* Prix FCFA net & Économie */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm sm:text-base text-purple-700">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-400 truncate max-w-[80px]">
            {product.seller?.fullName || 'Vendeur'}
          </div>
        </div>
      </div>
    </div>
  );
};
