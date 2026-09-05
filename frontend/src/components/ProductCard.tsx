import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { MapPin, Star, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'NEW_WITH_TAG':
        return 'bg-emerald-500 text-white';
      case 'VERY_GOOD':
        return 'bg-purple-600 text-white';
      case 'GOOD':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const imageSrc = product.primaryImage || (product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80');

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Seller Header */}
      <div className="p-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <img
            src={product.seller?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller?.fullName || 'Vendeur')}&background=9333ea&color=fff`}
            alt={product.seller?.fullName}
            className="w-7 h-7 rounded-full object-cover border border-purple-100"
          />
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">
            {product.seller?.fullName}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{product.seller?.rating ? product.seller.rating.toFixed(1) : '5.0'}</span>
        </div>
      </div>

      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Condition Tag */}
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md ${getConditionColor(product.condition)}`}>
          {product.conditionLabel}
        </span>

        {/* Sold Badge */}
        {product.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-black text-sm uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg transform -rotate-6">
              Vendu
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">
              {formatPrice(product.price)}
            </h3>
            {product.size && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {product.size}
              </span>
            )}
          </div>

          <Link to={`/product/${product.id}`} className="block mt-1">
            <p className="text-sm font-medium text-gray-700 line-clamp-1 group-hover:text-gray-900">
              {product.title}
            </p>
          </Link>

          {product.brand && (
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              {product.brand}
            </p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{product.locationCity || 'Dakar'}</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Escrow
          </span>
        </div>
      </div>
    </div>
  );
};
