package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private PlatformSettingRepository platformSettingRepository;
    @Mock
    private AdminActionLogRepository adminActionLogRepository;
    @Mock
    private com.revibeflip.repository.ContactMessageRepository contactMessageRepository;

    @InjectMocks
    private AdminService adminService;

    private User adminUser;
    private User regularUser;
    private Category testCategory;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .firstName("Super")
                .lastName("Admin")
                .phone("+221770000000")
                .role(Role.ROLE_ADMIN)
                .isSuspended(false)
                .build();

        regularUser = User.builder()
                .id(2L)
                .firstName("Moussa")
                .lastName("Ndiaye")
                .phone("+221771234567")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        testCategory = Category.builder()
                .id(10L)
                .name("Mode Homme")
                .slug("mode-homme")
                .active(true)
                .build();

        testOrder = Order.builder()
                .id(100L)
                .orderNumber("RF-2026-0001")
                .buyer(regularUser)
                .seller(adminUser)
                .itemPrice(BigDecimal.valueOf(25000))
                .validationFee(BigDecimal.valueOf(250))
                .deliveryFee(BigDecimal.valueOf(2000))
                .totalAmount(BigDecimal.valueOf(27250))
                .platformCommission(BigDecimal.valueOf(5000))
                .sellerPayout(BigDecimal.valueOf(20000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .deliveryStatus(DeliveryStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("Point 1 - Dashboard: Calcul robuste et sans régression des utilisateurs actifs / suspendus")
    void testGetDashboardStats_ActiveUsersCount() {
        when(userRepository.count()).thenReturn(4L);
        when(userRepository.countActiveUsers()).thenReturn(4L);
        when(userRepository.countSuspendedUsers()).thenReturn(0L);

        when(productRepository.count()).thenReturn(6L);
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(6L);
        when(productRepository.countByStatus(ProductStatus.SOLD)).thenReturn(0L);
        when(productRepository.countByStatus(ProductStatus.INACTIVE)).thenReturn(0L);

        when(orderRepository.count()).thenReturn(2L);
        when(paymentRepository.count()).thenReturn(2L);
        when(orderRepository.sumTotalTransactions()).thenReturn(BigDecimal.valueOf(50000));
        when(orderRepository.sumTotalCommissions()).thenReturn(BigDecimal.valueOf(10000));
        when(orderRepository.sumTotalValidationFees()).thenReturn(BigDecimal.valueOf(500));
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(0L);

        when(categoryRepository.findAll()).thenReturn(List.of(testCategory));
        when(paymentRepository.findAll()).thenReturn(Collections.emptyList());
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardDto stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(4L, stats.getTotalUsers());
        assertEquals(4L, stats.getActiveUsers(), "Les 4 utilisateurs doivent être comptés actifs");
        assertEquals(0L, stats.getInactiveUsers());
        // Point 2 : Vérifie que les 7 derniers jours sont toujours retournés même à 0
        assertNotNull(stats.getSalesTrends());
        assertEquals(7, stats.getSalesTrends().size(), "Les 7 derniers jours doivent toujours être présents");
    }

    @Test
    @DisplayName("Dashboard: Calcul période 7j, fuseau Africa/Dakar et gestion division par zéro")
    void testGetDashboardStats_PeriodAndZeroDivision() {
        when(userRepository.countActiveUsers()).thenReturn(10L);
        when(userRepository.countSuspendedUsers()).thenReturn(1L);
        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(2L, 0L); // current=2, previous=0 (division par zéro gérée)

        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(15L);
        when(productRepository.countByStatus(ProductStatus.SOLD)).thenReturn(5L);
        when(productRepository.countByStatus(ProductStatus.INACTIVE)).thenReturn(2L);
        when(productRepository.countByStatus(ProductStatus.DRAFT)).thenReturn(1L);
        when(productRepository.countByCreatedAtBetween(any(), any())).thenReturn(4L, 2L);

        when(orderRepository.countByCreatedAtBetween(any(), any())).thenReturn(8L, 4L);
        when(paymentRepository.countByStatusAndCreatedAtBetween(eq(PaymentStatus.SUCCESS), any(), any())).thenReturn(6L, 3L);

        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(
                PlatformSetting.builder()
                        .commissionRate(BigDecimal.valueOf(20.0))
                        .validationFeeRate(BigDecimal.valueOf(1.0))
                        .currency("FCFA")
                        .build()
        ));

        // Commandes pour le calcul CA et commissions
        Order orderPaid = Order.builder()
                .id(201L)
                .orderNumber("RF-TEST-01")
                .itemPrice(BigDecimal.valueOf(50000))
                .status(OrderStatus.COMPLETED)
                .seller(adminUser)
                .buyer(regularUser)
                .build();

        Payment paymentLocked = Payment.builder()
                .id(301L)
                .amount(BigDecimal.valueOf(30000))
                .status(PaymentStatus.SUCCESS)
                .escrowStatus(EscrowStatus.LOCKED)
                .paymentMethod(PaymentMethod.WAVE)
                .build();

        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(orderPaid), Collections.emptyList());
        when(paymentRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(paymentLocked));
        when(paymentRepository.findByEscrowStatus(EscrowStatus.LOCKED)).thenReturn(List.of(paymentLocked));

        when(reportRepository.countByCreatedAtBetween(any(), any())).thenReturn(3L, 1L);
        when(reportRepository.countByStatusAndCreatedAtBetween(eq(ReportStatus.PENDING), any(), any())).thenReturn(1L);
        when(reportRepository.countByStatusAndCreatedAtBetween(eq(ReportStatus.RESOLVED), any(), any())).thenReturn(2L);

        when(categoryRepository.findAll()).thenReturn(List.of(testCategory));

        AdminDashboardDto stats = adminService.getDashboardStats("7d", null, null);

        assertNotNull(stats);
        assertEquals("7d", stats.getPeriod());
        assertNotNull(stats.getRevenue());
        assertEquals(BigDecimal.valueOf(50000), stats.getRevenue().getValue());
        // Commissions réalisées: 20% de 50000 = 10000
        assertEquals(BigDecimal.valueOf(10000.0), stats.getEarnedCommissions().getValue());
        // Fonds séquestre: 30000
        assertEquals(BigDecimal.valueOf(30000), stats.getEscrowLockedFunds().getValue());
        // Commissions en attente: 20% de 30000 = 6000
        assertEquals(BigDecimal.valueOf(6000.0), stats.getPendingCommissions().getValue());
        // Panier moyen: 50000 / 1 commande = 50000
        assertEquals(BigDecimal.valueOf(50000.0), stats.getAverageBasket().getValue());
        // Division par zéro sur nouveaux utilisateurs (prev=0) -> changePct = 0.0
        assertEquals(0.0, stats.getUsers().getChangePercentage());
        // Transactions
        assertEquals(BigDecimal.valueOf(6), stats.getTransactions().getValue());
        assertEquals(100.0, stats.getTransactions().getChangePercentage()); // (6-3)/3 * 100 = 100%
    }

    @Test
    @DisplayName("Point 4 - Taux configurables: Modification dynamique du taux de commission")
    void testUpdatePlatformSettings_ConfigurableRates() {
        PlatformSetting existing = PlatformSetting.builder()
                .id(1L)
                .commissionRate(BigDecimal.valueOf(20.0))
                .validationFeeRate(BigDecimal.valueOf(1.0))
                .platformName("ReVibe FliP")
                .supportEmail("contact@revibeflip.com")
                .supportPhone("+221770000000")
                .currency("FCFA")
                .build();

        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(existing));
        when(platformSettingRepository.save(any(PlatformSetting.class))).thenAnswer(i -> i.getArgument(0));

        UpdatePlatformSettingsRequest req = UpdatePlatformSettingsRequest.builder()
                .commissionRate(BigDecimal.valueOf(15.0))
                .validationFeeRate(BigDecimal.valueOf(1.5))
                .platformName("ReVibe FliP Pro")
                .supportEmail("support@revibeflip.com")
                .supportPhone("+221771112233")
                .currency("FCFA")
                .build();

        PlatformSettingsDto updated = adminService.updatePlatformSettings(req, adminUser);

        assertEquals(BigDecimal.valueOf(15.0), updated.getCommissionRate());
        assertEquals(BigDecimal.valueOf(1.5), updated.getValidationFeeRate());
        assertEquals("ReVibe FliP Pro", updated.getPlatformName());
        verify(adminActionLogRepository, times(1)).save(any(AdminActionLog.class));
    }

    @Test
    @DisplayName("Point 7 - Garde-fous: Un admin ne peut pas suspendre son propre compte")
    void testToggleUserSuspension_SelfSuspensionBlocked() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminService.toggleUserSuspension(1L, true, adminUser)
        );

        assertTrue(ex.getMessage().contains("Vous ne pouvez pas suspendre votre propre compte"));
        verify(adminActionLogRepository, times(1)).save(any(AdminActionLog.class));
    }

    @Test
    @DisplayName("Point 7 - Garde-fous: Impossible de suspendre le dernier administrateur actif")
    void testToggleUserSuspension_LastAdminBlocked() {
        User otherAdmin = User.builder().id(3L).role(Role.ROLE_ADMIN).isSuspended(false).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherAdmin));
        when(userRepository.countActiveAdmins()).thenReturn(1L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminService.toggleUserSuspension(3L, true, adminUser)
        );

        assertTrue(ex.getMessage().contains("dernier administrateur actif"));
        verify(adminActionLogRepository, times(1)).save(any(AdminActionLog.class));
    }

    @Test
    @DisplayName("Point 7 - Garde-fous: Un admin ne peut pas se retirer son propre rôle ADMIN")
    void testUpdateUserRole_SelfDemotionBlocked() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                adminService.updateUserRole(1L, Role.ROLE_USER, adminUser)
        );

        assertTrue(ex.getMessage().contains("Vous ne pouvez pas vous retirer votre propre rôle"));
        verify(adminActionLogRepository, times(1)).save(any(AdminActionLog.class));
    }

    @Test
    @DisplayName("Point 7 - Garde-fous: Impossible de rétrograder le dernier administrateur actif")
    void testUpdateUserRole_LastAdminDemotionBlocked() {
        User otherAdmin = User.builder().id(3L).role(Role.ROLE_ADMIN).isSuspended(false).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherAdmin));
        when(userRepository.countActiveAdmins()).thenReturn(1L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminService.updateUserRole(3L, Role.ROLE_USER, adminUser)
        );

        assertTrue(ex.getMessage().contains("dernier administrateur actif"));
        verify(adminActionLogRepository, times(1)).save(any(AdminActionLog.class));
    }

    @Test
    @DisplayName("Point 5 - Pagination: Recherche paginée des utilisateurs")
    void testSearchUsersPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(regularUser), pageable, 1);
        when(userRepository.searchUsersPage("Moussa", null, null, pageable)).thenReturn(userPage);

        PageResponseDto<UserDto> result = adminService.searchUsersPage("Moussa", null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("Moussa", result.getContent().get(0).getFirstName());
    }

    @Test
    @DisplayName("Catégories: Protection anti-suppression si des annonces sont associées")
    void testDeleteCategoryProtection() {
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(testCategory));
        when(productRepository.countByCategoryId(10L)).thenReturn(5L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminService.deleteCategory(10L, adminUser)
        );

        assertTrue(ex.getMessage().contains("Protection activée"));
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    @DisplayName("Point 6 - Bandeau À Traiter: Compteurs non nuls et exacts")
    void testActionItemsCounts_AllNonZero() {
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(2L);
        when(orderRepository.countByStatus(OrderStatus.DISPUTED)).thenReturn(1L);
        when(orderRepository.countByDeliveryStatusAndStatus(DeliveryStatus.DELIVERED, OrderStatus.DELIVERED)).thenReturn(2L);
        when(productRepository.countByStatus(ProductStatus.DRAFT)).thenReturn(3L);
        when(contactMessageRepository.countByStatus(com.revibeflip.entity.enums.ContactMessageStatus.NEW)).thenReturn(1L);

        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countActiveUsers()).thenReturn(9L);
        when(userRepository.countSuspendedUsers()).thenReturn(1L);
        when(productRepository.count()).thenReturn(20L);
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(15L);
        when(productRepository.countByStatus(ProductStatus.SOLD)).thenReturn(2L);
        when(productRepository.countByStatus(ProductStatus.INACTIVE)).thenReturn(0L);

        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(
                PlatformSetting.builder()
                        .commissionRate(BigDecimal.valueOf(20.0))
                        .validationFeeRate(BigDecimal.valueOf(1.0))
                        .currency("FCFA")
                        .build()
        ));

        AdminDashboardDto stats = adminService.getDashboardStats("30d", null, null);

        assertNotNull(stats);
        assertNotNull(stats.getActionItems());
        assertTrue(stats.getActionItems().isHasItemsToHandle(), "hasItemsToHandle doit être vrai");
        assertEquals(3L, stats.getActionItems().getPendingReportsAndDisputes(), "2 signalements + 1 litige = 3");
        assertEquals(3L, stats.getActionItems().getPendingModerationProducts(), "3 annonces à modérer");
        assertEquals(1L, stats.getActionItems().getDisputedOrders(), "1 commande bloquée par litige");
        assertEquals(2L, stats.getActionItems().getDeliveredAwaitingConfirmationOrders(), "2 commandes livrées en attente confirmation");
        assertEquals(1L, stats.getActionItems().getUnreadContactMessages(), "1 message de contact non traité");
        assertEquals(9L, stats.getActionItems().getTotalToHandle(), "Total éléments à traiter = 9");
    }

    @Test
    @DisplayName("Point 7 - Cohérence des chiffres entre le Dashboard et les autres onglets")
    void testDashboardConsistencyWithOtherTabs() {
        // Jeu de données partagé
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countActiveUsers()).thenReturn(8L);
        when(userRepository.countSuspendedUsers()).thenReturn(2L);

        when(productRepository.count()).thenReturn(25L);
        when(productRepository.countByStatus(ProductStatus.ACTIVE)).thenReturn(18L);
        when(productRepository.countByStatus(ProductStatus.SOLD)).thenReturn(5L);
        when(productRepository.countByStatus(ProductStatus.INACTIVE)).thenReturn(1L);
        when(productRepository.countByStatus(ProductStatus.DRAFT)).thenReturn(1L);

        Order order1 = Order.builder()
                .id(1L)
                .orderNumber("RF-DEV-00001")
                .itemPrice(BigDecimal.valueOf(30000))
                .status(OrderStatus.COMPLETED)
                .seller(adminUser)
                .buyer(regularUser)
                .build();

        Order order2 = Order.builder()
                .id(2L)
                .orderNumber("RF-DEV-00002")
                .itemPrice(BigDecimal.valueOf(20000))
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .seller(adminUser)
                .buyer(regularUser)
                .build();

        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(order1, order2));

        Payment paymentLocked = Payment.builder()
                .id(501L)
                .amount(BigDecimal.valueOf(20000))
                .status(PaymentStatus.SUCCESS)
                .escrowStatus(EscrowStatus.LOCKED)
                .paymentMethod(PaymentMethod.WAVE)
                .build();

        when(paymentRepository.findByEscrowStatus(EscrowStatus.LOCKED)).thenReturn(List.of(paymentLocked));
        when(paymentRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(paymentLocked));

        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(
                PlatformSetting.builder()
                        .commissionRate(BigDecimal.valueOf(20.0))
                        .validationFeeRate(BigDecimal.valueOf(1.0))
                        .currency("FCFA")
                        .build()
        ));

        AdminDashboardDto stats = adminService.getDashboardStats("30d", null, null);

        // Cohérence Utilisateurs
        assertEquals(userRepository.count(), stats.getTotalUsers());
        assertEquals(userRepository.countActiveUsers(), stats.getUsers().getActive());
        assertEquals(userRepository.countSuspendedUsers(), stats.getUsers().getSuspended());

        // Cohérence Annonces
        assertEquals(productRepository.count(), stats.getTotalProducts());
        assertEquals(productRepository.countByStatus(ProductStatus.ACTIVE), stats.getProducts().getActive());
        assertEquals(productRepository.countByStatus(ProductStatus.SOLD), stats.getProducts().getSold());

        // Cohérence Commandes & CA
        assertEquals(2L, stats.getOrders().getValue());
        assertEquals(BigDecimal.valueOf(50000), stats.getRevenue().getValue(), "CA = 30000 (order1) + 20000 (order2)");

        // Cohérence Séquestre & Commissions
        assertEquals(BigDecimal.valueOf(20000), stats.getEscrowLockedFunds().getValue(), "Fonds sous séquestre = 20000");
        assertEquals(BigDecimal.valueOf(4000.0), stats.getPendingCommissions().getValue(), "Commissions en attente = 20% de 20000 = 4000");
    }
}
