package com.revibeflip.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PayTechConfigValidator;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.*;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-02 — Tests de sécurité sur le retour de virement vendeur (POST /api/payments/transfer-ipn).
 *
 * <p>Conventions : alignées sur ProductionAuditSecurityTests (@MockitoBean PaymentGateway, fixtures de données).
 * <p>Ces tests valident les transitions de la machine à états de virement ainsi que la validation de configuration.
 * Les tests 5, 6, 7 et 10 sont conçus pour ÉCHOUER sur le code non corrigé.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class TransferIpnSecurityTest {

    private static final AtomicLong PHONE_COUNTER = new AtomicLong(700000000L);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @MockitoBean private PaymentGateway paymentGateway;
    @MockitoBean private SmsProvider smsProvider;

    @Test
    @DisplayName("1. Virement PROCESSING + statut de succès : passe à COMPLETED, payoutDate renseignée")
    void testTransferProcessingToSuccessBecomesCompleted() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PROCESSING, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.COMPLETED, updated.getPayoutStatus());
        assertNotNull(updated.getPayoutDate());
    }

    @Test
    @DisplayName("2. Rejeu du même succès : aucun changement, payoutDate inchangée")
    void testReplaySameSuccessNoChange() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime initialPayoutDate = LocalDateTime.now().minusHours(2).withNano(0);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.COMPLETED, ref, initialPayoutDate);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.COMPLETED, updated.getPayoutStatus());
        assertEquals(initialPayoutDate, updated.getPayoutDate());
    }

    @Test
    @DisplayName("3. Virement PROCESSING + statut d'échec : passe à FAILED")
    void testTransferProcessingToFailedBecomesFailed() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PROCESSING, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "failed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.FAILED, updated.getPayoutStatus());
        assertNull(updated.getPayoutDate());
    }

    @Test
    @DisplayName("4. Virement COMPLETED + appel d'échec : reste COMPLETED")
    void testTransferCompletedCallFailedRemainsCompleted() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime initialPayoutDate = LocalDateTime.now().minusHours(1).withNano(0);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.COMPLETED, ref, initialPayoutDate);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "failed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.COMPLETED, updated.getPayoutStatus());
        assertEquals(initialPayoutDate, updated.getPayoutDate());
    }

    @Test
    @DisplayName("5. Virement FAILED + appel de succès : reste FAILED")
    void testTransferFailedCallSuccessRemainsFailed() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.FAILED, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.FAILED, updated.getPayoutStatus(),
                "Un virement FAILED ne doit pas pouvoir basculer à COMPLETED sans nouvelle tentative autorisée");
    }

    @Test
    @DisplayName("6. Virement MANUAL_REQUIRED + appel de succès : reste MANUAL_REQUIRED")
    void testTransferManualRequiredCallSuccessRemainsManualRequired() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.MANUAL_REQUIRED, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.MANUAL_REQUIRED, updated.getPayoutStatus(),
                "Un virement en MANUAL_REQUIRED exige une intervention manuelle et ne doit pas être validé par un simple webhook");
    }

    @Test
    @DisplayName("7. Virement PENDING + appel de succès : reste PENDING")
    void testTransferPendingCallSuccessRemainsPending() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PENDING, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.PENDING, updated.getPayoutStatus(),
                "Un virement PENDING (non encore passé en PROCESSING) ne doit pas être validé COMPLETED par webhook");
    }

    @Test
    @DisplayName("8. Statut inconnu ou vide : aucun changement")
    void testTransferUnknownOrEmptyStatusNoChange() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PROCESSING, ref, null);

        // Appel avec statut arbitraire
        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", "INCONNU_123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated1 = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.PROCESSING, updated1.getPayoutStatus());
        assertNull(updated1.getPayoutDate());

        // Appel avec statut vide
        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        Payment updated2 = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.PROCESSING, updated2.getPayoutStatus());
        assertNull(updated2.getPayoutDate());
    }

    @Test
    @DisplayName("9. Référence inconnue : réponse identique à une référence connue, aucun effet")
    void testTransferUnknownReferenceIdenticalResponseNoEffect() throws Exception {
        String unknownRef = "PAYOUT-UNKNOWN-" + UUID.randomUUID().toString().substring(0, 8);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", unknownRef, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        assertTrue(paymentRepository.findByPayoutReference(unknownRef).isEmpty());
    }

    @Test
    @DisplayName("10. Démarrage en profil prod avec PAYTECH_ALLOWED_IPS vide : le validateur doit refuser le démarrage")
    void testStartupInProdProfileWithEmptyAllowedIpsMustFail() {
        PayTechProperties props = new PayTechProperties();
        props.setApiKey("prod_api_key_valid");
        props.setApiSecret("prod_api_secret_valid");
        props.setEnv("prod");
        props.setIpnUrl("https://revibeflip.com/api/payments/ipn");
        props.setSuccessUrl("https://revibeflip.com/payment/success");
        props.setCancelUrl("https://revibeflip.com/payment/cancel");
        props.setAllowedIps(""); // Vide : doit lever une exception pour bloquer le démarrage en production

        PayTechConfigValidator validator = new PayTechConfigValidator(props);
        assertThrows(IllegalStateException.class, validator::validate,
                "PayTechConfigValidator doit lever IllegalStateException si PAYTECH_ALLOWED_IPS est vide en production");
    }

    @Test
    @DisplayName("11. Validateur prod : liste d'IP renseignée, aucune exception")
    void testStartupInProdProfileWithAllowedIpsSuccess() {
        PayTechProperties props = new PayTechProperties();
        props.setApiKey("prod_api_key_valid");
        props.setApiSecret("prod_api_secret_valid");
        props.setEnv("prod");
        props.setIpnUrl("https://revibeflip.com/api/payments/ipn");
        props.setSuccessUrl("https://revibeflip.com/payment/success");
        props.setCancelUrl("https://revibeflip.com/payment/cancel");
        props.setAllowedIps("203.0.113.10, 203.0.113.11");

        PayTechConfigValidator validator = new PayTechConfigValidator(props);
        assertDoesNotThrow(validator::validate, "Le démarrage doit réussir lorsque PAYTECH_ALLOWED_IPS est configuré");
    }

    @ParameterizedTest(name = "Statut ''{0}'' -> {1}")
    @CsvSource({
            "success, COMPLETED",
            "SUCCESS, COMPLETED",
            "completed, COMPLETED",
            "COMPLETED, COMPLETED",
            "failed, FAILED",
            "FAILED, FAILED",
            "canceled, FAILED",
            "CANCELED, FAILED"
    })
    @DisplayName("12. Les 4 valeurs de statut acceptées, en minuscules et majuscules")
    void testAllFourStatusValuesCaseInsensitive(String inputStatus, PayoutStatus expectedStatus) throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PROCESSING, ref, null);

        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", inputStatus))))
                .andExpect(status().isOk());

        assertEquals(expectedStatus, paymentRepository.findById(payment.getId()).orElseThrow().getPayoutStatus());
    }

    @Test
    @DisplayName("13. Corps mal formé (external_id numérique, status objet) : 200, aucun changement, aucune 500")
    void testMalformedPayloadNumericIdOrObjectStatusNo500() throws Exception {
        String ref = "PAYOUT-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Payment payment = createTestPaymentWithPayoutStatus(PayoutStatus.PROCESSING, ref, null);

        // external_id numérique (ex: 12345)
        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", 12345, "status", "success"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        // status objet (ex: { "code": 1 })
        mockMvc.perform(post("/api/payments/transfer-ipn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("external_id", ref, "status", Map.of("code", 1)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        // Le paiement en base ne doit pas avoir changé
        Payment unchanged = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PayoutStatus.PROCESSING, unchanged.getPayoutStatus());
        assertNull(unchanged.getPayoutDate());
    }

    private Payment createTestPaymentWithPayoutStatus(PayoutStatus payoutStatus, String payoutReference, LocalDateTime payoutDate) {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        long phoneSuffix = PHONE_COUNTER.incrementAndGet();

        User seller = userRepository.save(User.builder()
                .phone("+221" + phoneSuffix)
                .firstName("Seller")
                .lastName(uniqueSuffix)
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        User buyer = userRepository.save(User.builder()
                .phone("+221" + (phoneSuffix + 10000000L))
                .firstName("Buyer")
                .lastName(uniqueSuffix)
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        Category category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name("Test Category")
                        .slug("cat-" + uniqueSuffix)
                        .build()));

        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(category)
                .title("Product " + uniqueSuffix)
                .description("Description test pour virement")
                .price(new BigDecimal("10000"))
                .status(ProductStatus.SOLD)
                .condition(ProductCondition.GOOD)
                .build());

        Order order = orderRepository.save(Order.builder()
                .orderNumber("RF-2026-" + uniqueSuffix)
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .itemPrice(product.getPrice())
                .originalPrice(product.getPrice())
                .agreedPrice(product.getPrice())
                .validationFee(new BigDecimal("100"))
                .deliveryFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("10100"))
                .platformCommission(new BigDecimal("2000"))
                .sellerPayout(new BigDecimal("8000"))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .status(OrderStatus.COMPLETED)
                .build());

        return paymentRepository.save(Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.WAVE)
                .amount(order.getTotalAmount())
                .validationFee(order.getValidationFee())
                .status(PaymentStatus.SUCCESS)
                .escrowStatus(EscrowStatus.RELEASED_TO_SELLER)
                .payoutStatus(payoutStatus)
                .payoutReference(payoutReference)
                .payoutDate(payoutDate)
                .transactionReference(order.getOrderNumber())
                .build());
    }
}
