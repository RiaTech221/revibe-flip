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
 * DTO complet pour le Tableau de bord Administrateur de ReVibe FliP.
 * Agrégé selon le fuseau horaire Africa/Dakar (UTC+0).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {

    // --- Métadonnées de la période et gouvernance ---
    private String period; // 7d, 30d, 90d, month, custom
    private String startDate;
    private String endDate;
    private String lastUpdated;
    private String currency; // FCFA
    private BigDecimal commissionRate; // ex: 20.0 %
    private BigDecimal validationFeeRate; // ex: 1.0 %

    // --- 1. Bandeau « À traiter » ---
    private ActionItemsDto actionItems;

    // --- 2. Cartes principales avec variation vs période précédente & sparklines ---
    private MetricWithChangeDto revenue; // Chiffre d'affaires
    private MetricWithChangeDto earnedCommissions; // Commissions réalisées (RELEASED)
    private MetricWithChangeDto escrowLockedFunds; // Fonds sous séquestre (LOCKED)
    private MetricWithChangeDto pendingCommissions; // Commissions en attente (sur LOCKED)
    private MetricWithChangeDto validationFees; // Frais de validation perçus
    private MetricWithChangeDto orders; // Commandes
    private MetricWithChangeDto transactions; // Transactions réussies
    private MetricWithChangeDto averageBasket; // Panier moyen
    private UserMetricsDto users; // Utilisateurs (actifs / suspendus / nouveaux)
    private ProductMetricsDto products; // Annonces (actives / vendues / inactives / draft)
    private ReportMetricsDto reports; // Signalements (en attente / en cours / résolus)

    // --- 3. Graphiques & Répartitions ---
    @Builder.Default
    private List<SalesTrendDto> salesTrends = new ArrayList<>(); // Tendance des ventes par jour

    @Builder.Default
    private List<UserTrendDto> userRegistrationTrends = new ArrayList<>(); // Inscriptions par jour

    @Builder.Default
    private List<CategoryStatDto> topCategories = new ArrayList<>(); // Top 5 rayons les plus demandés

    @Builder.Default
    private List<CategoryStatDto> topCategoriesBySales = new ArrayList<>(); // Top 5 rayons par ventes réelles (FCFA)

    @Builder.Default
    private List<CategoryStatDto> topCategoriesByProducts = new ArrayList<>(); // Top 5 rayons par volume d'annonces

    @Builder.Default
    private List<PaymentDistributionDto> paymentDistributions = new ArrayList<>(); // Wave, OM, Free Money

    @Builder.Default
    private List<OrderFunnelStepDto> orderFunnel = new ArrayList<>(); // Entonnoir par statut

    private Map<String, Long> ordersByStatus; // Détail par statut exact

    // --- 4. Listes courtes (5 derniers éléments) ---
    @Builder.Default
    private List<RecentOrderSummaryDto> recentOrders = new ArrayList<>();

    @Builder.Default
    private List<RecentReportSummaryDto> recentReports = new ArrayList<>();

    @Builder.Default
    private List<RecentAuditLogSummaryDto> recentAuditLogs = new ArrayList<>();

    // --- Rétrocompatibilité plateaux / widgets legacy ---
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long totalProducts;
    private long activeProducts;
    private long soldProducts;
    private long inactiveProducts;
    private long totalOrders;
    private long totalTransactions;
    private BigDecimal totalTransactionsAmount;
    private BigDecimal totalCommissions;
    private BigDecimal totalValidationFees;
    private long pendingReports;

    // ==========================================
    // SOUS-CLASSES MODULAIRES
    // ==========================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionItemsDto {
        private long pendingReportsAndDisputes; // Signalements PENDING + Commandes DISPUTED
        private long pendingModerationProducts; // Annonces en attente de modération (DRAFT)
        private long disputedOrders; // Commandes bloquées en litige
        private long deliveredAwaitingConfirmationOrders; // Commandes livrées en attente confirmation acheteur
        private long unreadContactMessages; // Messages de contact non traités
        private long totalToHandle;
        private boolean hasItemsToHandle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricWithChangeDto {
        private BigDecimal value;
        private BigDecimal previousValue;
        private Double changePercentage; // Variation en % (positif ou négatif)
        @Builder.Default
        private List<BigDecimal> sparkline = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserMetricsDto {
        private long total;
        private long active;
        private long suspended;
        private long newInPeriod;
        private long previousNewInPeriod;
        private Double changePercentage;
        @Builder.Default
        private List<Long> sparkline = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductMetricsDto {
        private long total;
        private long active;
        private long sold;
        private long inactive;
        private long draft;
        private long newInPeriod;
        private long previousNewInPeriod;
        private Double changePercentage;
        @Builder.Default
        private List<Long> sparkline = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportMetricsDto {
        private long pending;
        private long inProgress;
        private long resolved;
        private long totalInPeriod;
        private long previousTotalInPeriod;
        private Double changePercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTrendDto {
        private String date; // YYYY-MM-DD
        private String label; // dd/MM
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderFunnelStepDto {
        private String status;
        private String label;
        private long count;
        private int percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrderSummaryDto {
        private Long id;
        private String orderNumber;
        private String productTitle;
        private String buyerName;
        private BigDecimal totalAmount;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentReportSummaryDto {
        private Long id;
        private String reason;
        private String reporterName;
        private String targetType;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentAuditLogSummaryDto {
        private Long id;
        private String actionType;
        private String adminName;
        private String targetType;
        private String details;
        private LocalDateTime createdAt;
    }
}
