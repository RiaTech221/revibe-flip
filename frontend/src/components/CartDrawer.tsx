/**
 * Tiroir Latéral du Panier d'Achat ReVibe FliP
 * 
 * Affiche le contenu du panier dans un volet latéral coulissant :
 *  * - Liste des articles avec miniature, prix et quantité modifiable
 *  * - Calcul en direct du total et des frais de séquestre
 *  * - Bouton de passage direct vers la validation de commande (Checkout)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cartApi, chatApi } from '../services/api';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  Store,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    sellerName,
    isOpen,
    closeCart,
    openCart,
    removeFromCart,
    clearCart,
    totalCount,
    subtotal,
    hasUnavailableItems,
    conflictModal,
    confirmReplaceSeller,
    cancelReplaceSeller,
    cartToast,
    hideToast,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartDiscussion = async () => {
    if (!isAuthenticated) {
      closeCart();
      navigate('/login?redirect=/');
      return;
    }

    if (hasUnavailableItems) {
      setError("Veuillez retirer les articles indisponibles avant de continuer.");
      return;
    }

    if (items.length === 0) return;

    setError(null);
    setLoading(true);

    try {
      const firstItem = items[0]?.product;
      const res = await chatApi.startConversation({
        productId: firstItem?.id,
        initialMessage: `Bonjour ! J'ai sélectionné "${firstItem?.title || 'cet article'}" (${Number(firstItem?.price || 0).toLocaleString('fr-FR')} FCFA) dans votre dressing. Pouvons-nous échanger pour finaliser l'achat et la livraison ?`,
      });
      closeCart();
      const conv = res.data?.data;
      if (conv?.id) {
        navigate(`/messages?conversationId=${conv.id}`);
      } else {
        navigate(`/messages?productId=${firstItem?.id || 18}`);
      }
    } catch (err: any) {
      // Redirection fluide vers les messages avec le contexte du produit
      const firstItem = items[0]?.product;
      closeCart();
      navigate(`/messages?productId=${firstItem?.id || 18}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. TOAST DISCRET APRÈS AJOUT AU PANIER */}
      {cartToast?.visible && !isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounceIn max-w-sm w-full bg-white rounded-2xl shadow-xl border border-purple-150 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">
                {cartToast.productTitle}
              </p>
              <p className="text-[11px] text-purple-700 font-semibold">
                Ajouté à votre sélection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                hideToast();
                openCart();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              Voir mon panier
            </button>
            <button
              onClick={hideToast}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MODAL DE CONFLIT MONO-VENDEUR */}
      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-150 space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-gray-900">
                Commande auprès d'un seul vendeur
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Votre panier contient déjà des articles de <strong className="text-gray-900">{conflictModal.existingSellerName}</strong>.
                Sur ReVibe FliP, la discussion, la livraison et le paiement sous séquestre se font par vendeur : vous ne pouvez commander qu'auprès d'un vendeur à la fois.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={confirmReplaceSeller}
                className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-transform active:scale-98"
              >
                Vider mon panier et ajouter cet article
              </button>
              <button
                onClick={cancelReplaceSeller}
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                Garder mon panier actuel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TIROIR DU PANIER (SÉLECTION SANS PAIEMENT) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={closeCart}
            className="absolute inset-0 bg-black/50 backdrop-blur-2xs transition-opacity animate-fadeIn"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900">Mon Panier</h3>
                    <p className="text-[11px] text-gray-500">
                      {totalCount} {totalCount > 1 ? 'articles' : 'article'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-bold text-gray-400 hover:text-purple-700 px-2 py-1 transition-colors"
                      title="Vider le panier"
                    >
                      Vider
                    </button>
                  )}
                  <button
                    onClick={closeCart}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Votre panier est vide</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Explorez le catalogue pour dénicher des pépites.
                    </p>
                    <button
                      onClick={() => {
                        closeCart();
                        navigate('/catalog');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-xs"
                    >
                      <span>Explorer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Bannière de sélection */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-purple-50 text-xs text-purple-900">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate font-semibold">
                          Articles sélectionnés ({items.length})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 shrink-0">🛡️ Escrow Sécurisé</span>
                    </div>

                    {/* Avertissement article indisponible */}
                    {hasUnavailableItems && (
                      <div className="flex flex-col gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-rose-700 leading-tight">
                            Certains articles ne sont plus disponibles (déjà vendus ou réservés). Retirez-les pour continuer.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const unavailable = items.filter(
                              (i) => i.product.status && i.product.status !== 'ACTIVE'
                            );
                            for (const it of unavailable) {
                              await removeFromCart(it.product.id);
                            }
                          }}
                          className="self-start text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                        >
                          Retirer tous les articles indisponibles
                        </button>
                      </div>
                    )}

                    {error && !error.toLowerCase().includes('vide') && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        {error}
                      </div>
                    )}

                    {/* Liste des articles épurée */}
                    <div className="divide-y divide-gray-100 space-y-3">
                      {items.map(({ product }) => {
                        const isUnavailable = product.status && product.status !== 'ACTIVE';
                        const image =
                          product.primaryImage ||
                          (product.images && product.images[0]) ||
                          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80';

                        return (
                          <div
                            key={product.id}
                            className={`pt-3 first:pt-0 flex items-center gap-3.5 ${isUnavailable ? 'opacity-50' : ''}`}
                          >
                            <img
                              src={image}
                              alt={product.title || 'Article'}
                              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-150 shadow-2xs"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-gray-900 truncate">
                                {product.title || 'Article ReVibe'}
                              </h5>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {product.conditionLabel || 'Très bon état'}{product.seller?.fullName ? ` • Vendeur : ${product.seller.fullName}` : ''}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-purple-700">
                                  {Number(product.price).toLocaleString('fr-FR')} FCFA
                                </span>
                                {isUnavailable && (
                                  <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">
                                    INDISPONIBLE
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  closeCart();
                                  navigate(`/checkout/${product.id}`);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Commander cet article"
                              >
                                Payer
                              </button>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Retirer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Footer épuré avec sous-total et validation directe ou discussion */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-gray-150 bg-white space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Sous-total :</span>
                    <span className="text-base font-black text-gray-900">
                      {subtotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  {/* Bouton Principal : Valider la commande & Payer */}
                  <button
                    onClick={() => {
                      closeCart();
                      if (items.length > 0) {
                        navigate(`/checkout/${items[0].product.id}`);
                      }
                    }}
                    disabled={loading || hasUnavailableItems}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-700/20 active:scale-98 ${
                      loading || hasUnavailableItems
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Valider la commande & Payer ({subtotal.toLocaleString('fr-FR')} FCFA)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Bouton Secondaire : Discuter d'abord avec le vendeur */}
                  <button
                    onClick={handleStartDiscussion}
                    disabled={loading || hasUnavailableItems}
                    className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-gray-600 hover:text-purple-700 hover:bg-purple-50 border border-gray-200 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-purple-700" />
                    <span>Discuter d'abord avec le vendeur</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
