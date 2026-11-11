package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service central pour l'Espace Vendeur ReVibe FliP.
 * Gère le profil, les annonces, commandes, livraison, messagerie temps réel,
 * transactions, avis et notifications du vendeur avec vérification stricte de propriété.
 *
 * NOTE SUR LE SÉQUESTRE (Point 6) :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire
 * (Wave, Orange Money, Free Money) et la validation du cadre juridique avant la production.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SellerService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final CountryRepository countryRepository;
    private final ChatOfferRepository chatOfferRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static class SellerDashboardCacheEntry {
        final SellerDashboardDto data;
        final long expiresAt;

        SellerDashboardCacheEntry(SellerDashboardDto data, long expiresAt) {
            this.data = data;
            this.expiresAt = expiresAt;
        }
    }

    private final Map<String, SellerDashboardCacheEntry> sellerDashboardCache = new java.util.concurrent.ConcurrentHashMap<>();

    // ==========================================
    // 1. COMPTE ET PROFIL VENDEUR
    // ==========================================
    public SellerProfileDto getSellerProfile(User seller) {
        Long sellerId = seller.getId();
        long totalListings = productRepository.countBySellerId(sellerId);
        long activeListings = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.ACTIVE);
        long soldListings = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.SOLD);
        long totalSalesCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);

        BigDecimal totalTurnover = orderRepository.sumSellerCompletedTurnover(sellerId);
        if (totalTurnover == null) totalTurnover = BigDecimal.ZERO;

        Double averageRating = reviewRepository.calculateAverageRating(sellerId);
        if (averageRating == null) averageRating = 5.0;
        long reviewCount = reviewRepository.countByTargetUserId(sellerId);

        return SellerProfileDto.builder()
                .id(seller.getId())
                .firstName(seller.getFirstName())
                .lastName(seller.getLastName())
                .fullName(seller.getFullName())
                .phone(seller.getPhone())
                .email(seller.getEmail())
                .countryCode(seller.getCountry() != null ? seller.getCountry().getCode() : "SN")
                .countryName(seller.getCountry() != null ? seller.getCountry().getName() : "Sénégal")
                .city(seller.getCity())
                .address(seller.getAddress())
                .profilePicture(seller.getProfilePicture())
                .isSuspended(Boolean.TRUE.equals(seller.getIsSuspended()))
                .isVerified(Boolean.TRUE.equals(seller.getIsVerified()))
                .memberSince(seller.getCreatedAt())
                .totalListings(totalListings)
                .activeListings(activeListings)
                .soldListings(soldListings)
                .totalSalesCount(totalSalesCount)
                .totalTurnover(totalTurnover)
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .build();
    }

    @Transactional
    public SellerProfileDto updateSellerProfile(User seller, UpdateSellerProfileRequest request) {
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            seller.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            seller.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null) {
            seller.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getCity() != null) {
            seller.setCity(request.getCity().trim());
        }
        if (request.getAddress() != null) {
            seller.setAddress(request.getAddress().trim());
        }
        if (request.getProfilePicture() != null) {
            seller.setProfilePicture(request.getProfilePicture());
        }

        userRepository.save(seller);
        return getSellerProfile(seller);
    }

    // ==========================================
    // 2. TABLEAU DE BORD VENDEUR (DASHBOARD)
    // ==========================================
    public SellerDashboardDto getSellerDashboard(User seller) {
        return getSellerDashboard(seller, "30d", null, null);
    }

    public SellerDashboardDto getSellerDashboard(User seller, String period, java.time.LocalDate from, java.time.LocalDate to) {
        Long sellerId = seller.getId();
        String cleanPeriod = (period == null || period.isBlank()) ? "30d" : period.toLowerCase().trim();
        String cacheKey = sellerId + "_" + cleanPeriod + "_" + (from != null ? from.toString() : "") + "_" + (to != null ? to.toString() : "");

        long nowMillis = System.currentTimeMillis();
        SellerDashboardCacheEntry cached = sellerDashboardCache.get(cacheKey);
        if (cached != null && cached.expiresAt > nowMillis) {
            return cached.data;
        }

        java.time.ZoneId dakarZone = java.time.ZoneId.of("Africa/Dakar");
        java.time.ZonedDateTime nowZoned = java.time.ZonedDateTime.now(dakarZone);

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
            java.time.LocalDate firstOfMonth = nowZoned.toLocalDate().withDayOfMonth(1);
            currentStart = firstOfMonth.atStartOfDay();
            daysCount = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(firstOfMonth, nowZoned.toLocalDate()) + 1);
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(daysCount);
        } else if ("custom".equals(cleanPeriod) && from != null && to != null) {
            if (from.isAfter(to)) {
                java.time.LocalDate tmp = from; from = to; to = tmp;
            }
            currentStart = from.atStartOfDay();
            currentEnd = to.atTime(23, 59, 59);
            daysCount = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1);
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(daysCount);
        } else {
            cleanPeriod = "30d";
            daysCount = 30;
            currentStart = nowZoned.minusDays(29).toLocalDate().atStartOfDay();
            previousEnd = currentStart.minusSeconds(1);
            previousStart = currentStart.minusDays(30);
        }

        // Taux plateforme (PlatformSetting)
        PlatformSetting settings = platformSettingRepository.findFirstByOrderByIdAsc().orElse(null);
        BigDecimal commissionRate = settings != null && settings.getCommissionRate() != null ? settings.getCommissionRate() : BigDecimal.valueOf(20.0);
        BigDecimal validationFeeRate = settings != null && settings.getValidationFeeRate() != null ? settings.getValidationFeeRate() : BigDecimal.valueOf(1.0);
        boolean demoMode = settings != null && Boolean.TRUE.equals(settings.getDemoMode());

        // Format label "Vendeur depuis [mois année]"
        String sellerSinceLabel = "Vendeur récemment";
        if (seller.getCreatedAt() != null) {
            java.time.format.DateTimeFormatter monthYearFmt = java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);
            sellerSinceLabel = "Vendeur depuis " + seller.getCreatedAt().format(monthYearFmt);
        }

        // 1. Annonces
        long totalProducts = productRepository.countBySellerId(sellerId);
        long activeProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.ACTIVE);
        long soldProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.SOLD);
        long inactiveProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.INACTIVE);
        long draftProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.DRAFT);
        long disabledProducts = productRepository.countBySellerIdAndDeactivationReasonIsNotNull(sellerId);

        long currentNewProducts = productRepository.countBySellerIdAndCreatedAtBetween(sellerId, currentStart, currentEnd);
        long prevNewProducts = productRepository.countBySellerIdAndCreatedAtBetween(sellerId, previousStart, previousEnd);
        Double listingsChange = calculatePercentageChange(currentNewProducts, prevNewProducts);

        SellerDashboardDto.MetricWithChangeDto listingsMetric = SellerDashboardDto.MetricWithChangeDto.builder()
                .value(BigDecimal.valueOf(totalProducts))
                .previousValue(BigDecimal.valueOf(Math.max(0, totalProducts - currentNewProducts + prevNewProducts)))
                .changePercentage(listingsChange)
                .count(totalProducts)
                .activeCount(activeProducts)
                .soldCount(soldProducts)
                .inactiveCount(inactiveProducts)
                .draftCount(draftProducts)
                .disabledCount(disabledProducts)
                .build();

        // 2. Commandes de la période et précédente
        List<Order> currentOrders = orderRepository.findBySellerIdAndCreatedAtBetween(sellerId, currentStart, currentEnd);
        List<Order> previousOrders = orderRepository.findBySellerIdAndCreatedAtBetween(sellerId, previousStart, previousEnd);

        // Map commandes par statut
        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (OrderStatus st : OrderStatus.values()) {
            ordersByStatus.put(st.name(), 0L);
        }
        for (Order o : currentOrders) {
            ordersByStatus.put(o.getStatus().name(), ordersByStatus.getOrDefault(o.getStatus().name(), 0L) + 1);
        }

        long ordersPendingPayment = ordersByStatus.getOrDefault(OrderStatus.PENDING_PAYMENT.name(), 0L);
        long ordersPaidToPrepare = ordersByStatus.getOrDefault(OrderStatus.PAID_ESCROW_LOCKED.name(), 0L);
        long ordersShipped = ordersByStatus.getOrDefault(OrderStatus.SHIPPED.name(), 0L);
        long ordersDelivered = ordersByStatus.getOrDefault(OrderStatus.DELIVERED.name(), 0L);
        long ordersCompleted = ordersByStatus.getOrDefault(OrderStatus.COMPLETED.name(), 0L);
        long ordersCancelled = ordersByStatus.getOrDefault(OrderStatus.CANCELLED.name(), 0L);
        long ordersExpired = ordersByStatus.getOrDefault(OrderStatus.EXPIRED.name(), 0L);
        long ordersDisputed = ordersByStatus.getOrDefault(OrderStatus.DISPUTED.name(), 0L);

        long totalOrdersInPeriod = currentOrders.size();
        long prevOrdersInPeriod = previousOrders.size();
        Double ordersChange = calculatePercentageChange(totalOrdersInPeriod, prevOrdersInPeriod);

        SellerDashboardDto.MetricWithChangeDto ordersMetric = SellerDashboardDto.MetricWithChangeDto.builder()
                .value(BigDecimal.valueOf(totalOrdersInPeriod))
                .previousValue(BigDecimal.valueOf(prevOrdersInPeriod))
                .changePercentage(ordersChange)
                .count(totalOrdersInPeriod)
                .build();

        // 3. Chiffre d'affaires (somme des prix convenus des commandes payées)
        BigDecimal currentTurnover = currentOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getAgreedPrice() != null ? o.getAgreedPrice() : (o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousTurnover = previousOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getAgreedPrice() != null ? o.getAgreedPrice() : (o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double turnoverChange = calculatePercentageChange(currentTurnover, previousTurnover);

        // 4. Gains en attente (net vendeur sur fonds LOCKED: PAID_ESCROW_LOCKED, SHIPPED, DELIVERED, DISPUTED)
        BigDecimal currentPendingEscrow = currentOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID_ESCROW_LOCKED || o.getStatus() == OrderStatus.SHIPPED || o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.DISPUTED)
                .map(o -> o.getSellerPayout() != null ? o.getSellerPayout() : (o.getAgreedPrice() != null ? o.getAgreedPrice().multiply(BigDecimal.valueOf(100).subtract(commissionRate)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousPendingEscrow = previousOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID_ESCROW_LOCKED || o.getStatus() == OrderStatus.SHIPPED || o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.DISPUTED)
                .map(o -> o.getSellerPayout() != null ? o.getSellerPayout() : (o.getAgreedPrice() != null ? o.getAgreedPrice().multiply(BigDecimal.valueOf(100).subtract(commissionRate)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double pendingEscrowChange = calculatePercentageChange(currentPendingEscrow, previousPendingEscrow);

        // 5. Gains libérés (net vendeur sur commandes COMPLETED)
        BigDecimal currentReleasedEarnings = currentOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(o -> o.getSellerPayout() != null ? o.getSellerPayout() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousReleasedEarnings = previousOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(o -> o.getSellerPayout() != null ? o.getSellerPayout() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double releasedEarningsChange = calculatePercentageChange(currentReleasedEarnings, previousReleasedEarnings);

        // 6. Commission plateforme prélevée
        BigDecimal currentPlatformCommission = currentOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getPlatformCommission() != null ? o.getPlatformCommission() : (o.getAgreedPrice() != null ? o.getAgreedPrice().multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousPlatformCommission = previousOrders.stream()
                .filter(o -> isPaidStatus(o.getStatus()))
                .map(o -> o.getPlatformCommission() != null ? o.getPlatformCommission() : (o.getAgreedPrice() != null ? o.getAgreedPrice().multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double platformCommissionChange = calculatePercentageChange(currentPlatformCommission, previousPlatformCommission);

        // 7. Panier moyen
        long currentPaidOrdersCount = currentOrders.stream().filter(o -> isPaidStatus(o.getStatus())).count();
        long previousPaidOrdersCount = previousOrders.stream().filter(o -> isPaidStatus(o.getStatus())).count();

        BigDecimal currentAvgBasket = currentPaidOrdersCount > 0
                ? currentTurnover.divide(BigDecimal.valueOf(currentPaidOrdersCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal previousAvgBasket = previousPaidOrdersCount > 0
                ? previousTurnover.divide(BigDecimal.valueOf(previousPaidOrdersCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Double avgBasketChange = calculatePercentageChange(currentAvgBasket, previousAvgBasket);

        // 8. Offres et taux d'acceptation
        long currentOffersTotal = chatOfferRepository.countBySellerIdAndCreatedAtBetween(sellerId, currentStart, currentEnd);
        long prevOffersTotal = chatOfferRepository.countBySellerIdAndCreatedAtBetween(sellerId, previousStart, previousEnd);

        long currentAcceptedOffers = chatOfferRepository.countBySellerIdAndStatusAndCreatedAtBetween(sellerId, OfferStatus.OFFER_ACCEPTED, currentStart, currentEnd);
        long prevAcceptedOffers = chatOfferRepository.countBySellerIdAndStatusAndCreatedAtBetween(sellerId, OfferStatus.OFFER_ACCEPTED, previousStart, previousEnd);

        double currentAcceptanceRate = currentOffersTotal > 0 ? (currentAcceptedOffers * 100.0 / currentOffersTotal) : 0.0;
        double prevAcceptanceRate = prevOffersTotal > 0 ? (prevAcceptedOffers * 100.0 / prevOffersTotal) : 0.0;
        Double acceptanceRateChange = calculatePercentageChange(BigDecimal.valueOf(currentAcceptanceRate), BigDecimal.valueOf(prevAcceptanceRate));

        // 9. Avis & note vendeur (si 0 avis -> afficher "Pas encore d'avis" et avgRating null)
        long totalReviews = reviewRepository.countByTargetUserId(sellerId);
        Double avgRatingRaw = reviewRepository.calculateAverageRating(sellerId);
        Double avgRating = (totalReviews > 0 && avgRatingRaw != null) ? Math.round(avgRatingRaw * 10.0) / 10.0 : null;
        String displayRating = (totalReviews > 0 && avgRating != null) ? String.format(Locale.US, "%.1f", avgRating) : "Pas encore d'avis";

        Map<Integer, Long> ratingDistribution = new LinkedHashMap<>();
        for (int stars = 5; stars >= 1; stars--) {
            ratingDistribution.put(stars, reviewRepository.countByTargetUserIdAndRating(sellerId, stars));
        }

        SellerDashboardDto.SellerRatingDto ratingDto = SellerDashboardDto.SellerRatingDto.builder()
                .averageRating(avgRating)
                .totalReviews(totalReviews)
                .hasReviews(totalReviews > 0)
                .displayRating(displayRating)
                .distribution(ratingDistribution)
                .build();

        // 10. Messages non lus
        long unreadConversations = messageRepository.countConversationsWithUnreadForUser(sellerId);
        long unreadMessages = messageRepository.countTotalUnreadForUser(sellerId);

        // 11. Bandeau « À faire »
        long ordersToPrepareCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PAID_ESCROW_LOCKED);
        long pendingOffersCount = chatOfferRepository.countBySellerIdAndStatus(sellerId, OfferStatus.OFFER_SENT);
        long disputedOrdersCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.DISPUTED);
        long disabledListingsCount = disabledProducts;

        long totalToHandle = ordersToPrepareCount + pendingOffersCount + unreadConversations + disputedOrdersCount + disabledListingsCount;

        // Détails des annonces désactivées par l'admin avec motif
        List<SellerDashboardDto.DisabledListingSummaryDto> disabledListingsDetails = productRepository
                .findBySellerIdAndDeactivationReasonIsNotNullOrderByUpdatedAtDesc(sellerId).stream()
                .limit(5)
                .map(p -> SellerDashboardDto.DisabledListingSummaryDto.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .deactivationReason(p.getDeactivationReason())
                        .price(p.getPrice())
                        .primaryImage(p.getPrimaryImageUrl())
                        .build())
                .collect(Collectors.toList());

        // Détails des offres en attente avec temps restant
        LocalDateTime nowUtc = LocalDateTime.now();
        List<SellerDashboardDto.PendingOfferSummaryDto> pendingOffersDetails = chatOfferRepository
                .findPendingOffersExpiringSoonest(sellerId, nowUtc, PageRequest.of(0, 5)).stream()
                .map(o -> {
                    long hoursLeft = java.time.Duration.between(nowUtc, o.getExpiresAt()).toHours();
                    long minsLeft = java.time.Duration.between(nowUtc, o.getExpiresAt()).toMinutes() % 60;
                    String remaining = hoursLeft > 0 ? "Expire dans " + hoursLeft + " h" : "Expire dans " + Math.max(1, minsLeft) + " min";
                    return SellerDashboardDto.PendingOfferSummaryDto.builder()
                            .id(o.getId())
                            .productId(o.getProduct().getId())
                            .productTitle(o.getProduct().getTitle())
                            .buyerName(o.getBuyer().getFullName())
                            .agreedPrice(o.getAgreedPrice())
                            .expiresAt(o.getExpiresAt())
                            .remainingTimeLabel(remaining)
                            .build();
                })
                .collect(Collectors.toList());

        SellerDashboardDto.SellerActionItemsDto actionItems = SellerDashboardDto.SellerActionItemsDto.builder()
                .ordersToPrepare(ordersToPrepareCount)
                .pendingOffers(pendingOffersCount)
                .unreadConversations(unreadConversations)
                .disputedOrders(disputedOrdersCount)
                .disabledListings(disabledListingsCount)
                .totalToHandle(totalToHandle)
                .hasItemsToHandle(totalToHandle > 0)
                .disabledListingsDetails(disabledListingsDetails)
                .pendingOffersDetails(pendingOffersDetails)
                .build();

        // 12. Tendance des ventes par jour / semaine
        List<SalesTrendDto> salesTrends = new ArrayList<>();
        List<BigDecimal> revenueSparkline = new ArrayList<>();
        List<BigDecimal> ordersSparkline = new ArrayList<>();

        if (daysCount <= 31) {
            java.time.LocalDate cursor = currentStart.toLocalDate();
            java.time.LocalDate endDay = currentEnd.toLocalDate();
            java.time.format.DateTimeFormatter dakarDayFmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM");

            while (!cursor.isAfter(endDay)) {
                final java.time.LocalDate targetDay = cursor;
                List<Order> dayOrders = currentOrders.stream()
                        .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().isEqual(targetDay) && isPaidStatus(o.getStatus()))
                        .toList();

                BigDecimal dayAmount = dayOrders.stream()
                        .map(o -> o.getAgreedPrice() != null ? o.getAgreedPrice() : (o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount()))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                int dayOrderCount = dayOrders.size();
                salesTrends.add(new SalesTrendDto(targetDay.format(dakarDayFmt), dayAmount, dayOrderCount));
                revenueSparkline.add(dayAmount);
                ordersSparkline.add(BigDecimal.valueOf(dayOrderCount));

                cursor = cursor.plusDays(1);
            }
        } else {
            java.time.LocalDate cursor = currentStart.toLocalDate();
            java.time.LocalDate endDay = currentEnd.toLocalDate();
            java.time.format.DateTimeFormatter dakarDayFmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
            int weekIndex = 1;

            while (!cursor.isAfter(endDay)) {
                java.time.LocalDate weekEnd = cursor.plusDays(6).isAfter(endDay) ? endDay : cursor.plusDays(6);
                final java.time.LocalDate wStart = cursor;
                final java.time.LocalDate wEnd = weekEnd;

                List<Order> weekOrders = currentOrders.stream()
                        .filter(o -> o.getCreatedAt() != null)
                        .filter(o -> {
                            java.time.LocalDate d = o.getCreatedAt().toLocalDate();
                            return !d.isBefore(wStart) && !d.isAfter(wEnd) && isPaidStatus(o.getStatus());
                        })
                        .toList();

                BigDecimal weekAmount = weekOrders.stream()
                        .map(o -> o.getAgreedPrice() != null ? o.getAgreedPrice() : (o.getItemPrice() != null ? o.getItemPrice() : o.getTotalAmount()))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                int weekOrderCount = weekOrders.size();
                String label = "S" + weekIndex + " (" + cursor.format(dakarDayFmt) + ")";
                salesTrends.add(new SalesTrendDto(label, weekAmount, weekOrderCount));
                revenueSparkline.add(weekAmount);
                ordersSparkline.add(BigDecimal.valueOf(weekOrderCount));

                cursor = weekEnd.plusDays(1);
                weekIndex++;
            }
        }

        // 13. Entonnoir des commandes
        List<OrderFunnelStepDto> orderFunnel = new ArrayList<>();
        orderFunnel.add(new OrderFunnelStepDto("PENDING_PAYMENT", "En attente paiement", ordersPendingPayment, 0));
        orderFunnel.add(new OrderFunnelStepDto("PAID_ESCROW_LOCKED", "Payées à préparer", ordersPaidToPrepare, 0));
        orderFunnel.add(new OrderFunnelStepDto("SHIPPED", "Expédiées", ordersShipped, 0));
        orderFunnel.add(new OrderFunnelStepDto("DELIVERED", "Livrées", ordersDelivered, 0));
        orderFunnel.add(new OrderFunnelStepDto("COMPLETED", "Clôturées", ordersCompleted, 0));
        orderFunnel.add(new OrderFunnelStepDto("DISPUTED", "En litige", ordersDisputed, 0));
        orderFunnel.add(new OrderFunnelStepDto("CANCELLED", "Annulées / Expirées", ordersCancelled + ordersExpired, 0));

        // 14. Meilleures annonces (Top 5 par ventes)
        List<SellerDashboardDto.SellerTopProductDto> topProducts = new ArrayList<>();
        List<Object[]> topProductRows = orderRepository.findSellerTopProducts(sellerId, PageRequest.of(0, 5));
        if (topProductRows != null && !topProductRows.isEmpty()) {
            for (Object[] row : topProductRows) {
                Long pId = ((Number) row[0]).longValue();
                String pTitle = (String) row[1];
                long pSalesCount = ((Number) row[2]).longValue();
                BigDecimal pRevenue = (BigDecimal) row[3];
                Product p = productRepository.findById(pId).orElse(null);
                topProducts.add(SellerDashboardDto.SellerTopProductDto.builder()
                        .id(pId)
                        .title(pTitle)
                        .primaryImage(p != null ? p.getPrimaryImageUrl() : null)
                        .price(p != null ? p.getPrice() : pRevenue)
                        .salesCount(pSalesCount)
                        .totalRevenue(pRevenue)
                        .build());
            }
        } else {
            // Fallback: 5 annonces actives les plus vues
            topProducts = productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                    .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                    .sorted((a, b) -> Integer.compare(b.getViewCount(), a.getViewCount()))
                    .limit(5)
                    .map(p -> SellerDashboardDto.SellerTopProductDto.builder()
                            .id(p.getId())
                            .title(p.getTitle())
                            .primaryImage(p.getPrimaryImageUrl())
                            .price(p.getPrice())
                            .salesCount(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .build())
                    .collect(Collectors.toList());
        }

        // 15. Annonces stagnantes (les moins consultées ou les plus anciennes sans vente)
        List<SellerDashboardDto.SellerStagnantProductDto> stagnantProducts = productRepository
                .findBySellerIdAndStatusOrderByViewCountAscCreatedAtAsc(sellerId, ProductStatus.ACTIVE, PageRequest.of(0, 5)).stream()
                .map(p -> {
                    long daysSinceCreation = p.getCreatedAt() != null ? java.time.temporal.ChronoUnit.DAYS.between(p.getCreatedAt(), LocalDateTime.now()) : 0;
                    String suggestion = daysSinceCreation >= 30
                            ? "Créée il y a " + daysSinceCreation + " j sans vente : pensez à baisser le prix de 5 à 10%."
                            : (p.getViewCount() < 5 ? "Peu de vues : ajoutez des photos de détail ou améliorez la description." : "Partagez l'annonce pour booster la visibilité.");
                    return SellerDashboardDto.SellerStagnantProductDto.builder()
                            .id(p.getId())
                            .title(p.getTitle())
                            .primaryImage(p.getPrimaryImageUrl())
                            .price(p.getPrice())
                            .viewCount(p.getViewCount() != null ? p.getViewCount() : 0)
                            .createdAt(p.getCreatedAt())
                            .daysSinceCreation(daysSinceCreation)
                            .suggestion(suggestion)
                            .build();
                })
                .collect(Collectors.toList());

        // 16. Listes courtes (5 max)
        List<OrderDto> ordersToPrepareList = orderRepository
                .findBySellerIdAndStatusOrderByCreatedAtDesc(sellerId, OrderStatus.PAID_ESCROW_LOCKED, PageRequest.of(0, 5)).stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());

        List<ChatOfferDto> activeOffersList = chatOfferRepository
                .findBySellerIdAndStatusOrderByCreatedAtDesc(sellerId, OfferStatus.OFFER_SENT, PageRequest.of(0, 5)).stream()
                .map(ChatOfferDto::fromEntity)
                .collect(Collectors.toList());

        List<ReviewDto> recentReviewsList = reviewRepository
                .findByTargetUserIdOrderByCreatedAtDesc(sellerId, PageRequest.of(0, 5)).getContent().stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());

        List<NotificationDto> recentNotificationsList = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(sellerId, PageRequest.of(0, 5)).getContent().stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());

        // 17. Conseils contextuels (règles simples, sans IA)
        List<SellerDashboardDto.SellerTipDto> contextualTips = new ArrayList<>();
        List<Product> singleImgProds = productRepository.findSingleImageProducts(sellerId);
        if (!singleImgProds.isEmpty()) {
            contextualTips.add(SellerDashboardDto.SellerTipDto.builder()
                    .id("tip-photos")
                    .type("SUGGESTION")
                    .title("Photos à enrichir")
                    .message("Vous avez " + singleImgProds.size() + " annonce(s) avec une seule photo. Les annonces avec au moins 2 photos se vendent 3x plus vite !")
                    .actionTab("listings")
                    .actionFilter("ACTIVE")
                    .build());
        }

        List<ChatOffer> expiringOffers = chatOfferRepository.findPendingOffersExpiringSoonest(sellerId, nowUtc, PageRequest.of(0, 1));
        if (!expiringOffers.isEmpty()) {
            ChatOffer exp = expiringOffers.get(0);
            long hours = java.time.Duration.between(nowUtc, exp.getExpiresAt()).toHours();
            if (hours <= 2) {
                contextualTips.add(SellerDashboardDto.SellerTipDto.builder()
                        .id("tip-offer-expiry")
                        .type("WARNING")
                        .title("Offre expirant bientôt")
                        .message("Une offre de " + exp.getAgreedPrice() + " FCFA sur '" + exp.getProduct().getTitle() + "' expire dans moins de 2 h !")
                        .actionTab("orders")
                        .actionFilter("offers")
                        .build());
            }
        }

        List<Product> olderActive = productRepository.findOlderActiveProducts(sellerId, LocalDateTime.now().minusDays(30));
        if (!olderActive.isEmpty()) {
            contextualTips.add(SellerDashboardDto.SellerTipDto.builder()
                    .id("tip-price-drop")
                    .type("INFO")
                    .title("Annonces anciennes")
                    .message(olderActive.size() + " annonce(s) sans vente depuis plus de 30 jours : pensez à baisser le prix de 5 à 10% pour attirer des acheteurs.")
                    .actionTab("listings")
                    .actionFilter("ACTIVE")
                    .build());
        }

        // Assemblage final du DTO
        SellerDashboardDto dto = SellerDashboardDto.builder()
                .sellerId(sellerId)
                .sellerName(seller.getFullName())
                .sellerFirstName(seller.getFirstName())
                .sellerPhone(seller.getPhone())
                .sellerCity(seller.getCity())
                .isSuspended(Boolean.TRUE.equals(seller.getIsSuspended()))
                .memberSince(seller.getCreatedAt())
                .sellerSinceLabel(sellerSinceLabel)
                .period(cleanPeriod)
                .startDate(currentStart.toLocalDate().toString())
                .endDate(currentEnd.toLocalDate().toString())
                .lastUpdated(java.time.ZonedDateTime.now(dakarZone).format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .demoMode(demoMode)
                .currency("FCFA")
                .commissionRate(commissionRate)
                .validationFeeRate(validationFeeRate)
                .actionItems(actionItems)
                .listings(listingsMetric)
                .orders(ordersMetric)
                .turnover(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(currentTurnover)
                        .previousValue(previousTurnover)
                        .changePercentage(turnoverChange)
                        .sparkline(revenueSparkline)
                        .build())
                .pendingEscrow(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(currentPendingEscrow)
                        .previousValue(previousPendingEscrow)
                        .changePercentage(pendingEscrowChange)
                        .build())
                .releasedEarnings(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(currentReleasedEarnings)
                        .previousValue(previousReleasedEarnings)
                        .changePercentage(releasedEarningsChange)
                        .build())
                .platformCommission(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(currentPlatformCommission)
                        .previousValue(previousPlatformCommission)
                        .changePercentage(platformCommissionChange)
                        .build())
                .offerAcceptanceRate(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(BigDecimal.valueOf(currentAcceptanceRate).setScale(1, RoundingMode.HALF_UP))
                        .previousValue(BigDecimal.valueOf(prevAcceptanceRate).setScale(1, RoundingMode.HALF_UP))
                        .changePercentage(acceptanceRateChange)
                        .build())
                .averageBasket(SellerDashboardDto.MetricWithChangeDto.builder()
                        .value(currentAvgBasket)
                        .previousValue(previousAvgBasket)
                        .changePercentage(avgBasketChange)
                        .build())
                .rating(ratingDto)
                .unreadConversationsCount(unreadConversations)
                .salesTrends(salesTrends)
                .orderFunnel(orderFunnel)
                .topProducts(topProducts)
                .stagnantProducts(stagnantProducts)
                .ratingDistribution(ratingDistribution)
                .ordersByStatus(ordersByStatus)
                .ordersToPrepare(ordersToPrepareList)
                .activeOffers(activeOffersList)
                .recentReviews(recentReviewsList)
                .recentNotifications(recentNotificationsList)
                .contextualTips(contextualTips)
                // Rétrocompatibilité legacy
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldProducts(soldProducts)
                .inactiveProducts(inactiveProducts)
                .draftProducts(draftProducts)
                .ordersToProcess(ordersToPrepareCount)
                .ordersInDelivery(ordersShipped + ordersDelivered)
                .completedOrders(ordersCompleted)
                .netEarnings(currentReleasedEarnings)
                .averageRating(avgRating != null ? avgRating : 5.0)
                .reviewCount(totalReviews)
                .unreadMessagesCount(unreadMessages)
                .recentOrders(ordersToPrepareList)
                .build();

        // Cache court 45s
        sellerDashboardCache.put(cacheKey, new SellerDashboardCacheEntry(dto, nowMillis + 45_000L));
        return dto;
    }

    private boolean isPaidStatus(OrderStatus status) {
        return status == OrderStatus.PAID_ESCROW_LOCKED ||
                status == OrderStatus.SHIPPED ||
                status == OrderStatus.DELIVERED ||
                status == OrderStatus.COMPLETED ||
                status == OrderStatus.DISPUTED;
    }

    private Double calculatePercentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            if (current == null || current.compareTo(BigDecimal.ZERO) == 0) return 0.0;
            return 100.0;
        }
        if (current == null) current = BigDecimal.ZERO;
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Double calculatePercentageChange(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0.0 : 100.0;
        }
        return Math.round(((double) (current - previous) / (double) previous) * 1000.0) / 10.0;
    }

    // ==========================================
    // 3. GESTION DES ANNONCES (AVEC VÉRIFICATION STRICTE DE PROPRIÉTÉ)
    // ==========================================
    public PageResponseDto<ProductDto> getSellerProducts(User seller, String query, ProductStatus status, Pageable pageable) {
        Page<Product> page = productRepository.searchSellerProducts(seller.getId(), query, status, pageable);
        List<ProductDto> dtos = page.getContent().stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public ProductDto getSellerProductById(User seller, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);
        return ProductDto.fromEntity(product);
    }

    @Transactional
    public ProductDto createProduct(User seller, SellerProductRequest request) {
        checkSellerNotSuspended(seller);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Rayon / Catégorie invalide"));

        Country country = seller.getCountry();
        if (request.getCountryCode() != null && !request.getCountryCode().isBlank()) {
            country = countryRepository.findByCode(request.getCountryCode()).orElse(country);
        }

        ProductStatus initialStatus = Boolean.TRUE.equals(request.getIsDraft()) ? ProductStatus.DRAFT : ProductStatus.ACTIVE;

        // Validation photos obligatoires pour publication active
        if (initialStatus == ProductStatus.ACTIVE && (request.getImages() == null || request.getImages().isEmpty())) {
            throw new IllegalArgumentException("Au moins une photo est requise pour publier une annonce active.");
        }

        Product product = Product.builder()
                .seller(seller)
                .category(category)
                .country(country)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .condition(request.getCondition())
                .brand(request.getBrand() != null ? request.getBrand().trim() : null)
                .size(request.getSize() != null ? request.getSize().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .defects(request.getDefects() != null ? request.getDefects().trim() : null)
                .measurements(request.getMeasurements() != null ? request.getMeasurements().trim() : null)
                .locationCity(request.getLocationCity() != null ? request.getLocationCity().trim() : seller.getCity())
                .status(initialStatus)
                .viewCount(0)
                .build();

        Product saved = productRepository.save(product);

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<ProductImage> imageEntities = new ArrayList<>();
            for (int i = 0; i < request.getImages().size(); i++) {
                String url = request.getImages().get(i);
                if (url != null && !url.isBlank()) {
                    imageEntities.add(ProductImage.builder()
                            .product(saved)
                            .imageUrl(url.trim())
                            .isPrimary(i == 0)
                            .displayOrder(i)
                            .build());
                }
            }
            productImageRepository.saveAll(imageEntities);
            saved.setImages(imageEntities);
        }

        log.info("Nouvelle annonce #{} créée par le vendeur {}", saved.getId(), seller.getPhone());
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public ProductDto updateProduct(User seller, Long productId, SellerProductRequest request) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        // RÈGLE MÉTIER : Impossible de modifier le prix d'une annonce ayant une commande en cours
        boolean hasActiveOrders = orderRepository.existsByProductIdAndStatusIn(productId,
                List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID_ESCROW_LOCKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
        if (hasActiveOrders && request.getPrice() != null && request.getPrice().compareTo(product.getPrice()) != 0) {
            throw new IllegalStateException("Impossible de modifier le prix d'une annonce faisant actuellement l'objet d'une commande en cours.");
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Catégorie invalide"));
            product.setCategory(category);
        }

        product.setTitle(request.getTitle().trim());
        product.setDescription(request.getDescription().trim());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        if (request.getCondition() != null) product.setCondition(request.getCondition());
        product.setBrand(request.getBrand());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setDefects(request.getDefects());
        product.setMeasurements(request.getMeasurements());
        if (request.getLocationCity() != null) product.setLocationCity(request.getLocationCity());

        if (Boolean.TRUE.equals(request.getIsDraft())) {
            product.setStatus(ProductStatus.DRAFT);
        } else if (product.getStatus() == ProductStatus.DRAFT) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        // Mise à jour des photos si fournies
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            productImageRepository.deleteByProductId(productId);
            List<ProductImage> imageEntities = new ArrayList<>();
            for (int i = 0; i < request.getImages().size(); i++) {
                String url = request.getImages().get(i);
                if (url != null && !url.isBlank()) {
                    imageEntities.add(ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isPrimary(i == 0)
                            .displayOrder(i)
                            .build());
                }
            }
            productImageRepository.saveAll(imageEntities);
            product.setImages(imageEntities);
        }

        return ProductDto.fromEntity(productRepository.save(product));
    }

    @Transactional
    public ProductDto toggleProductStatus(User seller, Long productId, ProductStatus newStatus) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        if (product.getStatus() == ProductStatus.SOLD) {
            throw new IllegalStateException("Une annonce vendue ne peut pas changer de statut manuellement.");
        }

        product.setStatus(newStatus);
        return ProductDto.fromEntity(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(User seller, Long productId) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        // RÈGLE MÉTIER : Impossible de supprimer une annonce ayant une commande en cours
        boolean hasActiveOrders = orderRepository.existsByProductIdAndStatusIn(productId,
                List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID_ESCROW_LOCKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
        if (hasActiveOrders) {
            throw new IllegalStateException("Action impossible : cette annonce est rattachée à une commande en cours de traitement.");
        }

        productImageRepository.deleteByProductId(productId);
        productRepository.delete(product);
        log.info("Annonce #{} supprimée par son vendeur {}", productId, seller.getPhone());
    }

    // ==========================================
    // 4. RÉCEPTION ET TRAITEMENT DES COMMANDES
    // ==========================================
    public PageResponseDto<OrderDto> getSellerOrders(User seller, String query, OrderStatus status, Pageable pageable) {
        Page<Order> page = orderRepository.searchSellerOrdersPage(seller.getId(), query, status, pageable);
        List<OrderDto> dtos = page.getContent().stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public OrderDto getSellerOrderById(User seller, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);
        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto acceptOrder(User seller, Long orderId) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        if (order.getStatus() != OrderStatus.PAID_ESCROW_LOCKED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("La commande n'est pas dans un état permettant son acceptation.");
        }

        // Notification à l'acheteur
        createNotification(order.getBuyer(),
                "Commande acceptée !",
                "Le vendeur a accepté votre commande " + order.getOrderNumber() + ". Préparation en cours.",
                NotificationType.ORDER_CREATED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto refuseOrder(User seller, Long orderId, String reason) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Impossible d'annuler une commande déjà livrée ou finalisée.");
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Remettre les annonces disponibles
        if (order.getProduct() != null) {
            order.getProduct().setStatus(ProductStatus.ACTIVE);
            productRepository.save(order.getProduct());
        }
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem orderItem : order.getItems()) {
                if (orderItem.getProduct() != null) {
                    orderItem.getProduct().setStatus(ProductStatus.ACTIVE);
                    productRepository.save(orderItem.getProduct());
                }
            }
        }

        // Annuler le paiement associé (Remboursement acheteur)
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setEscrowStatus(EscrowStatus.REFUNDED_TO_BUYER);
            paymentRepository.save(payment);
        }

        // Notification à l'acheteur
        createNotification(order.getBuyer(),
                "Commande refusée",
                "Le vendeur a annulé la commande " + order.getOrderNumber() + (reason != null ? " : " + reason : "") + ". Vos fonds vous seront remboursés.",
                NotificationType.ORDER_CREATED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(orderRepository.save(order));
    }

    @Transactional
    public OrderDto markReadyForPickup(User seller, Long orderId) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        // Le vendeur fait progresser : PENDING → PICKED_UP
        order.setDeliveryStatus(DeliveryStatus.PICKED_UP);
        order.setStatus(OrderStatus.SHIPPED);

        createNotification(order.getBuyer(),
                "Colis pris en charge !",
                "Votre article pour la commande " + order.getOrderNumber() + " a été remis au transporteur.",
                NotificationType.DELIVERY_STATUS_CHANGED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(orderRepository.save(order));
    }

    // ==========================================
    // 5. TRANSACTIONS ET GAINS (AVEC DÉCOMPOSITION COMPLÈTE)
    // ==========================================
    public PageResponseDto<SellerTransactionDto> getSellerTransactions(User seller, Pageable pageable) {
        Page<Payment> payments = paymentRepository.findBySellerId(seller.getId(), pageable);
        List<SellerTransactionDto> dtos = payments.getContent().stream()
                .map(this::mapToSellerTransactionDto)
                .collect(Collectors.toList());
        return PageResponseDto.of(payments, dtos);
    }

    public SellerTransactionSummaryDto getSellerTransactionSummary(User seller) {
        Long sellerId = seller.getId();
        BigDecimal gross = orderRepository.sumSellerCompletedTurnover(sellerId);
        if (gross == null) gross = BigDecimal.ZERO;

        BigDecimal comm = orderRepository.sumSellerCommissionPaid(sellerId);
        if (comm == null) comm = BigDecimal.ZERO;

        BigDecimal net = orderRepository.sumSellerCompletedPayout(sellerId);
        if (net == null) net = BigDecimal.ZERO;

        BigDecimal pending = orderRepository.sumSellerPendingEscrow(sellerId);
        if (pending == null) pending = BigDecimal.ZERO;

        long total = paymentRepository.findBySellerId(sellerId, PageRequest.of(0, 1)).getTotalElements();
        long locked = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PAID_ESCROW_LOCKED) +
                      orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.SHIPPED) +
                      orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.DELIVERED);
        long released = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);

        return SellerTransactionSummaryDto.builder()
                .totalGrossSales(gross)
                .totalCommissionPaid(comm)
                .totalNetPaid(net)
                .pendingEscrow(pending)
                .totalTransactionsCount(total)
                .lockedTransactionsCount(locked)
                .releasedTransactionsCount(released)
                .build();
    }

    private SellerTransactionDto mapToSellerTransactionDto(Payment p) {
        Order order = p.getOrder();
        String title = (order != null && order.getProduct() != null) ? order.getProduct().getTitle() : "Article vendu";
        String img = (order != null && order.getProduct() != null) ? order.getProduct().getPrimaryImageUrl() : null;

        BigDecimal itemPrice = order != null ? order.getItemPrice() : p.getAmount();
        BigDecimal valFee = order != null ? order.getValidationFee() : BigDecimal.ZERO;
        BigDecimal delFee = order != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        BigDecimal comm = order != null ? order.getPlatformCommission() : BigDecimal.ZERO;
        BigDecimal payout = order != null ? order.getSellerPayout() : p.getAmount();

        return SellerTransactionDto.builder()
                .id(p.getId())
                .transactionReference(p.getTransactionReference())
                .orderNumber(order != null ? order.getOrderNumber() : "N/A")
                .orderId(order != null ? order.getId() : null)
                .productTitle(title)
                .productImage(img)
                .itemPrice(itemPrice)
                .validationFee(valFee)
                .deliveryFee(delFee)
                .platformCommission(comm)
                .sellerPayout(payout)
                .paymentMethod(p.getPaymentMethod().name())
                .paymentMethodName(p.getPaymentMethod().getDisplayName())
                .paymentStatus(p.getStatus().name())
                .escrowStatus(p.getEscrowStatus() != null ? p.getEscrowStatus().name() : "LOCKED")
                .createdAt(p.getCreatedAt())
                .releasedAt(p.getEscrowReleasedDate())
                .build();
    }

    // ==========================================
    // 6. ÉVALUATIONS ET SIGNALEMENTS D'AVIS
    // ==========================================
    public PageResponseDto<ReviewDto> getSellerReviews(User seller, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(seller.getId(), pageable);
        List<ReviewDto> dtos = reviews.getContent().stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(reviews, dtos);
    }

    @Transactional
    public void reportReview(User seller, Long reviewId, ReportReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NoSuchElementException("Évaluation introuvable"));

        // Seul le vendeur visé par l'avis peut le signaler comme abusif
        if (!review.getTargetUser().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Vous ne pouvez signaler que les avis laissés sur votre propre profil.");
        }

        Report report = Report.builder()
                .reporter(seller)
                .reportedUser(review.getReviewer())
                .reason(ReportReason.ABUSIVE_BEHAVIOR)
                .details("Signalement d'avis abusif (Avis #" + review.getId() + ") : " +
                        request.getReason() + " - Note : " + review.getRating() + "/5 - Commentaire : \"" + review.getComment() + "\". " +
                        (request.getDetails() != null ? "Détails : " + request.getDetails() : ""))
                .status(ReportStatus.PENDING)
                .build();

        reportRepository.save(report);
        log.info("Avis #{} signalé par le vendeur {} pour abus", reviewId, seller.getPhone());
    }

    // ==========================================
    // 7. MESSAGERIE ACHETEUR-VENDEUR EN TEMPS RÉEL (STOMP)
    // ==========================================
    public List<ConversationSummaryDto> getSellerConversations(User seller) {
        List<Conversation> convs = conversationRepository.findByUser(seller.getId());
        return convs.stream().map(c -> {
            boolean isSellerInConv = c.getSeller().getId().equals(seller.getId());
            User otherUser = isSellerInConv ? c.getBuyer() : c.getSeller();
            long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), seller.getId());

            return ConversationSummaryDto.builder()
                    .id(c.getId())
                    .productId(c.getProduct() != null ? c.getProduct().getId() : null)
                    .productTitle(c.getProduct() != null ? c.getProduct().getTitle() : "Annonce")
                    .productImage(c.getProduct() != null ? c.getProduct().getPrimaryImageUrl() : null)
                    .productPrice(c.getProduct() != null ? c.getProduct().getPrice() : null)
                    .otherUserId(otherUser.getId())
                    .otherUserName(otherUser.getFullName())
                    .otherUserPhone(otherUser.getPhone())
                    .otherUserProfilePicture(otherUser.getProfilePicture())
                    .lastMessagePreview(c.getLastMessagePreview())
                    .lastMessageAt(c.getLastMessageAt())
                    .unreadCount(unread)
                    .isOtherUserSeller(!isSellerInConv)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<ChatMessageDto> getConversationMessages(User user, Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation introuvable"));
        checkConversationParticipant(user, conv);

        // Marquer les messages entrants comme lus
        messageRepository.markAsReadForUser(conversationId, user.getId());

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        return messages.stream().map(m -> ChatMessageDto.builder()
                .id(m.getId())
                .conversationId(conversationId)
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .sentAt(m.getSentAt())
                .isMe(m.getSender().getId().equals(user.getId()))
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(User sender, Long conversationId, String content) {
        checkSellerNotSuspended(sender);
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation introuvable"));
        checkConversationParticipant(sender, conv);

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(content.trim())
                .isRead(false)
                .build();
        Message saved = messageRepository.save(message);

        // Mise à jour aperçu dans conversation
        conv.setLastMessagePreview(content.length() > 80 ? content.substring(0, 80) + "..." : content);
        conv.setLastMessageAt(saved.getSentAt());
        conversationRepository.save(conv);

        ChatMessageDto dto = ChatMessageDto.builder()
                .id(saved.getId())
                .conversationId(conversationId)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(saved.getContent())
                .isRead(false)
                .sentAt(saved.getSentAt())
                .isMe(true)
                .build();

        // Envoi en temps réel via WebSocket STOMP
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
            User recipient = conv.getBuyer().getId().equals(sender.getId()) ? conv.getSeller() : conv.getBuyer();
            messagingTemplate.convertAndSend("/topic/users/" + recipient.getId() + "/messages", dto);

            // Création d'une notification push
            createNotification(recipient,
                    "Nouveau message de " + sender.getFullName(),
                    content.length() > 100 ? content.substring(0, 100) + "..." : content,
                    NotificationType.NEW_MESSAGE,
                    "/messages?conversation=" + conversationId);
        } catch (Exception e) {
            log.warn("Impossible d'envoyer le message via WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    // ==========================================
    // 8. NOTIFICATIONS VENDEUR
    // ==========================================
    public PageResponseDto<NotificationDto> getUserNotifications(User user, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<NotificationDto> dtos = page.getContent().stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public long getUnreadNotificationsCount(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markNotificationAsRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification introuvable"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Accès non autorisé à cette notification.");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user.getId());
    }

    private void createNotification(User target, String title, String message, NotificationType type, String link) {
        if (target == null) return;
        Notification n = Notification.builder()
                .user(target)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    // ==========================================
    // GARDE-FOUS DE SÉCURITÉ ET PROPRIÉTÉ
    // ==========================================
    private void checkSellerNotSuspended(User seller) {
        if (Boolean.TRUE.equals(seller.getIsSuspended())) {
            throw new AccessDeniedException("Votre compte est actuellement suspendu par l'administration de ReVibe FliP.");
        }
    }

    private void checkProductOwnership(User seller, Product product) {
        if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Accès refusé : vous n'êtes pas le propriétaire de cette annonce.");
        }
    }

    private void checkOrderSellerOwnership(User seller, Order order) {
        if (order.getSeller() == null || !order.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Accès refusé : vous n'êtes pas le vendeur associé à cette commande.");
        }
    }

    private void checkConversationParticipant(User user, Conversation conversation) {
        boolean isBuyer = conversation.getBuyer() != null && conversation.getBuyer().getId().equals(user.getId());
        boolean isSeller = conversation.getSeller() != null && conversation.getSeller().getId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new AccessDeniedException("Accès refusé : vous ne participez pas à cette conversation.");
        }
    }
}
