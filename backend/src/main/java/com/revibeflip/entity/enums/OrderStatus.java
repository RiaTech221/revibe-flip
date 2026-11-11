package com.revibeflip.entity.enums;

/**
 * Énumération des 8 statuts composant le cycle de vie complet d'une commande ReVibe FliP.
 */
public enum OrderStatus {
    PENDING_PAYMENT,
    AWAITING_PAYMENT,
    PAID_ESCROW_LOCKED,
    SHIPPED,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    EXPIRED,
    DISPUTED
}
