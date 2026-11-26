package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.CreateOfferRequest;
import com.revibeflip.dto.SellerProductRequest;
import com.revibeflip.dto.UpdateDeliveryStatusRequest;
import com.revibeflip.dto.UpdateProductRequest;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.ChatOffer;
import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.Delivery;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.OfferStatus;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.ChatOfferRepository;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.ChatOfferService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-18 : Tests de sécurité sur l'éligibilité, la validation, la concurrence et les machines à états
 * des annonces, offres et commandes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ListingAndOfferSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ConversationRepository conversationRepository;
    @Autowired private ChatOfferRepository chatOfferRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private ChatOfferService chatOfferService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private User eligibleSeller;
    private User incompleteSeller;
    private User buyer;
    private Category category;
    private String eligibleSellerToken;
    private String incompleteSellerToken;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);
        eligibleSeller = userRepository.save(User.builder()
                .phone(com.revibeflip.support.TestPhoneGenerator.nextPhone("+22177"))
                .email("eligible-" + salt + "@revibeflip.sn")
                .firstName("Aminata")
                .lastName("Diallo")
                .city("Dakar")
                .address("Plateau, Rue 10")
                .password(passwordEncoder.encode("StrongPass123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build());

        // Profil incomplet (ni ville ni adresse ni nom complet) : non éligible à vendre
        incompleteSeller = userRepository.save(User.builder()
                .phone(com.revibeflip.support.TestPhoneGenerator.nextPhone("+22178"))
                .password(passwordEncoder.encode("StrongPass123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build());

        buyer = userRepository.save(User.builder()
                .phone(com.revibeflip.support.TestPhoneGenerator.nextPhone("+22176"))
                .email("buyer-" + salt + "@revibeflip.sn")
                .firstName("Moussa")
                .lastName("Ndiaye")
                .city("Dakar")
                .address("Mermoz")
                .password(passwordEncoder.encode("StrongPass123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build());

        category = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(Category.builder()
                        .name("Mode " + salt)
                        .slug("mode-" + salt)
                        .active(true)
                        .build()));

        eligibleSellerToken = jwtUtil.generateToken(eligibleSeller, eligibleSeller.getId(), eligibleSeller.getRole().name(), eligibleSeller.getFullName());
        incompleteSellerToken = jwtUtil.generateToken(incompleteSeller, incompleteSeller.getId(), incompleteSeller.getRole().name(), incompleteSeller.getFullName());
    }

    // =========================================================================
    // 1. ÉLIGIBILITÉ VENDEUR AU PASSAGE DRAFT -> ACTIVE
    // =========================================================================

    @Test
    @DisplayName("1.1 Un vendeur non éligible ne peut pas publier un brouillon via updateProduct ni toggleProductStatus")
    void ineligibleSellerCannotPublishDraft() throws Exception {
        Product draft = productRepository.save(Product.builder()
                .title("Robe brouillon test")
                .description("Description suffisante pour test")
                .price(BigDecimal.valueOf(15000))
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.DRAFT)
                .seller(incompleteSeller)
                .category(category)
                .build());

        // Tentative 1 : PUT /api/seller/products/{id} avec isDraft=false
        SellerProductRequest req = SellerProductRequest.builder()
                .title("Robe brouillon test")
                .description("Description suffisante pour test")
                .price(BigDecimal.valueOf(15000))
                .condition(ProductCondition.VERY_GOOD)
                .categoryId(category.getId())
                .isDraft(false)
                .build();

        mockMvc.perform(put("/api/seller/products/" + draft.getId())
                        .header("Authorization", "Bearer " + incompleteSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        // Tentative 2 : PUT /api/seller/products/{id}/status?status=ACTIVE
        mockMvc.perform(put("/api/seller/products/" + draft.getId() + "/status")
                        .param("status", "ACTIVE")
                        .header("Authorization", "Bearer " + incompleteSellerToken))
                .andExpect(status().isBadRequest());

        assertThat(productRepository.findById(draft.getId()).orElseThrow().getStatus()).isEqualTo(ProductStatus.DRAFT);
    }

    // =========================================================================
    // 2. VALIDATION DES PRIX, FRAIS ET DURÉES + RESTRICTION DES STATUTS
    // =========================================================================

    @Test
    @DisplayName("2.1 Valeurs invalides (prix <= 0, frais négatifs, durée > 168h) rejetées en 400")
    void invalidPricesFeesAndValidityRejected() throws Exception {
        Product active = saveProduct(eligibleSeller, ProductStatus.ACTIVE, null);

        // Prix négatif sur PUT /api/products/{id}
        UpdateProductRequest badPrice = UpdateProductRequest.builder()
                .price(BigDecimal.valueOf(-500))
                .build();
        mockMvc.perform(put("/api/products/" + active.getId())
                        .header("Authorization", "Bearer " + eligibleSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badPrice)))
                .andExpect(status().isBadRequest());

        Conversation conv = conversationRepository.save(Conversation.builder()
                .buyer(buyer)
                .seller(eligibleSeller)
                .product(active)
                .build());

        // Frais de livraison négatifs sur POST /api/chat-offers
        CreateOfferRequest badFee = CreateOfferRequest.builder()
                .conversationId(conv.getId())
                .productId(active.getId())
                .agreedPrice(BigDecimal.valueOf(10000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryFee(BigDecimal.valueOf(-5000))
                .validityHours(24)
                .build();
        mockMvc.perform(post("/api/chat-offers")
                        .header("Authorization", "Bearer " + eligibleSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badFee)))
                .andExpect(status().isBadRequest());

        // Durée de validité > 168h sur POST /api/chat-offers
        CreateOfferRequest badValidity = CreateOfferRequest.builder()
                .conversationId(conv.getId())
                .productId(active.getId())
                .agreedPrice(BigDecimal.valueOf(10000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryFee(BigDecimal.valueOf(1000))
                .validityHours(500)
                .build();
        mockMvc.perform(post("/api/chat-offers")
                        .header("Authorization", "Bearer " + eligibleSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badValidity)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("2.2 Un vendeur ne peut pas forcer le statut SOLD ou RESERVED sur son annonce (409)")
    void sellerCannotForceSoldOrReservedStatus() throws Exception {
        Product active = saveProduct(eligibleSeller, ProductStatus.ACTIVE, null);

        UpdateProductRequest forceSold = UpdateProductRequest.builder()
                .status(ProductStatus.SOLD)
                .build();
        mockMvc.perform(put("/api/products/" + active.getId())
                        .header("Authorization", "Bearer " + eligibleSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forceSold)))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/seller/products/" + active.getId() + "/status")
                        .param("status", "RESERVED")
                        .header("Authorization", "Bearer " + eligibleSellerToken))
                .andExpect(status().isConflict());

        assertThat(productRepository.findById(active.getId()).orElseThrow().getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    // =========================================================================
    // 3. ACCEPTATION SIMULTANÉE D'UNE OFFRE (CONCURRENCE)
    // =========================================================================

    @Test
    @DisplayName("3.1 Deux acceptations concurrentes de la même offre n'aboutissent qu'une seule fois")
    void concurrentAcceptOffer_onlyOneSucceeds() throws Exception {
        Product active = saveProduct(eligibleSeller, ProductStatus.ACTIVE, null);
        Conversation conv = conversationRepository.save(Conversation.builder()
                .buyer(buyer)
                .seller(eligibleSeller)
                .product(active)
                .build());

        ChatOffer offer = chatOfferRepository.save(ChatOffer.builder()
                .conversation(conv)
                .seller(eligibleSeller)
                .buyer(buyer)
                .product(active)
                .initialPrice(BigDecimal.valueOf(20000))
                .agreedPrice(BigDecimal.valueOf(18000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryFee(BigDecimal.valueOf(2000))
                .validationFee(BigDecimal.valueOf(180))
                .totalAmount(BigDecimal.valueOf(20180))
                .validityHours(24)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .status(OfferStatus.OFFER_SENT)
                .build());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger(0);
        AtomicInteger failures = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            futures.add(pool.submit(() -> {
                try {
                    startGate.await();
                    chatOfferService.acceptOffer(buyer, offer.getId());
                    successes.incrementAndGet();
                } catch (Exception e) {
                    failures.incrementAndGet();
                }
            }));
        }

        startGate.countDown();
        for (Future<?> f : futures) {
            f.get();
        }
        pool.shutdown();

        assertThat(successes.get()).isEqualTo(1);
        assertThat(failures.get()).isEqualTo(1);
        assertThat(productRepository.findById(active.getId()).orElseThrow().getStatus()).isEqualTo(ProductStatus.RESERVED);
        assertThat(chatOfferRepository.findById(offer.getId()).orElseThrow().getStatus()).isEqualTo(OfferStatus.OFFER_ACCEPTED);
    }

    // =========================================================================
    // 4. EXPIRATION DES COMMANDES NON PAYÉES (PENDING_PAYMENT)
    // =========================================================================

    @Test
    @DisplayName("4.1 processExpirations() expire les commandes PENDING_PAYMENT dépassées et libère l'article")
    void processExpirations_expiresPendingPaymentOrdersAndReleasesProduct() {
        Product reserved = saveProduct(eligibleSeller, ProductStatus.RESERVED, null);
        Order pendingOrder = orderRepository.save(Order.builder()
                .orderNumber("RF-SEC18-" + UUID.randomUUID().toString().substring(0, 6))
                .buyer(buyer)
                .seller(eligibleSeller)
                .product(reserved)
                .itemPrice(BigDecimal.valueOf(20000))
                .validationFee(BigDecimal.valueOf(200))
                .deliveryFee(BigDecimal.valueOf(2000))
                .totalAmount(BigDecimal.valueOf(22200))
                .platformCommission(BigDecimal.valueOf(4000))
                .sellerPayout(BigDecimal.valueOf(16000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .status(OrderStatus.PENDING_PAYMENT)
                .reservationExpiresAt(LocalDateTime.now().minusMinutes(10))
                .build());

        chatOfferService.processExpirations();

        assertThat(orderRepository.findById(pendingOrder.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(productRepository.findById(reserved.getId()).orElseThrow().getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    // =========================================================================
    // 5. VISIBILITÉ PUBLIQUE DES BROUILLONS ET ANNONCES DÉSACTIVÉES
    // =========================================================================

    @Test
    @DisplayName("5.1 GET /api/products/{id} et /seller/{sellerId} masquent DRAFT, INACTIVE et deactivationReason")
    void publicEndpointsHideDraftInactiveAndDeactivationReason() throws Exception {
        Product active = saveProduct(eligibleSeller, ProductStatus.ACTIVE, "Motif interne confidentiel");
        Product draft = saveProduct(eligibleSeller, ProductStatus.DRAFT, null);
        Product inactive = saveProduct(eligibleSeller, ProductStatus.INACTIVE, "Contrefaçon suspectée");

        // Détail public : 404 sur DRAFT et INACTIVE
        mockMvc.perform(get("/api/products/" + draft.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/products/" + inactive.getId())).andExpect(status().isNotFound());

        // Détail public sur ACTIVE : 200 et deactivationReason null
        mockMvc.perform(get("/api/products/" + active.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deactivationReason").doesNotExist());

        // Liste vendeur publique : ne contient que l'annonce ACTIVE, sans deactivationReason
        mockMvc.perform(get("/api/products/seller/" + eligibleSeller.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(active.getId()))
                .andExpect(jsonPath("$.data[0].deactivationReason").doesNotExist());
    }

    // =========================================================================
    // 6. MACHINES À ÉTATS COMMANDE / LIVRAISON
    // =========================================================================

    @Test
    @DisplayName("6.1 Impossible d'expédier ou livrer une commande non payée (PENDING_PAYMENT) -> 409")
    void cannotShipOrDeliverUnpaidOrder() throws Exception {
        Product reserved = saveProduct(eligibleSeller, ProductStatus.RESERVED, null);
        Order unpaidOrder = orderRepository.save(Order.builder()
                .orderNumber("RF-UNPAID-" + UUID.randomUUID().toString().substring(0, 6))
                .buyer(buyer)
                .seller(eligibleSeller)
                .product(reserved)
                .itemPrice(BigDecimal.valueOf(20000))
                .validationFee(BigDecimal.valueOf(200))
                .deliveryFee(BigDecimal.valueOf(2000))
                .totalAmount(BigDecimal.valueOf(22200))
                .platformCommission(BigDecimal.valueOf(4000))
                .sellerPayout(BigDecimal.valueOf(16000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .status(OrderStatus.PENDING_PAYMENT)
                .deliveryStatus(DeliveryStatus.PENDING)
                .build());

        Delivery delivery = deliveryRepository.save(Delivery.builder()
                .order(unpaidOrder)
                .trackingNumber("TRK-SEC18-" + UUID.randomUUID().toString().substring(0, 6))
                .mode(DeliveryMode.HOME_DELIVERY)
                .status(DeliveryStatus.PENDING)
                .build());

        // Tentative via SellerController ready-for-pickup -> 409
        mockMvc.perform(put("/api/seller/orders/" + unpaidOrder.getId() + "/ready-for-pickup")
                        .header("Authorization", "Bearer " + eligibleSellerToken))
                .andExpect(status().isConflict());

        // Tentative via DeliveryController PUT /status -> 409
        UpdateDeliveryStatusRequest req = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.PICKED_UP)
                .build();
        mockMvc.perform(put("/api/deliveries/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + eligibleSellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    private Product saveProduct(User seller, ProductStatus status, String deactivationReason) {
        return productRepository.save(Product.builder()
                .title("Article Test " + status.name())
                .description("Description test SEC-18")
                .price(BigDecimal.valueOf(20000))
                .condition(ProductCondition.VERY_GOOD)
                .status(status)
                .deactivationReason(deactivationReason)
                .seller(seller)
                .category(category)
                .build());
    }
}
