package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.UpdateDeliveryStatusRequest;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.*;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de sécurité pour la carte SEC-04 :
 * Contrôle d'accès sur les livraisons et les notifications (anti-IDOR / anti-BOLA).
 */
@SpringBootTest
@AutoConfigureMockMvc
class DeliveryAndNotificationSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private NotificationRepository notificationRepository;

    @MockitoBean private PaymentGateway paymentGateway;
    @MockitoBean private SmsProvider smsProvider;

    private User buyer;
    private User seller;
    private User thirdParty;
    private User admin;

    private String buyerToken;
    private String sellerToken;
    private String thirdPartyToken;
    private String adminToken;

    private Order order;
    private Delivery delivery;

    @BeforeEach
    void setUp() {
        buyer = saveUser("+22177000" + System.nanoTime() % 10000000, "Acheteur", Role.ROLE_USER);
        seller = saveUser("+22177000" + (System.nanoTime() + 1) % 10000000, "Vendeur", Role.ROLE_USER);
        thirdParty = saveUser("+22177000" + (System.nanoTime() + 2) % 10000000, "Tiers", Role.ROLE_USER);
        admin = saveUser("+22177000" + (System.nanoTime() + 3) % 10000000, "Admin", Role.ROLE_ADMIN);

        buyerToken = jwtUtil.generateToken(buyer, buyer.getId(), buyer.getRole().name(), buyer.getFullName());
        sellerToken = jwtUtil.generateToken(seller, seller.getId(), seller.getRole().name(), seller.getFullName());
        thirdPartyToken = jwtUtil.generateToken(thirdParty, thirdParty.getId(), thirdParty.getRole().name(), thirdParty.getFullName());
        adminToken = jwtUtil.generateToken(admin, admin.getId(), admin.getRole().name(), admin.getFullName());

        Category cat = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(Category.builder().name("Mode").slug("mode-" + UUID.randomUUID()).build())
        );

        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(cat)
                .title("Sneakers Test")
                .description("Sneakers test SEC-04")
                .price(new BigDecimal("15000"))
                .status(ProductStatus.ACTIVE)
                .build());

        order = orderRepository.save(Order.builder()
                .orderNumber("ORD-SEC04-" + UUID.randomUUID().toString().substring(0, 8))
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .itemPrice(new BigDecimal("15000"))
                .totalAmount(new BigDecimal("16500"))
                .sellerPayout(new BigDecimal("12000"))
                .deliveryFee(new BigDecimal("1500"))
                .platformCommission(new BigDecimal("3000"))
                .validationFee(new BigDecimal("150"))
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryAddress("Dakar Liberté 6")
                .deliveryCity("Dakar")
                .deliveryPhone(buyer.getPhone())
                .build());

        delivery = deliveryRepository.save(Delivery.builder()
                .order(order)
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .mode(DeliveryMode.HOME_DELIVERY)
                .status(DeliveryStatus.PENDING)
                .carrierName("Express Moto Dakar")
                .carrierPhone("+221779998877")
                .notes("Instructions confidentielles acheteur")
                .build());
    }

    private User saveUser(String phone, String name, Role role) {
        return userRepository.save(User.builder()
                .firstName(name)
                .lastName("Sec04")
                .phone(phone)
                .password(passwordEncoder.encode("SecretPass123!"))
                .role(role)
                .isVerified(true)
                .isSuspended(false)
                .build());
    }

    // =========================================================================
    // 1. LIVRAISON : CONTRÔLE D'ACCÈS EN LECTURE (GET)
    // =========================================================================

    @Test
    @DisplayName("1.1 BOLA : un tiers ne peut pas consulter le suivi de livraison par orderId (403)")
    void testThirdPartyCannotGetDeliveryByOrderId() throws Exception {
        mockMvc.perform(get("/api/deliveries/order/" + order.getId())
                        .header("Authorization", "Bearer " + thirdPartyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("1.2 L'acheteur et le vendeur peuvent consulter le suivi de livraison par orderId (200)")
    void testBuyerAndSellerCanGetDeliveryByOrderId() throws Exception {
        mockMvc.perform(get("/api/deliveries/order/" + order.getId())
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trackingNumber").value(delivery.getTrackingNumber()));

        mockMvc.perform(get("/api/deliveries/order/" + order.getId())
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trackingNumber").value(delivery.getTrackingNumber()));
    }

    @Test
    @DisplayName("1.3 BOLA : un tiers ne peut pas consulter le suivi par numéro de tracking (403)")
    void testThirdPartyCannotTrackByNumber() throws Exception {
        mockMvc.perform(get("/api/deliveries/track/" + delivery.getTrackingNumber())
                        .header("Authorization", "Bearer " + thirdPartyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("1.4 L'acheteur et le vendeur peuvent suivre le colis par son numéro de tracking (200)")
    void testBuyerAndSellerCanTrackByNumber() throws Exception {
        mockMvc.perform(get("/api/deliveries/track/" + delivery.getTrackingNumber())
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trackingNumber").value(delivery.getTrackingNumber()));

        mockMvc.perform(get("/api/deliveries/track/" + delivery.getTrackingNumber())
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trackingNumber").value(delivery.getTrackingNumber()));
    }

    // =========================================================================
    // 2. LIVRAISON : CHANGEMENT DE STATUT (PUT) RESTREINT AU VENDEUR SEUL
    // =========================================================================

    @Test
    @DisplayName("2.1 Sécurité : l'acheteur, un tiers ou l'admin ne peuvent pas changer le statut de livraison (403)")
    void testNonSellerCannotUpdateDeliveryStatus() throws Exception {
        UpdateDeliveryStatusRequest request = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.PICKED_UP)
                .build();

        // Acheteur rejeté
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Tiers rejeté
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + thirdPartyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Admin rejeté sur ce endpoint vendeur
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("2.2 Cycle logistique : le vendeur fait progresser la livraison dans l'ordre strict des 5 statuts")
    void testSellerCanUpdateDeliveryStatusInStrictOrder() throws Exception {
        // 1. PENDING -> PICKED_UP
        UpdateDeliveryStatusRequest req1 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.PICKED_UP)
                .carrierName("Express Moto")
                .carrierPhone("+221770001122")
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PICKED_UP"));

        // 2. PICKED_UP -> IN_TRANSIT
        UpdateDeliveryStatusRequest req2 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.IN_TRANSIT)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_TRANSIT"));

        // 3. IN_TRANSIT -> OUT_FOR_DELIVERY
        UpdateDeliveryStatusRequest req3 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.OUT_FOR_DELIVERY)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("OUT_FOR_DELIVERY"));

        // 4. OUT_FOR_DELIVERY -> DELIVERED
        UpdateDeliveryStatusRequest req4 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.DELIVERED)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req4)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"));
    }

    @Test
    @DisplayName("2.3 Machine à états : le vendeur ne peut pas sauter d'étape ni rétrograder le statut")
    void testInvalidStatusTransitionsRejected() throws Exception {
        // Saut direct de PENDING à DELIVERED interdit
        UpdateDeliveryStatusRequest jumpReq = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.DELIVERED)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jumpReq)))
                .andExpect(status().isBadRequest());

        // Saut direct de PENDING à OUT_FOR_DELIVERY interdit
        UpdateDeliveryStatusRequest jumpReq2 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.OUT_FOR_DELIVERY)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jumpReq2)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 3. NOTIFICATIONS : ANTI-IDOR ET CONTRÔLE DE PROPRIÉTÉ
    // =========================================================================

    @Test
    @DisplayName("3.1 IDOR : un utilisateur ne peut pas marquer comme lue la notification d'autrui (403)")
    void testUserCannotMarkOtherUserNotificationAsRead() throws Exception {
        Notification notifUserB = notificationRepository.save(Notification.builder()
                .user(seller)
                .title("Alerte Vendeur")
                .message("Message privé vendeur")
                .type(NotificationType.ORDER_CREATED)
                .isRead(false)
                .build());

        // Acheteur tente de marquer la notif du vendeur comme lue
        mockMvc.perform(put("/api/notifications/" + notifUserB.getId() + "/read")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        // La notification doit rester non lue
        Notification check = notificationRepository.findById(notifUserB.getId()).orElseThrow();
        assertThat(check.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("3.2 L'utilisateur peut marquer sa propre notification comme lue (200)")
    void testUserCanMarkOwnNotificationAsRead() throws Exception {
        Notification myNotif = notificationRepository.save(Notification.builder()
                .user(buyer)
                .title("Alerte Acheteur")
                .message("Message privé acheteur")
                .type(NotificationType.ORDER_CREATED)
                .isRead(false)
                .build());

        mockMvc.perform(put("/api/notifications/" + myNotif.getId() + "/read")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk());

        Notification check = notificationRepository.findById(myNotif.getId()).orElseThrow();
        assertThat(check.getIsRead()).isTrue();
    }

    @Test
    @DisplayName("3.3 Notification inexistante renvoie 404")
    void testMarkNonExistentNotificationAsReadReturns404() throws Exception {
        mockMvc.perform(put("/api/notifications/999999/read")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("3.4 Isolation : getMyNotifications et markAllAsRead ne touchent que les notifications du compte connecté")
    void testNotificationListAndMarkAllIsolation() throws Exception {
        notificationRepository.save(Notification.builder()
                .user(buyer)
                .title("Notif Acheteur")
                .message("Msg")
                .type(NotificationType.ORDER_CREATED)
                .isRead(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(seller)
                .title("Notif Vendeur")
                .message("Msg")
                .type(NotificationType.ORDER_CREATED)
                .isRead(false)
                .build());

        // L'acheteur ne voit qu'une seule notification
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("Notif Acheteur"));

        // L'acheteur marque toutes ses notifications comme lues
        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk());

        // La notification du vendeur reste non lue
        long unreadSeller = notificationRepository.countByUserIdAndIsReadFalse(seller.getId());
        assertThat(unreadSeller).isEqualTo(1L);
    }
}
