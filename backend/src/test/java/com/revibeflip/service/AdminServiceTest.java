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
}
