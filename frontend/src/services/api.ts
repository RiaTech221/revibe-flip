/**
 * Façade centrale des services API ReVibe FliP.
 * Orchestre et ré-exporte les sous-services modulaires spécialisés :
 * - httpClient : Instance Axios et intercepteurs JWT
 * - authService : Authentification, OTP et profil
 * - productService : Produits, catégories et pays
 * - orderService : Commandes et livraison
 * - paymentService : Paiements Mobile Money sous séquestre
 * - chatService : Messagerie instantanée et offres de prix
 * - sellerService : Tableau de bord et transactions vendeur
 * - adminService : Administration, audit et CMS
 * - cartService : Gestion du panier d'achat
 * - contentService : Contenus statiques, avis, signalements et uploads
 */

import api from './httpClient';

export * from './httpClient';
export * from './authService';
export * from './productService';
export * from './orderService';
export * from './paymentService';
export * from './chatService';
export * from './sellerService';
export * from './adminService';
export * from './cartService';
export * from './contentService';

export default api;
