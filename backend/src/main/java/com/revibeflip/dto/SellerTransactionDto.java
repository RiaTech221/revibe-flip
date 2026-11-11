package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO pour les transactions financières perçues par le vendeur.
 *
 * NOTE SUR LE SÉQUESTRE (Point 6) :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire
 * (Wave, Orange Money, Free Money) et la validation du cadre juridique avant la production.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerTransactionDto {
    private Long id;
    private String transactionReference;
    private String orderNumber;
    private Long orderId;
    private String productTitle;
    private String productImage;

    // Décomposition financière transparente
    private BigDecimal itemPrice; // Prix de l'article fixé par le vendeur
    private BigDecimal validationFee; // Frais de validation (1 %, payés par l'acheteur)
    private BigDecimal deliveryFee; // Frais de livraison (payés par l'acheteur)
    private BigDecimal platformCommission; // Commission plateforme (20 %)
    private BigDecimal sellerPayout; // Net revenant au vendeur (80 %)

    // Moyen et statuts
    private String paymentMethod;
    private String paymentMethodName;
    private String paymentStatus;
    private String escrowStatus; // LOCKED ou RELEASED
    private LocalDateTime createdAt;
    private LocalDateTime releasedAt;
}
