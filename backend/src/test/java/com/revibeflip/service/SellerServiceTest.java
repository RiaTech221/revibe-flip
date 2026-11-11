package com.revibeflip.service;

import com.revibeflip.dto.SellerDashboardDto;
import com.revibeflip.dto.SellerProductRequest;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private ReportRepository reportRepository;
    @Mock private PlatformSettingRepository platformSettingRepository;
    @Mock private CountryRepository countryRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private SellerService sellerService;

    private User sellerA;
    private User sellerB;
    private Category category;
    private Product productA;

    @BeforeEach
    void setUp() {
        sellerA = User.builder()
                .id(1L)
                .firstName("Aminata")
                .lastName("Diallo")
                .phone("+221771112233")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .city("Dakar")
                .build();

        sellerB = User.builder()
                .id(2L)
                .firstName("Moussa")
                .lastName("Ndiaye")
                .phone("+221774445566")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .city("Thiès")
                .build();

        category = Category.builder()
                .id(10L)
                .name("Mode & Vêtements")
                .slug("mode")
                .build();

        productA = Product.builder()
                .id(100L)
                .seller(sellerA)
                .category(category)
                .title("Grand Boubou Brodé")
                .description("Bazin riche de qualité supérieure")
                .price(BigDecimal.valueOf(35000))
                .status(ProductStatus.ACTIVE)
                .condition(ProductCondition.VERY_GOOD)
                .build();
    }

    @Test
    @DisplayName("Dashboard Vendeur: Calcul dynamique des taux et KPIs financiers")
    void testGetSellerDashboard_DynamicRatesAndKPIs() {
        PlatformSetting settings = PlatformSetting.builder()
                .commissionRate(BigDecimal.valueOf(20.0))
                .validationFeeRate(BigDecimal.valueOf(1.0))
                .build();
        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(settings));

        when(productRepository.countBySellerId(1L)).thenReturn(5L);
        when(productRepository.countBySellerIdAndStatus(1L, ProductStatus.ACTIVE)).thenReturn(3L);
        when(productRepository.countBySellerIdAndStatus(1L, ProductStatus.SOLD)).thenReturn(1L);
        when(productRepository.countBySellerIdAndStatus(1L, ProductStatus.INACTIVE)).thenReturn(0L);
        when(productRepository.countBySellerIdAndStatus(1L, ProductStatus.DRAFT)).thenReturn(1L);

        when(orderRepository.countBySellerIdAndStatus(1L, OrderStatus.PAID_ESCROW_LOCKED)).thenReturn(2L);
        when(orderRepository.sumSellerCompletedTurnover(1L)).thenReturn(BigDecimal.valueOf(100000));
        when(orderRepository.sumSellerCommissionPaid(1L)).thenReturn(BigDecimal.valueOf(20000));
        when(orderRepository.sumSellerCompletedPayout(1L)).thenReturn(BigDecimal.valueOf(80000));
        when(orderRepository.sumSellerPendingEscrow(1L)).thenReturn(BigDecimal.valueOf(40000));

        when(orderRepository.searchSellerOrdersPage(eq(1L), any(), any(), any())).thenReturn(org.springframework.data.domain.Page.empty());

        SellerDashboardDto dashboard = sellerService.getSellerDashboard(sellerA);

        assertNotNull(dashboard);
        assertEquals("Aminata Diallo", dashboard.getSellerName());
        assertEquals(5, dashboard.getTotalProducts());
        assertEquals(3, dashboard.getActiveProducts());
        assertEquals(1, dashboard.getDraftProducts());
        assertEquals(2, dashboard.getOrdersToProcess());
        assertEquals(BigDecimal.valueOf(100000), dashboard.getTurnover());
        assertEquals(BigDecimal.valueOf(20000), dashboard.getPlatformCommission());
        assertEquals(BigDecimal.valueOf(80000), dashboard.getNetEarnings());
        assertEquals(BigDecimal.valueOf(20.0), dashboard.getCommissionRate());
        assertEquals(BigDecimal.valueOf(1.0), dashboard.getValidationFeeRate());
    }

    @Test
    @DisplayName("Sécurité Annonce: Création impossible si compte vendeur suspendu")
    void testCreateProduct_BlockedIfSuspended() {
        sellerA.setIsSuspended(true);
        SellerProductRequest req = SellerProductRequest.builder()
                .title("Robe Wax")
                .categoryId(10L)
                .price(BigDecimal.valueOf(15000))
                .description("Magnifique robe wax")
                .build();

        assertThrows(AccessDeniedException.class, () -> sellerService.createProduct(sellerA, req));
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Règle Métier: Impossible de modifier le prix d'une annonce ayant une commande en cours")
    void testUpdateProduct_PriceChangeBlockedIfOrderInProgress() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(productA));
        when(orderRepository.existsByProductIdAndStatusIn(eq(100L), anyCollection())).thenReturn(true);

        SellerProductRequest req = SellerProductRequest.builder()
                .title("Nouveau titre")
                .description("Nouvelle description valide")
                .price(BigDecimal.valueOf(40000)) // Modification de prix 35000 -> 40000
                .build();

        assertThrows(IllegalStateException.class, () -> sellerService.updateProduct(sellerA, 100L, req));
    }

    @Test
    @DisplayName("Règle Métier: Impossible de supprimer une annonce ayant une commande en cours")
    void testDeleteProduct_BlockedIfOrderInProgress() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(productA));
        when(orderRepository.existsByProductIdAndStatusIn(eq(100L), anyCollection())).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> sellerService.deleteProduct(sellerA, 100L));
        verify(productRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Contrôle Propriété: Un vendeur A ne peut pas modifier ni supprimer l'annonce du vendeur B")
    void testProductOwnership_ForbiddenIfOtherSeller() {
        when(productRepository.findById(100L)).thenReturn(Optional.of(productA)); // Appartient à vendeur A

        SellerProductRequest req = SellerProductRequest.builder().title("Piratage").build();

        // Vendeur B tente de modifier ou supprimer
        assertThrows(AccessDeniedException.class, () -> sellerService.updateProduct(sellerB, 100L, req));
        assertThrows(AccessDeniedException.class, () -> sellerService.deleteProduct(sellerB, 100L));
    }

    @Test
    @DisplayName("Logistique Vendeur: Marquer comme remis passe à PICKED_UP et SHIPPED")
    void testMarkReadyForPickup_TransitionsToPickedUpAndShipped() {
        Order order = Order.builder()
                .id(200L)
                .orderNumber("RF-2026-TEST")
                .seller(sellerA)
                .buyer(sellerB)
                .product(productA)
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryStatus(DeliveryStatus.PENDING)
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .build();

        when(orderRepository.findById(200L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        sellerService.markReadyForPickup(sellerA, 200L);

        assertEquals(DeliveryStatus.PICKED_UP, order.getDeliveryStatus());
        assertEquals(OrderStatus.SHIPPED, order.getStatus());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Avis Vendeur: Signalement d'un avis abusif transmis aux modérateurs admin")
    void testReportReview_AbuseReportCreated() {
        Review review = Review.builder()
                .id(300L)
                .targetUser(sellerA)
                .reviewer(sellerB)
                .rating(1)
                .comment("Commentaire injurieux et faux")
                .build();

        when(reviewRepository.findById(300L)).thenReturn(Optional.of(review));

        com.revibeflip.dto.ReportReviewRequest req = com.revibeflip.dto.ReportReviewRequest.builder()
                .reason("Propos diffamatoires")
                .details("L'acheteur ment sur l'état de l'article")
                .build();

        sellerService.reportReview(sellerA, 300L, req);

        verify(reportRepository).save(argThat(rep ->
                rep.getReporter().equals(sellerA) &&
                rep.getReason() == ReportReason.ABUSIVE_BEHAVIOR &&
                rep.getStatus() == ReportStatus.PENDING
        ));
    }
}
