package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service d'administration générale de ReVibe FliP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final com.revibeflip.repository.ContactMessageRepository contactMessageRepository;

    // Cache en mémoire court (30 secondes)
    private static class DashboardCacheEntry {
        final AdminDashboardDto data;
        final long expiresAt;
        DashboardCacheEntry(AdminDashboardDto data, long expiresAt) {
            this.data = data;
            this.expiresAt = expiresAt;
        }
    }
    private final Map<String, DashboardCacheEntry> dashboardCache = new ConcurrentHashMap<>();

    // ==========================================
    // 2. DASHBOARD (VUE D'ENSEMBLE)
    // ==========================================
    public AdminDashboardDto getDashboardStats() {
        return getDashboardStats("30d", null, null);
    }

    public AdminDashboardDto getDashboardStats(String period, LocalDate from, LocalDate to) {
        String cleanPeriod = (period == null || period.isBlank()) ? "30d" : period.toLowerCase().trim();
        String cacheKey = cleanPeriod + "_" + (from != null ? from.toString() : "") + "_" + (to != null ? to.toString() : "");

        long nowMillis = System.currentTimeMillis();
        DashboardCacheEntry cached = dashboardCache.get(cacheKey);
        if (cached != null && cached.expiresAt > nowMillis) {
            return cached.data;
        }

        ZoneId dakarZone = ZoneId.of("Africa/Dakar");
        ZonedDateTime nowZoned = ZonedDateTime.now(dakarZone);

        LocalDateTime currentStart;
        LocalDateTime currentEnd = nowZoned.toLocalDate().atTime(23, 59, 59);
        LocalDateTime previousStart;
        LocalDateTime previousEnd;
        long daysCount;

        if ("7d".equals(cleanPeriod)) {
            daysCount = 7;
            currentStart = nowZoned.minusDays(6).toLocalDate().atStartOfDay();
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(7);
        } else if ("90d".equals(cleanPeriod)) {
            daysCount = 90;
            currentStart = nowZoned.minusDays(89).toLocalDate().atStartOfDay();
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(90);
        } else if ("month".equals(cleanPeriod)) {
            LocalDate firstOfMonth = nowZoned.toLocalDate().withDayOfMonth(1);
            currentStart = firstOfMonth.atStartOfDay();
            daysCount = Math.max(1, ChronoUnit.DAYS.between(firstOfMonth, nowZoned.toLocalDate()) + 1);
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(daysCount);
        } else if ("custom".equals(cleanPeriod) && from != null && to != null) {
            if (from.isAfter(to)) {
                LocalDate tmp = from; from = to; to = tmp;
            }
            currentStart = from.atStartOfDay();
            currentEnd = to.atTime(23, 59, 59);
            daysCount = Math.max(1, ChronoUnit.DAYS.between(from, to) + 1);
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(daysCount);
        } else {
            cleanPeriod = "30d";
            daysCount = 30;
            currentStart = nowZoned.minusDays(29).toLocalDate().atStartOfDay();
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(30);
        }

        // Taux et paramètres dynamiques (jamais en dur)
        PlatformSetting settings = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> PlatformSetting.builder().build());
        BigDecimal commissionRate = settings.getCommissionRate() != null ? settings.getCommissionRate() : BigDecimal.valueOf(20.0);
        BigDecimal validationFeeRate = settings.getValidationFeeRate() != null ? settings.getValidationFeeRate() : BigDecimal.valueOf(1.0);

        // Données globales
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countActiveUsers();
        long inactiveUsers = userRepository.countSuspendedUsers();
        long newUsersInPeriod = userRepository.countByCreatedAtBetween(currentStart, currentEnd);
        long prevNewUsersInPeriod = userRepository.countByCreatedAtBetween(previousStart, previousEnd);

        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByStatus(ProductStatus.ACTIVE);
        long soldProducts = productRepository.countByStatus(ProductStatus.SOLD);
        long inactiveProducts = productRepository.countByStatus(ProductStatus.INACTIVE);
        long draftProducts = productRepository.countByStatus(ProductStatus.DRAFT);
        long newProductsInPeriod = productRepository.countByCreatedAtBetween(currentStart, currentEnd);
        long prevNewProductsInPeriod = productRepository.countByCreatedAtBetween(previousStart, previousEnd);

        long totalOrders = orderRepository.count();

        // Commandes période courante et précédente
        List<Order> currentOrders = orderRepository.findByCreatedAtBetween(currentStart, currentEnd);
        List<Order> previousOrders = orderRepository.findByCreatedAtBetween(previousStart, previousEnd);

        // Chiffre d'affaires (commandes payées)
        BigDecimal currentRevenue = currentOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousRevenue = previousOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Commissions réalisées (commandes dont les fonds sont libérés ou COMPLETED)
        BigDecimal currentEarnedCommissions = currentOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(o -> {
                    if (o.getPlatformCommission() != null) return o.getPlatformCommission();
                    BigDecimal base = o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount();
                    return base.multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousEarnedCommissions = previousOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(o -> {
                    if (o.getPlatformCommission() != null) return o.getPlatformCommission();
                    BigDecimal base = o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount();
                    return base.multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fonds sous séquestre (LOCKED)
        List<Payment> lockedPayments = paymentRepository.findByEscrowStatus(EscrowStatus.LOCKED);
        BigDecimal escrowLockedFunds = lockedPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Commissions en attente (calculées sur les fonds LOCKED)
        BigDecimal pendingCommissions = escrowLockedFunds.multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Frais de validation perçus
        BigDecimal currentValidationFees = currentOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> {
                    if (o.getValidationFee() != null) return o.getValidationFee();
                    BigDecimal base = o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount();
                    return base.multiply(validationFeeRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal prevValidationFees = previousOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> {
                    if (o.getValidationFee() != null) return o.getValidationFee();
                    BigDecimal base = o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount();
                    return base.multiply(validationFeeRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Panier moyen
        long currentPaidCount = currentOrders.stream().filter(o -> isPaidStatus(o.getStatus())).count();
        long previousPaidCount = previousOrders.stream().filter(o -> isPaidStatus(o.getStatus())).count();

        BigDecimal currentAvgBasket = currentPaidCount > 0
                ? currentRevenue.divide(BigDecimal.valueOf(currentPaidCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal prevAvgBasket = previousPaidCount > 0
                ? previousRevenue.divide(BigDecimal.valueOf(previousPaidCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Transactions (paiements réussis)
        long currentTransactions = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.SUCCESS, currentStart, currentEnd);
        long previousTransactions = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.SUCCESS, previousStart, previousEnd);

        // Commandes totales dans la période
        long totalOrdersInPeriod = currentOrders.size();
        long prevOrdersInPeriod = previousOrders.size();

        // Signalements
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReportsInPeriod = reportRepository.countByStatusAndCreatedAtBetween(ReportStatus.RESOLVED, currentStart, currentEnd);
        long totalReportsInPeriod = reportRepository.countByCreatedAtBetween(currentStart, currentEnd);
        long prevTotalReportsInPeriod = reportRepository.countByCreatedAtBetween(previousStart, previousEnd);

        // Bandeau « À traiter »
        long disputedOrdersCount = orderRepository.countByStatus(OrderStatus.DISPUTED);
        long deliveredAwaitingConfirmation = orderRepository.countByDeliveryStatusAndStatus(DeliveryStatus.DELIVERED, OrderStatus.DELIVERED);
        long pendingModeration = draftProducts;
        long unreadContactMessages = contactMessageRepository.countByStatus(com.revibeflip.entity.enums.ContactMessageStatus.NEW);
        long totalToHandle = pendingReports + disputedOrdersCount + deliveredAwaitingConfirmation + pendingModeration + unreadContactMessages;

        AdminDashboardDto.ActionItemsDto actionItems = AdminDashboardDto.ActionItemsDto.builder()
                .pendingReportsAndDisputes(pendingReports + disputedOrdersCount)
                .pendingModerationProducts(pendingModeration)
                .disputedOrders(disputedOrdersCount)
                .deliveredAwaitingConfirmationOrders(deliveredAwaitingConfirmation)
                .unreadContactMessages(unreadContactMessages)
                .totalToHandle(totalToHandle)
                .hasItemsToHandle(totalToHandle > 0)
                .build();

        // Tendances journalières & Sparklines
        // Si <= 31 jours : jour par jour (tous les jours de la période affichés y compris à 0, Africa/Dakar)
        // Si > 31 jours : regroupement par tranches de 7 jours (semaines)
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("dd/MM");
        DateTimeFormatter isoDateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<SalesTrendDto> salesTrends = new ArrayList<>();
        List<AdminDashboardDto.UserTrendDto> userTrends = new ArrayList<>();
        List<BigDecimal> revenueSparkline = new ArrayList<>();
        List<BigDecimal> orderSparkline = new ArrayList<>();
        List<Long> userSparkline = new ArrayList<>();
        List<Long> productSparkline = new ArrayList<>();

        List<User> periodUsers = userRepository.findByCreatedAtBetween(currentStart, currentEnd);
        List<Product> periodProducts = productRepository.findByCreatedAtBetween(currentStart, currentEnd);

        if (daysCount <= 31) {
            for (long i = daysCount - 1; i >= 0; i--) {
                LocalDateTime dayStart = currentEnd.minusDays(i).toLocalDate().atStartOfDay();
                LocalDateTime dayEnd = currentEnd.minusDays(i).toLocalDate().atTime(23, 59, 59);
                String label = dayStart.format(dayFmt);
                String isoDate = dayStart.format(isoDateFmt);

                List<Order> dayOrders = currentOrders.stream()
                        .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(dayStart) && !o.getCreatedAt().isAfter(dayEnd))
                        .collect(Collectors.toList());

                BigDecimal dayRev = dayOrders.stream()
                        .filter(o -> isPaidStatus(o.getStatus()))
                        .map(o -> o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                long dayUserCount = periodUsers.stream()
                        .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(dayStart) && !u.getCreatedAt().isAfter(dayEnd))
                        .count();

                long dayProdCount = periodProducts.stream()
                        .filter(p -> p.getCreatedAt() != null && !p.getCreatedAt().isBefore(dayStart) && !p.getCreatedAt().isAfter(dayEnd))
                        .count();

                salesTrends.add(new SalesTrendDto(isoDate, label, dayRev, dayOrders.size()));
                userTrends.add(new AdminDashboardDto.UserTrendDto(isoDate, label, dayUserCount));
                revenueSparkline.add(dayRev);
                orderSparkline.add(BigDecimal.valueOf(dayOrders.size()));
                userSparkline.add(dayUserCount);
                productSparkline.add(dayProdCount);
            }
        } else {
            // Regroupement par semaine pour les périodes > 31 jours
            LocalDate start = currentStart.toLocalDate();
            LocalDate end = currentEnd.toLocalDate();
            LocalDate wStart = start;
            int weekIdx = 1;
            while (!wStart.isAfter(end)) {
                LocalDate wEnd = wStart.plusDays(6);
                if (wEnd.isAfter(end)) wEnd = end;

                LocalDateTime intervalStart = wStart.atStartOfDay();
                LocalDateTime intervalEnd = wEnd.atTime(23, 59, 59);

                String label = "S" + weekIdx + " (" + wStart.format(dayFmt) + ")";
                String isoDate = wStart.format(isoDateFmt);

                List<Order> weekOrders = currentOrders.stream()
                        .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(intervalStart) && !o.getCreatedAt().isAfter(intervalEnd))
                        .collect(Collectors.toList());

                BigDecimal weekRev = weekOrders.stream()
                        .filter(o -> isPaidStatus(o.getStatus()))
                        .map(o -> o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount())
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                long weekUserCount = periodUsers.stream()
                        .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(intervalStart) && !u.getCreatedAt().isAfter(intervalEnd))
                        .count();

                long weekProdCount = periodProducts.stream()
                        .filter(p -> p.getCreatedAt() != null && !p.getCreatedAt().isBefore(intervalStart) && !p.getCreatedAt().isAfter(intervalEnd))
                        .count();

                salesTrends.add(new SalesTrendDto(isoDate, label, weekRev, weekOrders.size()));
                userTrends.add(new AdminDashboardDto.UserTrendDto(isoDate, label, weekUserCount));
                revenueSparkline.add(weekRev);
                orderSparkline.add(BigDecimal.valueOf(weekOrders.size()));
                userSparkline.add(weekUserCount);
                productSparkline.add(weekProdCount);

                wStart = wEnd.plusDays(1);
                weekIdx++;
            }
        }

        // Entonnoir par statut
        Map<OrderStatus, Long> ordersByStatusMap = currentOrders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        Map<String, Long> statusStringMap = new LinkedHashMap<>();
        for (OrderStatus st : OrderStatus.values()) {
            statusStringMap.put(st.name(), ordersByStatusMap.getOrDefault(st, 0L));
        }

        List<AdminDashboardDto.OrderFunnelStepDto> orderFunnel = List.of(
                new AdminDashboardDto.OrderFunnelStepDto("PENDING_PAYMENT", "En attente de paiement", ordersByStatusMap.getOrDefault(OrderStatus.PENDING_PAYMENT, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.PENDING_PAYMENT, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("PAID_ESCROW_LOCKED", "Payées sous séquestre", ordersByStatusMap.getOrDefault(OrderStatus.PAID_ESCROW_LOCKED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.PAID_ESCROW_LOCKED, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("SHIPPED", "En cours de livraison", ordersByStatusMap.getOrDefault(OrderStatus.SHIPPED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.SHIPPED, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("DELIVERED", "Livrées (en attente confirmation)", ordersByStatusMap.getOrDefault(OrderStatus.DELIVERED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.DELIVERED, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("COMPLETED", "Finalisées & libérées", ordersByStatusMap.getOrDefault(OrderStatus.COMPLETED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.COMPLETED, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("CANCELLED", "Annulées / Expirées", ordersByStatusMap.getOrDefault(OrderStatus.CANCELLED, 0L) + ordersByStatusMap.getOrDefault(OrderStatus.EXPIRED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.CANCELLED, 0L) + ordersByStatusMap.getOrDefault(OrderStatus.EXPIRED, 0L), totalOrdersInPeriod)),
                new AdminDashboardDto.OrderFunnelStepDto("DISPUTED", "En litige", ordersByStatusMap.getOrDefault(OrderStatus.DISPUTED, 0L), calculatePercentage(ordersByStatusMap.getOrDefault(OrderStatus.DISPUTED, 0L), totalOrdersInPeriod))
        );

        // Top Rayons : 1) Par ventes réelles (CA & commandes) et 2) Par nombre d'annonces
        List<Category> allCategories = categoryRepository.findAll();
        List<CategoryStatDto> allCategoryStats = new ArrayList<>();
        BigDecimal totalSalesAllCats = BigDecimal.ZERO;

        for (Category cat : allCategories) {
            long pCount = productRepository.countByCategoryId(cat.getId());
            long oCount = currentOrders.stream().filter(o -> o.getProduct() != null && o.getProduct().getCategory() != null && o.getProduct().getCategory().getId().equals(cat.getId())).count();
            BigDecimal catAmount = currentOrders.stream()
                    .filter(o -> o.getProduct() != null && o.getProduct().getCategory() != null && o.getProduct().getCategory().getId().equals(cat.getId()))
                    .map(o -> o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            totalSalesAllCats = totalSalesAllCats.add(catAmount);
            allCategoryStats.add(new CategoryStatDto(cat.getName(), pCount, oCount, catAmount, 0));
        }

        // Classement 1 : Par ventes réelles
        final BigDecimal finalSalesTotal = totalSalesAllCats;
        List<CategoryStatDto> topCategoriesBySales = allCategoryStats.stream()
                .sorted((a, b) -> {
                    int cmp = b.getTotalSales().compareTo(a.getTotalSales());
                    if (cmp != 0) return cmp;
                    return Long.compare(b.getOrderCount(), a.getOrderCount());
                })
                .limit(5)
                .map(stat -> {
                    int pct = finalSalesTotal.compareTo(BigDecimal.ZERO) > 0
                            ? stat.getTotalSales().multiply(BigDecimal.valueOf(100)).divide(finalSalesTotal, 0, RoundingMode.HALF_UP).intValue()
                            : (totalOrdersInPeriod > 0 ? (int) Math.round(((double) stat.getOrderCount() / (double) totalOrdersInPeriod) * 100) : 0);
                    return new CategoryStatDto(stat.getName(), stat.getProductCount(), stat.getOrderCount(), stat.getTotalSales(), pct);
                })
                .collect(Collectors.toList());

        // Classement 2 : Par volume d'annonces
        List<CategoryStatDto> topCategoriesByProducts = allCategoryStats.stream()
                .sorted((a, b) -> Long.compare(b.getProductCount(), a.getProductCount()))
                .limit(5)
                .map(stat -> {
                    int pct = totalProducts > 0 ? (int) Math.round(((double) stat.getProductCount() / (double) totalProducts) * 100) : 0;
                    return new CategoryStatDto(stat.getName(), stat.getProductCount(), stat.getOrderCount(), stat.getTotalSales(), pct);
                })
                .collect(Collectors.toList());

        List<CategoryStatDto> topCategories = topCategoriesBySales.stream().anyMatch(c -> c.getTotalSales().compareTo(BigDecimal.ZERO) > 0)
                ? topCategoriesBySales
                : topCategoriesByProducts;

        // Répartition paiements : TOUJOURS WAVE, ORANGE_MONEY, FREE_MONEY (MÊME À 0)
        List<Payment> periodPayments = paymentRepository.findByCreatedAtBetween(currentStart, currentEnd);
        Map<PaymentMethod, List<Payment>> byMethod = periodPayments.stream().collect(Collectors.groupingBy(Payment::getPaymentMethod));
        long totalPaymentsCount = Math.max(1, periodPayments.size());

        List<PaymentDistributionDto> paymentDistributions = new ArrayList<>();
        for (PaymentMethod m : List.of(PaymentMethod.WAVE, PaymentMethod.ORANGE_MONEY, PaymentMethod.FREE_MONEY)) {
            List<Payment> mList = byMethod.getOrDefault(m, Collections.emptyList());
            long mCount = mList.size();
            BigDecimal mAmount = mList.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            int mPct = (int) Math.round(((double) mCount / (double) totalPaymentsCount) * 100);
            paymentDistributions.add(new PaymentDistributionDto(m.getDisplayName(), mCount, mAmount, mPct));
        }

        // Listes courtes (5 derniers éléments)
        List<AdminDashboardDto.RecentOrderSummaryDto> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(o -> new AdminDashboardDto.RecentOrderSummaryDto(
                        o.getId(),
                        o.getOrderNumber(),
                        o.getProduct() != null ? o.getProduct().getTitle() : "Article",
                        o.getBuyer() != null ? o.getBuyer().getFullName() : "Acheteur",
                        o.getTotalAmount(),
                        o.getStatus().name(),
                        o.getCreatedAt()
                ))
                .collect(Collectors.toList());

        List<AdminDashboardDto.RecentReportSummaryDto> recentReports = reportRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(r -> new AdminDashboardDto.RecentReportSummaryDto(
                        r.getId(),
                        r.getReason() != null ? r.getReason().getLabel() : "Signalement",
                        r.getReporter() != null ? r.getReporter().getFullName() : "Utilisateur",
                        r.getReportedProduct() != null ? "PRODUCT" : (r.getReportedUser() != null ? "USER" : "ORDER"),
                        r.getStatus().name(),
                        r.getCreatedAt()
                ))
                .collect(Collectors.toList());

        List<AdminActionLog> logs = adminActionLogRepository.findTop20ByOrderByCreatedAtDesc();
        List<AdminDashboardDto.RecentAuditLogSummaryDto> recentAuditLogs = logs.subList(0, Math.min(5, logs.size())).stream()
                .map(l -> new AdminDashboardDto.RecentAuditLogSummaryDto(
                        l.getId(),
                        l.getActionType(),
                        l.getAdmin() != null ? l.getAdmin().getFullName() : "Admin",
                        l.getTargetType(),
                        l.getDetails(),
                        l.getCreatedAt()
                ))
                .collect(Collectors.toList());

        AdminDashboardDto dto = AdminDashboardDto.builder()
                .period(cleanPeriod)
                .startDate(currentStart.toLocalDate().toString())
                .endDate(currentEnd.toLocalDate().toString())
                .lastUpdated(nowZoned.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                .currency(settings.getCurrency() != null ? settings.getCurrency() : "FCFA")
                .commissionRate(commissionRate)
                .validationFeeRate(validationFeeRate)
                .actionItems(actionItems)
                .revenue(new AdminDashboardDto.MetricWithChangeDto(currentRevenue, previousRevenue, calculatePercentageChange(currentRevenue, previousRevenue), revenueSparkline))
                .earnedCommissions(new AdminDashboardDto.MetricWithChangeDto(currentEarnedCommissions, previousEarnedCommissions, calculatePercentageChange(currentEarnedCommissions, previousEarnedCommissions), Collections.emptyList()))
                .escrowLockedFunds(new AdminDashboardDto.MetricWithChangeDto(escrowLockedFunds, escrowLockedFunds, 0.0, Collections.emptyList()))
                .pendingCommissions(new AdminDashboardDto.MetricWithChangeDto(pendingCommissions, pendingCommissions, 0.0, Collections.emptyList()))
                .validationFees(new AdminDashboardDto.MetricWithChangeDto(currentValidationFees, prevValidationFees, calculatePercentageChange(currentValidationFees, prevValidationFees), Collections.emptyList()))
                .orders(new AdminDashboardDto.MetricWithChangeDto(BigDecimal.valueOf(totalOrdersInPeriod), BigDecimal.valueOf(prevOrdersInPeriod), calculatePercentageChange(totalOrdersInPeriod, prevOrdersInPeriod), orderSparkline))
                .transactions(new AdminDashboardDto.MetricWithChangeDto(BigDecimal.valueOf(currentTransactions), BigDecimal.valueOf(previousTransactions), calculatePercentageChange(currentTransactions, previousTransactions), Collections.emptyList()))
                .averageBasket(new AdminDashboardDto.MetricWithChangeDto(currentAvgBasket, prevAvgBasket, calculatePercentageChange(currentAvgBasket, prevAvgBasket), Collections.emptyList()))
                .users(new AdminDashboardDto.UserMetricsDto(totalUsers, activeUsers, inactiveUsers, newUsersInPeriod, prevNewUsersInPeriod, calculatePercentageChange(newUsersInPeriod, prevNewUsersInPeriod), userSparkline))
                .products(new AdminDashboardDto.ProductMetricsDto(totalProducts, activeProducts, soldProducts, inactiveProducts, draftProducts, newProductsInPeriod, prevNewProductsInPeriod, calculatePercentageChange(newProductsInPeriod, prevNewProductsInPeriod), productSparkline))
                .reports(new AdminDashboardDto.ReportMetricsDto(pendingReports, 0L, resolvedReportsInPeriod, totalReportsInPeriod, prevTotalReportsInPeriod, calculatePercentageChange(totalReportsInPeriod, prevTotalReportsInPeriod)))
                .salesTrends(salesTrends)
                .userRegistrationTrends(userTrends)
                .topCategories(topCategories)
                .topCategoriesBySales(topCategoriesBySales)
                .topCategoriesByProducts(topCategoriesByProducts)
                .paymentDistributions(paymentDistributions)
                .orderFunnel(orderFunnel)
                .ordersByStatus(statusStringMap)
                .recentOrders(recentOrders)
                .recentReports(recentReports)
                .recentAuditLogs(recentAuditLogs)
                // Rétrocompatibilité widgets legacy
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldProducts(soldProducts)
                .inactiveProducts(inactiveProducts)
                .totalOrders(totalOrders)
                .totalTransactions(currentTransactions)
                .totalTransactionsAmount(currentRevenue)
                .totalCommissions(currentEarnedCommissions)
                .totalValidationFees(currentValidationFees)
                .pendingReports(pendingReports)
                .build();

        // Mise en cache 30 secondes
        dashboardCache.put(cacheKey, new DashboardCacheEntry(dto, nowMillis + 30_000L));
        return dto;
    }

    private boolean isPaidStatus(OrderStatus status) {
        return status == OrderStatus.PAID_ESCROW_LOCKED
                || status == OrderStatus.SHIPPED
                || status == OrderStatus.DELIVERED
                || status == OrderStatus.COMPLETED;
    }

    private int calculatePercentage(long count, long total) {
        if (total <= 0) return 0;
        return (int) Math.round(((double) count / (double) total) * 100);
    }

    private Double calculatePercentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            if (current != null && current.compareTo(BigDecimal.ZERO) > 0) return 100.0;
            if (current != null && current.compareTo(BigDecimal.ZERO) < 0) return -100.0;
            return 0.0;
        }
        BigDecimal diff = current.subtract(previous);
        BigDecimal pct = diff.divide(previous, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        return pct.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private Double calculatePercentageChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        double pct = ((double) (current - previous) / (double) previous) * 100.0;
        return Math.round(pct * 10.0) / 10.0;
    }

    // ==========================================
    // 3. GESTION DES UTILISATEURS (AVEC PAGINATION & GARDE-FOUS)
    // ==========================================
    public PageResponseDto<UserDto> searchUsersPage(String query, Role role, Boolean isSuspended, Pageable pageable) {
        Page<User> page = userRepository.searchUsersPage(query, role, isSuspended, pageable);
        return PageResponseDto.fromPage(page.map(UserDto::fromEntity));
    }

    public List<UserDto> searchUsers(String query) {
        List<User> users = (query != null && !query.isBlank())
                ? userRepository.searchUsers(query.trim())
                : userRepository.findAll();
        return users.stream().map(UserDto::fromEntity).collect(Collectors.toList());
    }

    public AdminUserDetailDto getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id : " + userId));

        List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(userId);
        List<Order> purchases = orderRepository.findByBuyerIdOrderByCreatedAtDesc(userId);
        List<Order> sales = orderRepository.findBySellerIdOrderByCreatedAtDesc(userId);
        List<Review> reviews = reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(userId);

        BigDecimal totalSpent = purchases.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEarned = sales.stream()
                .filter(o -> OrderStatus.COMPLETED.equals(o.getStatus()))
                .map(Order::getSellerPayout)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double avgRating = reviewRepository.calculateAverageRating(userId);
        long totalReviews = reviewRepository.countByTargetUserId(userId);

        return AdminUserDetailDto.builder()
                .user(UserDto.fromEntity(user))
                .products(products.stream().map(ProductDto::fromEntity).collect(Collectors.toList()))
                .purchases(purchases.stream().map(OrderDto::fromEntity).collect(Collectors.toList()))
                .sales(sales.stream().map(OrderDto::fromEntity).collect(Collectors.toList()))
                .reviews(reviews.stream().map(ReviewDto::fromEntity).collect(Collectors.toList()))
                .totalSpent(totalSpent)
                .totalEarned(totalEarned)
                .averageRating(avgRating != null ? avgRating : 5.0)
                .totalReviews(totalReviews)
                .build();
    }

    @Transactional
    public UserDto toggleUserSuspension(Long userId, boolean suspend, User admin) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id : " + userId));

        // Point 7 : Garde-fous de sécurité sur les rôles
        if (admin != null && admin.getId() != null && admin.getId().equals(userId) && suspend) {
            logAdminAction(admin, "SECURITY_VIOLATION_BLOCKED", "USER", String.valueOf(userId),
                    "Tentative bloquée : Un administrateur ne peut pas suspendre son propre compte.");
            throw new IllegalArgumentException("Action interdite : Vous ne pouvez pas suspendre votre propre compte administrateur.");
        }

        if (suspend && Role.ROLE_ADMIN.equals(targetUser.getRole())) {
            long activeAdmins = userRepository.countActiveAdmins();
            if (activeAdmins <= 1) {
                logAdminAction(admin, "SECURITY_VIOLATION_BLOCKED", "USER", String.valueOf(userId),
                        "Tentative bloquée : Impossible de suspendre le dernier administrateur actif de la plateforme.");
                throw new IllegalStateException("Action interdite : Impossible de suspendre le dernier administrateur actif de la marketplace.");
            }
        }

        targetUser.setIsSuspended(suspend);
        User saved = userRepository.save(targetUser);

        logAdminAction(admin,
                suspend ? "USER_SUSPEND" : "USER_REACTIVATE",
                "USER",
                String.valueOf(userId),
                "Compte " + (suspend ? "suspendu" : "réactivé") + " pour : " + targetUser.getFullName() + " (" + targetUser.getPhone() + ")"
        );

        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto updateUserRole(Long userId, Role newRole, User admin) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'id : " + userId));

        // Point 7 : Garde-fous de sécurité sur les rôles
        if (admin != null && admin.getId() != null && admin.getId().equals(userId) && !Role.ROLE_ADMIN.equals(newRole)) {
            logAdminAction(admin, "SECURITY_VIOLATION_BLOCKED", "USER", String.valueOf(userId),
                    "Tentative bloquée : Un administrateur ne peut pas se retirer son propre rôle ADMIN.");
            throw new IllegalArgumentException("Action interdite : Vous ne pouvez pas vous retirer votre propre rôle administrateur.");
        }

        if (Role.ROLE_ADMIN.equals(targetUser.getRole()) && !Role.ROLE_ADMIN.equals(newRole)) {
            long activeAdmins = userRepository.countActiveAdmins();
            if (activeAdmins <= 1) {
                logAdminAction(admin, "SECURITY_VIOLATION_BLOCKED", "USER", String.valueOf(userId),
                        "Tentative bloquée : Impossible de rétrograder le dernier administrateur actif de la plateforme.");
                throw new IllegalStateException("Action interdite : Impossible de rétrograder le dernier administrateur actif de la marketplace.");
            }
        }

        targetUser.setRole(newRole);
        User saved = userRepository.save(targetUser);

        logAdminAction(admin,
                "ROLE_CHANGE",
                "USER",
                String.valueOf(userId),
                "Rôle modifié vers " + newRole.name() + " pour : " + targetUser.getFullName()
        );

        return UserDto.fromEntity(saved);
    }

    // ==========================================
    // 4. GESTION DES ANNONCES (AVEC PAGINATION)
    // ==========================================
    public PageResponseDto<ProductDto> searchProductsPage(String query, ProductStatus status, Long categoryId, Long sellerId, Pageable pageable) {
        Page<Product> page = productRepository.adminSearchPage(query, status, categoryId, sellerId, pageable);
        return PageResponseDto.fromPage(page.map(ProductDto::fromEntity));
    }

    public List<ProductDto> adminSearchProducts(String query, ProductStatus status, Long categoryId, Long sellerId) {
        List<Product> products = (query != null && !query.isBlank())
                ? productRepository.adminSearch(query.trim())
                : productRepository.findAll();

        return products.stream()
                .filter(p -> status == null || p.getStatus() == status)
                .filter(p -> categoryId == null || (p.getCategory() != null && p.getCategory().getId().equals(categoryId)))
                .filter(p -> sellerId == null || (p.getSeller() != null && p.getSeller().getId().equals(sellerId)))
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto setProductStatus(Long productId, ProductStatus status, User admin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));
        ProductStatus oldStatus = product.getStatus();
        product.setStatus(status);
        Product saved = productRepository.save(product);

        logAdminAction(admin,
                "PRODUCT_STATUS_UPDATE",
                "PRODUCT",
                String.valueOf(productId),
                "Statut modifié de " + oldStatus + " vers " + status + " pour : " + product.getTitle()
        );

        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public void deleteProduct(Long productId, User admin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));
        String title = product.getTitle();
        productRepository.delete(product);

        logAdminAction(admin,
                "PRODUCT_DELETE",
                "PRODUCT",
                String.valueOf(productId),
                "Suppression définitive de l'annonce : " + title
        );
    }

    // ==========================================
    // 5. GESTION DES CATÉGORIES (RAYONS)
    // ==========================================
    @Transactional
    public Category createCategory(CategoryRequest req, User admin) {
        Category category = Category.builder()
                .name(req.getName().trim())
                .slug(req.getSlug().trim().toLowerCase())
                .icon(req.getIcon())
                .description(req.getDescription())
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
                .active(req.getActive() != null ? req.getActive() : true)
                .build();
        Category saved = categoryRepository.save(category);

        logAdminAction(admin,
                "CATEGORY_CREATE",
                "CATEGORY",
                String.valueOf(saved.getId()),
                "Création du rayon : " + saved.getName()
        );

        return saved;
    }

    @Transactional
    public Category updateCategory(Long id, CategoryRequest req, User admin) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catégorie non trouvée avec l'id : " + id));

        category.setName(req.getName().trim());
        category.setSlug(req.getSlug().trim().toLowerCase());
        if (req.getIcon() != null) category.setIcon(req.getIcon());
        if (req.getDescription() != null) category.setDescription(req.getDescription());
        if (req.getDisplayOrder() != null) category.setDisplayOrder(req.getDisplayOrder());
        if (req.getActive() != null) category.setActive(req.getActive());

        Category saved = categoryRepository.save(category);

        logAdminAction(admin,
                "CATEGORY_UPDATE",
                "CATEGORY",
                String.valueOf(saved.getId()),
                "Mise à jour du rayon : " + saved.getName()
        );

        return saved;
    }

    @Transactional
    public void deleteCategory(Long id, User admin) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catégorie non trouvée avec l'id : " + id));

        long associatedProductsCount = productRepository.countByCategoryId(id);
        if (associatedProductsCount > 0) {
            throw new IllegalStateException("Protection activée : Impossible de supprimer ce rayon car il contient encore "
                    + associatedProductsCount + " annonce(s) associée(s). Veuillez d'abord réassigner ou archiver ces annonces.");
        }

        String name = category.getName();
        categoryRepository.delete(category);

        logAdminAction(admin,
                "CATEGORY_DELETE",
                "CATEGORY",
                String.valueOf(id),
                "Suppression du rayon : " + name
        );
    }

    // ==========================================
    // 6. GESTION DES COMMANDES & SUIVI LIVRAISON (AVEC PAGINATION)
    // ==========================================
    public PageResponseDto<OrderDto> searchOrdersPage(String query, OrderStatus status, Pageable pageable) {
        Page<Order> page = orderRepository.searchOrdersPage(query, status, pageable);
        return PageResponseDto.fromPage(page.map(OrderDto::fromEntity));
    }

    public List<OrderDto> searchOrders(String query, OrderStatus status) {
        List<Order> orders = (query != null && !query.isBlank())
                ? orderRepository.searchOrders(query.trim())
                : orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .filter(o -> status == null || o.getStatus() == status)
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public OrderDto getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée avec l'id : " + orderId));
        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto updateOrderDeliveryStatus(Long orderId, DeliveryStatus deliveryStatus, String notes, User admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée avec l'id : " + orderId));

        DeliveryStatus oldStatus = order.getDeliveryStatus();
        order.setDeliveryStatus(deliveryStatus);
        if (notes != null && !notes.isBlank()) {
            String updatedNotes = (order.getDeliveryNotes() != null ? order.getDeliveryNotes() + "\n" : "")
                    + "[" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + "] " + notes;
            order.setDeliveryNotes(updatedNotes);
        }

        if (DeliveryStatus.DELIVERED.equals(deliveryStatus) && OrderStatus.SHIPPED.equals(order.getStatus())) {
            order.setStatus(OrderStatus.DELIVERED);
        }

        Order saved = orderRepository.save(order);

        logAdminAction(admin,
                "ORDER_DELIVERY_UPDATE",
                "ORDER",
                order.getOrderNumber(),
                "Suivi de livraison mis à jour de " + (oldStatus != null ? oldStatus.name() : "N/A") + " vers " + deliveryStatus.name()
        );

        return OrderDto.fromEntity(saved);
    }

    // ==========================================
    // 7. GESTION DES PAIEMENTS / TRANSACTIONS (AVEC PAGINATION)
    // ==========================================
    public PageResponseDto<AdminPaymentDto> searchPaymentsPage(String query, PaymentMethod method, Pageable pageable) {
        Page<Payment> page = paymentRepository.searchPaymentsPage(query, method, pageable);
        return PageResponseDto.fromPage(page.map(AdminPaymentDto::fromEntity));
    }

    public List<AdminPaymentDto> getAllPayments() {
        List<Payment> payments = paymentRepository.findAllByOrderByCreatedAtDesc();
        return payments.stream()
                .map(AdminPaymentDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ==========================================
    // 8. SIGNALEMENTS & LITIGES (AVEC PAGINATION)
    // ==========================================
    public PageResponseDto<ReportDto> searchReportsPage(ReportStatus status, Pageable pageable) {
        Page<Report> page = (status != null)
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponseDto.fromPage(page.map(ReportDto::fromEntity));
    }

    @Transactional
    public ReportDto resolveReportWithAction(Long reportId, ReportStatus status, String action, String adminNotes, User admin) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé avec l'id : " + reportId));

        report.setStatus(status);
        report.setAdminNotes(adminNotes);
        report.setResolvedAt(LocalDateTime.now());

        StringBuilder actionSummary = new StringBuilder("Signalement #" + reportId + " statut: " + status.name());

        if (action != null) {
            switch (action.toUpperCase()) {
                case "DEACTIVATE_LISTING" -> {
                    if (report.getReportedProduct() != null) {
                        Product p = report.getReportedProduct();
                        p.setStatus(ProductStatus.INACTIVE);
                        p.setDeactivationReason(adminNotes != null && !adminNotes.isBlank() ? adminNotes : "Désactivée par la modération suite à un signalement (" + report.getReason().getLabel() + ")");
                        productRepository.save(p);
                        actionSummary.append(" | Action exécutée: Annonce #").append(p.getId()).append(" désactivée.");
                    }
                }
                case "SUSPEND_USER" -> {
                    if (report.getReportedUser() != null) {
                        User u = report.getReportedUser();
                        u.setIsSuspended(true);
                        userRepository.save(u);
                        actionSummary.append(" | Action exécutée: Utilisateur ").append(u.getFullName()).append(" suspendu.");
                    }
                }
                case "WARN" -> {
                    actionSummary.append(" | Action exécutée: Avertissement officiel consigné.");
                }
                default -> {
                    actionSummary.append(" | Clôture sans sanction.");
                }
            }
        }

        Report saved = reportRepository.save(report);

        logAdminAction(admin,
                "REPORT_RESOLVED",
                "REPORT",
                String.valueOf(reportId),
                actionSummary.toString()
        );

        return ReportDto.fromEntity(saved);
    }

    // ==========================================
    // 10. PARAMÈTRES DE LA PLATEFORME (Point 4)
    // ==========================================
    public PlatformSettingsDto getPlatformSettings() {
        PlatformSetting setting = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> platformSettingRepository.save(PlatformSetting.builder()
                        .commissionRate(BigDecimal.valueOf(20.0))
                        .validationFeeRate(BigDecimal.valueOf(1.0))
                        .platformName("ReVibe FliP")
                        .supportEmail("contact@revibeflip.com")
                        .supportPhone("+221 77 123 45 67")
                        .currency("FCFA")
                        .build()));
        return PlatformSettingsDto.fromEntity(setting);
    }

    @Transactional
    public PlatformSettingsDto updatePlatformSettings(UpdatePlatformSettingsRequest req, User admin) {
        PlatformSetting setting = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> PlatformSetting.builder().build());

        setting.setCommissionRate(req.getCommissionRate());
        setting.setValidationFeeRate(req.getValidationFeeRate());
        setting.setPlatformName(req.getPlatformName().trim());
        setting.setSupportEmail(req.getSupportEmail().trim());
        setting.setSupportPhone(req.getSupportPhone().trim());
        setting.setCurrency(req.getCurrency().trim());
        if (req.getOfferValidityHours() != null) setting.setOfferValidityHours(req.getOfferValidityHours());
        if (req.getReservationDurationHours() != null) setting.setReservationDurationHours(req.getReservationDurationHours());
        setting.setUpdatedBy(admin);

        PlatformSetting saved = platformSettingRepository.save(setting);

        logAdminAction(admin,
                "SETTINGS_UPDATE",
                "PLATFORM_SETTING",
                String.valueOf(saved.getId()),
                "Paramètres mis à jour : Commission=" + saved.getCommissionRate() + "%, Frais Validation=" + saved.getValidationFeeRate() + "%"
        );

        return PlatformSettingsDto.fromEntity(saved);
    }

    // Consultation en lecture seule d'une discussion liée à un litige (journalisée)
    @Transactional
    public List<MessageDto> auditViewConversation(Long conversationId, Long reportId, User admin) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable."));

        String reason = reportId != null ? "Litige / Signalement #" + reportId : "Supervision litige";
        logAdminAction(admin,
                "VIEW_CONVERSATION",
                "CONVERSATION",
                String.valueOf(conversationId),
                "Consultation en lecture seule des messages de la discussion #" + conversationId + " (" + reason + ")"
        );

        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(MessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ==========================================
    // 11. AUDIT TRAIL / JOURNALISATION (AVEC PAGINATION)
    // ==========================================
    public PageResponseDto<AdminActionLogDto> getAuditLogsPage(Pageable pageable) {
        Page<AdminActionLog> page = adminActionLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponseDto.fromPage(page.map(AdminActionLogDto::fromEntity));
    }

    public List<AdminActionLogDto> getAuditLogs() {
        return adminActionLogRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(AdminActionLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    public void logAdminAction(User admin, String actionType, String targetType, String targetId, String details) {
        try {
            if (admin != null) {
                AdminActionLog logEntry = AdminActionLog.builder()
                        .admin(admin)
                        .actionType(actionType)
                        .targetType(targetType)
                        .targetId(targetId)
                        .details(details)
                        .createdAt(LocalDateTime.now())
                        .build();
                adminActionLogRepository.save(logEntry);
            }
        } catch (Exception e) {
            log.error("Impossible d'enregistrer l'action d'audit admin", e);
        }
    }
}
