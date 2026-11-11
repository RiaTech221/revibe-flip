package com.revibeflip.entity.enums;

/**
 * Énumération des statuts d'une transaction de paiement (en attente, succès, échec, remboursé).
 */
public enum PaymentStatus {
    INITIATED,
    SUCCESS,
    FAILED,
    REFUNDED
}
