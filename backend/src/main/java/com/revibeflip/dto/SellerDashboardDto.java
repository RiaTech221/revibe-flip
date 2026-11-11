package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardDto {
    private String sellerName;
    private String sellerPhone;
    private String sellerCity;
    private boolean isSuspended;

    // Annonces
    private long totalProducts;
    private long activeProducts;
    private long soldProducts;
    private long inactiveProducts;
    private long draftProducts;

    // Commandes
    private long ordersToProcess; // En attente / payées nécessitant préparation
    private long ordersInDelivery; // En cours de livraison (PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY)
    private long completedOrders;

    // Finances (Taux lus dynamiquement depuis PlatformSetting)
    private BigDecimal turnover; // Chiffre d'affaires total brut
    private BigDecimal platformCommission; // Part prélevée par ReVibe FliP (ex: 20%)
    private BigDecimal netEarnings; // Gain net vendeur (ex: 80%)
    private BigDecimal pendingEscrow; // Fonds actuellement sous séquestre
    private BigDecimal commissionRate; // Taux de commission appliqué (ex: 20.0)
    private BigDecimal validationFeeRate; // Taux de validation appliqué (ex: 1.0)

    // Avis & Confiance
    private Double averageRating;
    private long reviewCount;

    // Messagerie
    private long unreadMessagesCount;

    // Dernières commandes récentes
    private List<OrderDto> recentOrders;
}
