import React, { createContext, useContext, useMemo, useState } from 'react';
import { Product } from '../types';

interface FavoritesContextValue {
  favorites: Product[];
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);

  const value = useMemo<FavoritesContextValue>(() => {
    const favoriteIds = new Set(favorites.map((product) => product.id));

    return {
      favorites,
      isFavorite: (productId) => favoriteIds.has(productId),
      toggleFavorite: (product) => {
        setFavorites((current) =>
          current.some((item) => item.id === product.id)
            ? current.filter((item) => item.id !== product.id)
            : [product, ...current],
        );
      },
      removeFavorite: (productId) => {
        setFavorites((current) => current.filter((product) => product.id !== productId));
      },
    };
  }, [favorites]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites doit être utilisé dans FavoritesProvider.');
  return context;
};
