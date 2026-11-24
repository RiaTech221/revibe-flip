package com.revibeflip.entity.enums;

/**
 * Permissions modulaires du Back-Office pour les collaborateurs (US-36).
 *
 * <p>Chaque permission correspond à un module fonctionnel du Back-Office :
 * <ul>
 *   <li>{@link #DASHBOARD} : Tableau de bord et statistiques globales (US-27)</li>
 *   <li>{@link #USERS} : Consultation, suspension et modération des utilisateurs (US-28)</li>
 *   <li>{@link #PRODUCTS} : Modération et statut des annonces (US-29)</li>
 *   <li>{@link #CATEGORIES} : Création et modification des rayons / catégories (US-30)</li>
 *   <li>{@link #ORDERS_PAYMENTS} : Gestion des commandes, livraisons et transactions financières (US-31)</li>
 *   <li>{@link #REPORTS} : Traitement des signalements et litiges (US-32)</li>
 * </ul>
 */
public enum AdminPermission {
    DASHBOARD,
    USERS,
    PRODUCTS,
    CATEGORIES,
    ORDERS_PAYMENTS,
    REPORTS
}
