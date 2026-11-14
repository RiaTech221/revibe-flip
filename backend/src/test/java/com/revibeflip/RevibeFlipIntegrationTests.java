package com.revibeflip;

import com.revibeflip.dto.*;
import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.EscrowStatus;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.PaymentMethod;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
class RevibeFlipIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PayTechProperties payTechProperties;

    @MockitoBean
    private PaymentGateway paymentGateway;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private AdminService adminService;

    @Test
    void testEndToEndV1Flow() {
        // 1. Inscription Acheteur avec numéro sénégalais
        RegisterRequest registerReq = RegisterRequest.builder()
                .firstName("Ousmane")
                .lastName("Ba")
                .phone("+221779998877")
                .email("ousmane.ba@test.sn")
                .password("Password123!")
                .confirmPassword("Password123!")
                .countryCode("SN")
                .build();

        AuthResponse regResponse = authService.register(registerReq);
        assertNotNull(regResponse);
        assertFalse(regResponse.getUser().getIsVerified(), "Le compte n'est pas encore vérifié");

        var registeredUser = userRepository.findByPhone(registerReq.getPhone()).orElseThrow();
        assertNotNull(registeredUser.getOtpCode(), "Le code OTP doit être généré");

        // 2. Validation OTP
        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .phone(registerReq.getPhone())
                .otpCode(registeredUser.getOtpCode())
                .build();

        AuthResponse authResponse = authService.verifyOtp(verifyReq);
        assertNotNull(authResponse.getToken(), "Le token JWT doit être généré après validation OTP");
        assertTrue(authResponse.getUser().getIsVerified(), "Le compte doit être activé");

        var buyerUser = userRepository.findById(authResponse.getUser().getId()).orElseThrow();

        // 3. Vendeur publie un article
        var sellerUser = userRepository.findByPhone("+221771112233").orElseGet(() ->
                userRepository.save(com.revibeflip.entity.User.builder()
                        .firstName("Test")
                        .lastName("Vendeur")
                        .phone("+221771112233")
                        .email("vendeur.test@revibeflip.sn")
                        .password("$2a$10$dummyhashforunitintegrationtestonly123456789012")
                        .role(com.revibeflip.entity.enums.Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .city("Dakar")
                        .build())
        );
        CreateProductRequest createProd = CreateProductRequest.builder()
                .title("Ensemble Wax Kente Prestige")
                .description("Superbe ensemble traditionnel en wax authentique")
                .price(BigDecimal.valueOf(20000))
                .originalPrice(BigDecimal.valueOf(35000))
                .brand("Kente Afro")
                .size("XL")
                .color("Jaune et Noir")
                .condition(ProductCondition.NEW_WITH_TAG)
                .categoryId(1L)
                .locationCity("Dakar")
                .imageUrls(List.of("https://images.unsplash.com/photo-1590736969955-71cc94801759"))
                .build();

        ProductDto product = productService.createProduct(createProd, sellerUser);
        assertNotNull(product.getId());
        assertEquals("ACTIVE", product.getStatus());

        // 4. Acheteur (Ousmane) crée une commande
        // Vérification des règles de calcul :
        // Prix = 20 000 FCFA
        // Frais de validation 1% = 200 FCFA
        // Livraison à domicile = 2 000 FCFA
        // Total acheteur = 22 200 FCFA
        // Commission plateforme 20% = 4 000 FCFA
        // Rémunération vendeur (Payout) = 16 000 FCFA
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .productId(product.getId())
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryAddress("Liberté 6, Villa 45")
                .deliveryCity("Dakar")
                .deliveryPhone("+221779998877")
                .deliveryNotes("Appeler à l'arrivée")
                .build();

        OrderDto order = orderService.createOrder(orderReq, buyerUser);
        assertNotNull(order.getId());
        assertNotNull(order.getOrderNumber());
        assertEquals(0, new BigDecimal("20000").compareTo(order.getItemPrice()));
        assertEquals(0, new BigDecimal("200").compareTo(order.getValidationFee()), "Les frais de validation 1% doivent être de 200 FCFA");
        assertEquals(0, new BigDecimal("2000").compareTo(order.getDeliveryFee()), "Les frais de livraison à domicile doivent être de 2000 FCFA");
        assertEquals(0, new BigDecimal("22200").compareTo(order.getTotalAmount()), "Total = 20000 + 200 + 2000 = 22200 FCFA");
        assertEquals(0, new BigDecimal("4000").compareTo(order.getPlatformCommission()), "Commission 20% = 4000 FCFA");
        assertEquals(0, new BigDecimal("16000").compareTo(order.getSellerPayout()), "Rémunération nette vendeur = 16000 FCFA");
        assertEquals("PENDING_PAYMENT", order.getStatus());

        // 5. Paiement mobile Wave via passerelle PayTech (test double dans src/test)
        payTechProperties.setApiKey("test_api_key");
        payTechProperties.setApiSecret("test_api_secret");
        payTechProperties.setEnv("test");
        payTechProperties.setIpnUrl("https://example.test/ipn");
        payTechProperties.setSuccessUrl("https://example.test/success");
        payTechProperties.setCancelUrl("https://example.test/cancel");

        when(paymentGateway.initiatePayment(any())).thenReturn(
                new PaymentGateway.PaymentInitiationResult(true, "tok_test_123", "https://paytech.sn/payment/checkout/tok_test_123", "{}")
        );
        when(paymentGateway.getPaymentStatus("tok_test_123")).thenReturn(
                new PaymentGateway.PaymentStatusResult(true, "complete", "Wave", order.getTotalAmount(), "XOF", "{}")
        );
        when(paymentGateway.verifyIpnSignature(sha256("test_api_key"), sha256("test_api_secret"))).thenReturn(true);
        when(paymentGateway.initiateTransfer(any())).thenReturn(
                new PaymentGateway.TransferResult(true, "trf_test_123", "SUCCESS", "{}")
        );

        ProcessPaymentRequest payReq = ProcessPaymentRequest.builder()
                .orderId(order.getId())
                .paymentMethod(PaymentMethod.WAVE)
                .phoneNumber("+221779998877")
                .build();

        PaymentInitiationResponse initRes = paymentService.initiatePayment(payReq, buyerUser);
        assertNotNull(initRes);
        assertEquals("https://paytech.sn/payment/checkout/tok_test_123", initRes.getRedirectUrl());

        PayTechIpnPayload ipn = new PayTechIpnPayload();
        ipn.setTypeEvent("sale_complete");
        ipn.setRefCommand(order.getOrderNumber());
        ipn.setItemPrice(order.getTotalAmount());
        ipn.setCurrency("XOF");
        ipn.setPaymentMethod("Wave");
        ipn.setToken("tok_test_123");
        ipn.setApiKeySha256(sha256("test_api_key"));
        ipn.setApiSecretSha256(sha256("test_api_secret"));
        paymentService.handlePayTechIpn(ipn, "127.0.0.1");

        PaymentDto payment = paymentService.getPaymentByOrderId(order.getId(), buyerUser);
        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(EscrowStatus.LOCKED.name(), payment.getEscrowStatus(), "Les fonds doivent être conservés jusqu'à réception");

        // Vérifier que le statut de l'article est passé à SOLD
        ProductDto updatedProduct = productService.getProductById(product.getId());
        assertEquals("SOLD", updatedProduct.getStatus(), "L'article doit être marqué SOLD");

        // 6. Suivi de livraison pas à pas jusqu'à DELIVERED
        UpdateDeliveryStatusRequest delivReq1 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.IN_TRANSIT)
                .carrierName("Express Moto Dakar")
                .carrierPhone("+221770001122")
                .notes("Colis récupéré chez Aminata, en route vers Liberté 6")
                .build();
        DeliveryDto deliv1 = deliveryService.updateDeliveryStatus(order.getDelivery().getId(), delivReq1, sellerUser);
        assertEquals(DeliveryStatus.IN_TRANSIT.name(), deliv1.getStatus());

        UpdateDeliveryStatusRequest delivReq2 = UpdateDeliveryStatusRequest.builder()
                .status(DeliveryStatus.DELIVERED)
                .notes("Colis remis à l'acheteur")
                .build();
        DeliveryDto deliv2 = deliveryService.updateDeliveryStatus(order.getDelivery().getId(), delivReq2, sellerUser);
        assertEquals(DeliveryStatus.DELIVERED.name(), deliv2.getStatus());

        // 7. Confirmation de réception par l'acheteur et libération des fonds
        OrderDto completedOrder = orderService.confirmReceipt(order.getId(), buyerUser);
        assertEquals(OrderStatus.COMPLETED.name(), completedOrder.getStatus());
        assertEquals(EscrowStatus.RELEASED_TO_SELLER.name(), completedOrder.getPayment().getEscrowStatus(),
                "Les fonds doivent être libérés au vendeur");

        // 8. Évaluation et notation du vendeur (5 étoiles)
        CreateReviewRequest reviewReq = CreateReviewRequest.builder()
                .orderId(order.getId())
                .rating(5)
                .comment("Article splendide, vendeur ponctuel et réactif ! Recommandé.")
                .build();

        ReviewDto review = reviewService.createReview(reviewReq, buyerUser);
        assertNotNull(review.getId());
        assertEquals(5, review.getRating());

        // 9. Dashboard Admin KPIs
        AdminDashboardDto dashboard = adminService.getDashboardStats();
        assertNotNull(dashboard);
        assertTrue(dashboard.getTotalOrders() >= 1);
        assertTrue(dashboard.getTotalCommissions().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(dashboard.getTotalValidationFees().compareTo(BigDecimal.ZERO) > 0);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
