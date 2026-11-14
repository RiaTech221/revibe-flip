package com.revibeflip.entity.enums;

/**
 * Statut du versement des fonds nets au vendeur.
 */
public enum PayoutStatus {
    NONE,
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    MANUAL_REQUIRED
}
