package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * DTO complet pour le Tableau de bord Vendeur de ReVibe FliP.
 * Agrégé selon le fuseau horaire Africa/Dakar (UTC+0).
 * Données strictement isolées au vendeur connecté.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardDto {

    // --- Identité et profil du vendeur connecté ---
    private Long sellerId;
    private String sellerName;
    private String sellerFirstName;
    private String sellerPhone;
    private String sellerCity;
    private boolean isSuspended;
    private LocalDateTime memberSince;
    private String sellerSinceLabel; // ex: "Vendeur depuis nov. 2026"

    // --- Métadonnées de la période et gouvernance ---
    private String period; // 7d, 30d, 90d, month, custom
    private String startDate;
    private String endDate;
    private String lastUpdated;
    private String currency; // FCFA
    private BigDecimal commissionRate; // ex: 20.0 %
    private BigDecimal validationFeeRate; // ex: 1.0 %

    // --- 1. Bandeau « À faire » ---
    private SellerActionItemsDto actionItems;

    // --- 2. Cartes principales avec variations vs période précédente ---
    private MetricWithChangeDto listings; // Annonces (avec détail: active, sold, inactive, draft, disabledByAdmin)
    private MetricWithChangeDto orders; // Commandes (avec détail par statut)
    private MetricWithChangeDto turnover; // Chiffre d'affaires
    private MetricWithChangeDto pendingEscrow; // Gains en attente (net vendeur LOCKED)
    private MetricWithChangeDto releasedEarnings; // Gains libérés (net vendeur RELEASED)
    private MetricWithChangeDto platformCommission; // Commission plateforme prélevée
    private MetricWithChangeDto offerAcceptanceRate; // Taux d'acceptation des offres
    private MetricWithChangeDto averageBasket; // Panier moyen
    private SellerRatingDto rating; // Note moyenne, nombre d'avis, répartition 1-5 étoiles
    private long unreadConversationsCount; // Conversations avec messages non lus

    // --- 3. Graphiques & Répartitions ---
    @Builder.Default
    private List<SalesTrendDto> salesTrends = new ArrayList<>(); // Ventes par jour (montant et nb commandes)

    @Builder.Default
    private List<OrderFunnelStepDto> orderFunnel = new ArrayList<>(); // Entonnoir par statut

    @Builder.Default
    private List<SellerTopProductDto> topProducts = new ArrayList<>(); // Meilleures annonces par ventes

    @Builder.Default
    private List<SellerStagnantProductDto> stagnantProducts = new ArrayList<>(); // Annonces les moins consultées / sans vente

    private Map<Integer, Long> ratingDistribution; // 1 to 5 stars
    private Map<String, Long> ordersByStatus; // Détail par statut exact

    // --- 4. Listes courtes (5 éléments max) ---
    @Builder.Default
    private List<OrderDto> ordersToPrepare = new ArrayList<>(); // 5 dernières commandes payées à préparer

    @Builder.Default
    private List<ChatOfferDto> activeOffers = new ArrayList<>(); // 5 dernières offres en cours

    @Builder.Default
    private List<ReviewDto> recentReviews = new ArrayList<>(); // 5 derniers avis reçus

    @Builder.Default
    private List<NotificationDto> recentNotifications = new ArrayList<>(); // 5 dernières notifications

    // --- 5. Conseils contextuels (règles simples, sans IA) ---
    @Builder.Default
    private List<SellerTipDto> contextualTips = new ArrayList<>();

    // --- Rétrocompatibilité legacy ---
    private long totalProducts;
    private long activeProducts;
    private long soldProducts;
    private long inactiveProducts;
    private long draftProducts;
    private long ordersToProcess;
    private long ordersInDelivery;
    private long completedOrders;
    private BigDecimal netEarnings;
    private Double averageRating;
    private long reviewCount;
    private long unreadMessagesCount;
    private List<OrderDto> recentOrders;

    // ==========================================
    // SOUS-CLASSES MODULAIRES
    // ==========================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerActionItemsDto {
        private long ordersToPrepare; // Commandes payées à préparer
        private long pendingOffers; // Offres en attente de réponse acheteur
        private long unreadConversations; // Conversations avec messages non lus
        private long disputedOrders; // Commandes en litige
        private long disabledListings; // Annonces désactivées par l'admin
        private long totalToHandle;
        private boolean hasItemsToHandle;
        @Builder.Default
        private List<DisabledListingSummaryDto> disabledListingsDetails = new ArrayList<>();
        @Builder.Default
        private List<PendingOfferSummaryDto> pendingOffersDetails = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisabledListingSummaryDto {
        private Long id;
        private String title;
        private String deactivationReason;
        private BigDecimal price;
        private String primaryImage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingOfferSummaryDto {
        private Long id;
        private Long productId;
        private String productTitle;
        private String buyerName;
        private BigDecimal agreedPrice;
        private LocalDateTime expiresAt;
        private String remainingTimeLabel; // ex: "Expire dans 2 h"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricWithChangeDto {
        private BigDecimal value;
        private BigDecimal previousValue;
        private Double changePercentage;
        @Builder.Default
        private List<BigDecimal> sparkline = new ArrayList<>();
        // Détails additionnels
        private Long count;
        private Long activeCount;
        private Long soldCount;
        private Long inactiveCount;
        private Long draftCount;
        private Long disabledCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerRatingDto {
        private Double averageRating; // null si aucun avis
        private long totalReviews;
        private boolean hasReviews;
        private String displayRating; // "Pas encore d'avis" ou "4.8"
        private Map<Integer, Long> distribution; // 1: x, 2: y, ... 5: z
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerTopProductDto {
        private Long id;
        private String title;
        private String primaryImage;
        private BigDecimal price;
        private long salesCount;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerStagnantProductDto {
        private Long id;
        private String title;
        private String primaryImage;
        private BigDecimal price;
        private int viewCount;
        private LocalDateTime createdAt;
        private long daysSinceCreation;
        private String suggestion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerTipDto {
        private String id;
        private String type; // "WARNING", "SUGGESTION", "INFO"
        private String title;
        private String message;
        private String actionTab; // "listings", "orders", "offers"
        private String actionFilter;
    }
}
