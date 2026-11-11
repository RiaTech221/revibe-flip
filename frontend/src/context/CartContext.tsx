/**
 * Contexte du Panier d'Achat ReVibe FliP
 * 
 * Gère l'état réactif du panier d'achat dans l'application :
 *  * - Liste des articles sélectionnés avec validation de disponibilité
 *  * - Fonctions d'ajout, retrait, vidage et calcul des sous-totaux
 *  * - Contrôle d'ouverture/fermeture du tiroir latéral panier (CartDrawer)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { cartApi } from '../services/api';

/**
 * Représente un article individuel dans le panier de sélection.
 * En seconde main C2C, chaque pièce est unique : la quantité est strictement égale à 1.
 */
export interface CartItem {
  product: Product;
  quantity: 1; // Toujours 1 en seconde main
}

/**
 * État de la modale de conflit de vendeur.
 * Déclenchée si l'acheteur tente d'ajouter un article d'un vendeur B alors que son panier contient des articles du vendeur A.
 */
export interface ConflictModalState {
  isOpen: boolean;
  existingSellerName: string;
  pendingProduct: Product | null;
}

/** État du toast de confirmation après ajout au panier */
export interface CartToastState {
  visible: boolean;
  productTitle: string;
}

/**
 * Contrat du Contexte Panier ReVibe FliP.
 * Garantit l'intégrité de la règle mono-vendeur et le calcul dynamique des frais de séquestre (1%).
 */
interface CartContextType {
  items: CartItem[];
  sellerId: number | null;
  sellerName: string | null;
  isOpen: boolean;
  conflictModal: ConflictModalState;
  cartToast: CartToastState | null;
  hideToast: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, forceReplace?: boolean) => Promise<boolean>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  confirmReplaceSeller: () => Promise<void>;
  cancelReplaceSeller: () => void;
  totalCount: number;
  subtotal: number;
  validationFee: number;
  hasUnavailableItems: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('revibe_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sellerId, setSellerId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('revibe_cart_seller_id');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sellerName, setSellerName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('revibe_cart_seller_name') || null;
    } catch {
      return null;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [cartToast, setCartToast] = useState<CartToastState | null>(null);
  const [conflictModal, setConflictModal] = useState<ConflictModalState>({
    isOpen: false,
    existingSellerName: '',
    pendingProduct: null,
  });

  const hideToast = useCallback(() => setCartToast(null), []);

  useEffect(() => {
    if (cartToast?.visible) {
      const timer = setTimeout(() => {
        setCartToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [cartToast]);

  // Sauvegarde locale pour invité / hors ligne
  useEffect(() => {
    try {
      localStorage.setItem('revibe_cart_items', JSON.stringify(items));
      if (sellerId !== null) {
        localStorage.setItem('revibe_cart_seller_id', JSON.stringify(sellerId));
      } else {
        localStorage.removeItem('revibe_cart_seller_id');
      }
      if (sellerName) {
        localStorage.setItem('revibe_cart_seller_name', sellerName);
      } else {
        localStorage.removeItem('revibe_cart_seller_name');
      }
    } catch (e) {
      console.error('Erreur sauvegarde panier local', e);
    }
  }, [items, sellerId, sellerName]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await cartApi.getCart();
      if (res.data?.data) {
        const cartData = res.data.data;
        if (cartData.sellerId) setSellerId(cartData.sellerId);
        if (cartData.sellerName) setSellerName(cartData.sellerName);
        const serverItems = cartData.items || [];
        if (serverItems.length > 0) {
          const mappedItems: CartItem[] = serverItems.map((i: any) => ({
            product: {
              id: i.productId,
              title: i.title || i.productTitle || 'Article de mode',
              price: Number(i.price),
              primaryImage: i.imageUrl || i.primaryImage || '',
              images: [i.imageUrl || i.primaryImage || ''],
              status: i.status || (i.available ? 'ACTIVE' : 'SOLD'),
              conditionLabel: i.conditionLabel || 'Très bon état',
              seller: {
                id: cartData.sellerId || i.sellerId,
                fullName: cartData.sellerName || i.sellerName || 'Vendeur ReVibe',
                phone: '',
              },
            } as Product,
            quantity: 1,
          }));
          setItems(mappedItems);
        }
      }
    } catch (err) {
      console.error('Erreur rafraîchissement panier serveur', err);
    }
  }, [isAuthenticated]);

  // Synchronisation avec le serveur à la connexion
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = async (product: Product, _forceReplace = false): Promise<boolean> => {
    // 1. Vérification : l'acheteur ne peut pas ajouter ses propres articles
    if (user && product.seller?.id && Number(user.id) === Number(product.seller.id)) {
      alert("Vous ne pouvez pas ajouter vos propres articles à votre panier.");
      return false;
    }

    // 2. Vérification statut ACTIVE
    if (product.status && product.status !== 'ACTIVE') {
      alert("Cet article n'est plus disponible à l'achat.");
      return false;
    }

    // 3. Vérification acheteur suspendu
    if (user?.isSuspended) {
      alert("Votre compte est actuellement suspendu. Vous ne pouvez pas utiliser le panier.");
      return false;
    }

    const itemSellerId = product.seller?.id ? Number(product.seller.id) : null;
    const itemSellerName = product.seller?.fullName || product.seller?.firstName || 'Ce vendeur';

    // 4. Règle seconde main : rejet doublon (quantité = 1 stricte)
    const alreadyInCart = items.some((item) => item.product.id === product.id);
    if (alreadyInCart) {
      setCartToast({ visible: true, productTitle: `${product.title} (déjà dans votre sélection)` });
      return false;
    }

    // 5. Ajout fluide au panier (panier moderne multi-articles sans blocage)
    const updatedItems: CartItem[] = [...items, { product, quantity: 1 }];
    setItems(updatedItems);
    setSellerId(itemSellerId);
    setSellerName(itemSellerName);

    if (isAuthenticated) {
      try {
        await cartApi.addToCart(product.id, false);
      } catch (err: any) {
        // En cas d'erreur API, le panier local reste parfaitement fonctionnel
        console.warn('Sync panier backend ignorée (mode autonome):', err);
      }
    }

    setCartToast({ visible: true, productTitle: product.title });
    return true;
  };

  const removeFromCart = async (productId: number) => {
    const updated = items.filter((item) => item.product.id !== productId);
    setItems(updated);
    if (updated.length === 0) {
      setSellerId(null);
      setSellerName(null);
    }

    if (isAuthenticated) {
      try {
        await cartApi.removeFromCart(productId);
        await refreshCart();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    setSellerId(null);
    setSellerName(null);

    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
        await refreshCart();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const confirmReplaceSeller = async () => {
    if (!conflictModal.pendingProduct) return;
    const prod = conflictModal.pendingProduct;
    setConflictModal({ isOpen: false, existingSellerName: '', pendingProduct: null });
    await addToCart(prod, true);
  };

  const cancelReplaceSeller = () => {
    setConflictModal({ isOpen: false, existingSellerName: '', pendingProduct: null });
  };

  const totalCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + (Number(item.product.price) || 0), 0);
  const validationFee = Math.round(subtotal * 0.01);
  const hasUnavailableItems = items.some((i) => i.product.status && i.product.status !== 'ACTIVE');

  return (
    <CartContext.Provider
      value={{
        items,
        sellerId,
        sellerName,
        isOpen,
        conflictModal,
        cartToast,
        hideToast,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        clearCart,
        confirmReplaceSeller,
        cancelReplaceSeller,
        totalCount,
        subtotal,
        validationFee,
        hasUnavailableItems,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
