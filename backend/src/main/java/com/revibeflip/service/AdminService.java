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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service d'administration générale de ReVibe FliP.
 *
 * NOTE SUR LE SÉQUESTRE (Point 8) :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire de paiement
 * (Wave/Orange Money/Free Money) et la validation du cadre juridique avant la production.
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

    // ==========================================
    // 2. DASHBOARD (VUE D'ENSEMBLE)
    // ==========================================
    public AdminDashboardDto getDashboardStats() {
        // Point 1 : Calcul robuste des utilisateurs actifs / suspendus
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countActiveUsers();
        long inactiveUsers = userRepository.countSuspendedUsers();

        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByStatus(ProductStatus.ACTIVE);
        long soldProducts = productRepository.countByStatus(ProductStatus.SOLD);
        long inactiveProducts = productRepository.countByStatus(ProductStatus.INACTIVE);

        long totalOrders = orderRepository.count();
        long totalTransactions = paymentRepository.count();

        BigDecimal totalTransactionsAmount = orderRepository.sumTotalTransactions();
        if (totalTransactionsAmount == null) totalTransactionsAmount = BigDecimal.ZERO;

        BigDecimal totalCommissions = orderRepository.sumTotalCommissions();
        if (totalCommissions == null) totalCommissions = BigDecimal.ZERO;

        BigDecimal totalValidationFees = orderRepository.sumTotalValidationFees();
        if (totalValidationFees == null) totalValidationFees = BigDecimal.ZERO;

        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

        // Top des catégories les plus demandées
        List<Category> allCategories = categoryRepository.findAll();
        List<CategoryStatDto> topCategories = new ArrayList<>();
        long grandTotalProducts = Math.max(1, totalProducts);

        for (Category cat : allCategories) {
            long count = productRepository.countByCategoryId(cat.getId());
            if (count > 0 || topCategories.size() < 5) {
                int percentage = (int) Math.round(((double) count / (double) grandTotalProducts) * 100);
                topCategories.add(CategoryStatDto.builder()
                        .name(cat.getName())
                        .productCount(count)
                        .percentage(percentage)
                        .build());
            }
        }
        topCategories.sort((a, b) -> Long.compare(b.getProductCount(), a.getProductCount()));
        if (topCategories.size() > 5) {
            topCategories = topCategories.subList(0, 5);
        }

        // Répartition des paiements (Wave, Orange Money, Free Money)
        List<Payment> allPayments = paymentRepository.findAll();
        Map<PaymentMethod, List<Payment>> byMethod = allPayments.stream()
                .collect(Collectors.groupingBy(Payment::getPaymentMethod));

        List<PaymentDistributionDto> paymentDistributions = new ArrayList<>();
        long totalPaymentsCount = Math.max(1, allPayments.size());

        for (PaymentMethod method : PaymentMethod.values()) {
            List<Payment> list = byMethod.getOrDefault(method, Collections.emptyList());
            long count = list.size();
            BigDecimal amount = list.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            int percentage = (int) Math.round(((double) count / (double) totalPaymentsCount) * 100);

            paymentDistributions.add(PaymentDistributionDto.builder()
                    .paymentMethod(method.getDisplayName())
                    .count(count)
                    .totalAmount(amount)
                    .percentage(percentage)
                    .build());
        }

        // Point 2 : Tendances des ventes garantissant les 7 derniers jours (même à 0 FCFA)
        List<Order> recentOrders = orderRepository.findAll();
        List<SalesTrendDto> salesTrends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        LocalDateTime now = LocalDateTime.now();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime dayEnd = now.minusDays(i).withHour(23).withMinute(59).withSecond(59);
            String label = dayStart.format(fmt);

            List<Order> dayOrders = recentOrders.stream()
                    .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(dayStart) && !o.getCreatedAt().isAfter(dayEnd))
                    .collect(Collectors.toList());

            BigDecimal dayAmount = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            salesTrends.add(SalesTrendDto.builder()
                    .label(label)
                    .amount(dayAmount)
                    .orderCount(dayOrders.size())
                    .build());
        }

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldProducts(soldProducts)
                .inactiveProducts(inactiveProducts)
                .totalOrders(totalOrders)
                .totalTransactions(totalTransactions)
                .totalTransactionsAmount(totalTransactionsAmount)
                .totalCommissions(totalCommissions)
                .totalValidationFees(totalValidationFees)
                .pendingReports(pendingReports)
                .topCategories(topCategories)
                .paymentDistributions(paymentDistributions)
                .salesTrends(salesTrends)
                .build();
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
                        .supportPhone("+221770000000")
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
        if (req.getDemoMode() != null) setting.setDemoMode(req.getDemoMode());
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
            if (admin == null) {
                admin = userRepository.findByPhone("+221770000000").orElse(null);
            }
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
