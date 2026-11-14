package com.revibeflip;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.*;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.security.SafeMediaService;
import com.revibeflip.service.*;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProductionAuditSecurityTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private PaymentService paymentService;
    @Autowired private OrderService orderService;
    @Autowired private AuthService authService;
    @Autowired private HtmlSanitizerService htmlSanitizerService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;
    @Autowired private PayTechProperties payTechProperties;

    @MockitoBean private PaymentGateway paymentGateway;
    @MockitoBean private SmsProvider smsProvider;

    @BeforeEach
    void setupPayTech() {
        payTechProperties.setApiKey("audit_key");
        payTechProperties.setApiSecret("audit_secret");
        payTechProperties.setEnv("test");
        payTechProperties.setIpnUrl("https://example.test/ipn");
        payTechProperties.setSuccessUrl("https://example.test/success");
        payTechProperties.setCancelUrl("https://example.test/cancel");
    }

    @Test
    @DisplayName("PayTech IPN : signature invalide, écart de montant et idempotence")
    void testPayTechIpnValidationAndIdempotence() {
        User seller = saveUser("+221778000001", "Vendeur", Role.ROLE_USER, false);
        User buyer = saveUser("+221778000002", "Acheteur", Role.ROLE_USER, false);
        Product product = saveProduct(seller, "Robe Audit", new BigDecimal("15000"));
        Order order = saveOrder(buyer, seller, product, "ORD-AUDIT-001", new BigDecimal("15150"));
        Payment payment = savePendingPayment(order, "tok_audit_1");

        // 1. Signature invalide refusée
        PayTechIpnPayload badSig = buildIpn(order.getOrderNumber(), order.getTotalAmount(), "tok_audit_1", "bad_key", "bad_sec");
        when(paymentGateway.verifyIpnSignature("bad_key", "bad_sec")).thenReturn(false);
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> paymentService.handlePayTechIpn(badSig, "127.0.0.1"));

        // 2. Écart de montant refusé
        String kSha = sha256("audit_key");
        String sSha = sha256("audit_secret");
        when(paymentGateway.verifyIpnSignature(kSha, sSha)).thenReturn(true);
        PayTechIpnPayload wrongAmount = buildIpn(order.getOrderNumber(), new BigDecimal("100"), "tok_audit_1", kSha, sSha);
        assertThrows(IllegalStateException.class, () -> paymentService.handlePayTechIpn(wrongAmount, "127.0.0.1"));

        // 3. IPN valide + idempotence (2e appel ignoré sans doublon au grand livre)
        when(paymentGateway.getPaymentStatus("tok_audit_1"))
                .thenReturn(new PaymentGateway.PaymentStatusResult(true, "complete", "Wave", order.getTotalAmount(), "XOF", "{}"));
        PayTechIpnPayload validIpn = buildIpn(order.getOrderNumber(), order.getTotalAmount(), "tok_audit_1", kSha, sSha);

        paymentService.handlePayTechIpn(validIpn, "127.0.0.1");
        long entriesAfterFirst = ledgerEntryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).size();
        assertEquals(2L, entriesAfterFirst);

        paymentService.handlePayTechIpn(validIpn, "127.0.0.1");
        long entriesAfterSecond = ledgerEntryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).size();
        assertEquals(entriesAfterFirst, entriesAfterSecond, "Un IPN reçu deux fois ne doit pas créer d'écriture en double");
    }

    @Test
    @DisplayName("Machine à états & blocage litige : transitions invalides et libération bloquée")
    void testStateMachineAndDisputeLock() {
        assertThrows(IllegalStateException.class,
                () -> OrderStateMachine.validateTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED));

        User seller = saveUser("+221778000003", "Vendeur2", Role.ROLE_USER, false);
        User buyer = saveUser("+221778000004", "Acheteur2", Role.ROLE_USER, false);
        Product product = saveProduct(seller, "Sac Audit", new BigDecimal("10000"));
        Order disputedOrder = saveOrder(buyer, seller, product, "ORD-AUDIT-002", new BigDecimal("10100"));
        disputedOrder.setStatus(OrderStatus.DISPUTED);
        orderRepository.save(disputedOrder);

        assertThrows(IllegalStateException.class, () -> paymentService.releaseFundsToSeller(disputedOrder));
    }

    @Test
    @DisplayName("Concurrence anti-double-vente : deux IPN simultanés sur le même article")
    void testConcurrencyAntiDoubleSale() throws Exception {
        User seller = saveUser("+221778000005", "Vendeur3", Role.ROLE_USER, false);
        User buyer1 = saveUser("+221778000006", "Acheteur3A", Role.ROLE_USER, false);
        User buyer2 = saveUser("+221778000007", "Acheteur3B", Role.ROLE_USER, false);
        Product product = saveProduct(seller, "Article Unique", new BigDecimal("20000"));

        Order order1 = saveOrder(buyer1, seller, product, "ORD-CONC-1", new BigDecimal("20200"));
        Order order2 = saveOrder(buyer2, seller, product, "ORD-CONC-2", new BigDecimal("20200"));
        savePendingPayment(order1, "tok_conc_1");
        savePendingPayment(order2, "tok_conc_2");

        String kSha = sha256("audit_key");
        String sSha = sha256("audit_secret");
        when(paymentGateway.verifyIpnSignature(kSha, sSha)).thenReturn(true);
        when(paymentGateway.getPaymentStatus(any()))
                .thenReturn(new PaymentGateway.PaymentStatusResult(true, "complete", "Wave", new BigDecimal("20200"), "XOF", "{}"));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> task1 = () -> {
            ready.countDown();
            start.await();
            try {
                paymentService.handlePayTechIpn(buildIpn("ORD-CONC-1", new BigDecimal("20200"), "tok_conc_1", kSha, sSha), "127.0.0.1");
                return true;
            } catch (Exception e) {
                return false;
            }
        };
        Callable<Boolean> task2 = () -> {
            ready.countDown();
            start.await();
            try {
                paymentService.handlePayTechIpn(buildIpn("ORD-CONC-2", new BigDecimal("20200"), "tok_conc_2", kSha, sSha), "127.0.0.1");
                return true;
            } catch (Exception e) {
                return false;
            }
        };

        Future<Boolean> f1 = pool.submit(task1);
        Future<Boolean> f2 = pool.submit(task2);
        ready.await();
        start.countDown();

        int successes = (f1.get() ? 1 : 0) + (f2.get() ? 1 : 0);
        pool.shutdown();
        assertEquals(1, successes, "Un seul paiement simultané sur un même article doit réussir");
    }

    @Test
    @DisplayName("OTP : expiration, 5 tentatives max et réponse identique mot de passe oublié")
    void testOtpExpirationAttemptsAndForgotPassword() {
        User user = saveUser("+221778000008", "OtpUser", Role.ROLE_USER, false);
        user.setIsVerified(false);
        user.setOtpCode(passwordEncoder.encode("123456"));
        user.setOtpExpiresAt(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        VerifyOtpRequest expiredReq = VerifyOtpRequest.builder().phone(user.getPhone()).otpCode("123456").build();
        assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(expiredReq));

        // 5 tentatives invalides -> verrouillage
        user.setOtpCode(passwordEncoder.encode("654321"));
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        user.setOtpAttempts(0);
        userRepository.save(user);

        VerifyOtpRequest badReq = VerifyOtpRequest.builder().phone(user.getPhone()).otpCode("000000").build();
        for (int i = 0; i < 5; i++) {
            assertThrows(IllegalArgumentException.class, () -> authService.verifyOtp(badReq));
        }
        User locked = userRepository.findById(user.getId()).orElseThrow();
        assertNull(locked.getOtpCode(), "L'OTP doit être invalidé après 5 échecs");

        // Réponse identique pour numéro existant ou inexistant
        assertDoesNotThrow(() -> authService.forgotPassword("+221779990000", "10.0.0.1"));
        assertDoesNotThrow(() -> authService.forgotPassword(user.getPhone(), "10.0.0.2"));
    }

    @Test
    @DisplayName("Uploads & XSS : faux JPEG, SVG refusés et script HTML nettoyé")
    void testUploadMagicBytesAndXssSanitization() {
        byte[] fakeJpg = "not a real jpeg image content".getBytes(StandardCharsets.UTF_8);
        assertThrows(IllegalArgumentException.class, () -> SafeMediaService.detectType(fakeJpg, false));

        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>".getBytes(StandardCharsets.UTF_8);
        assertThrows(IllegalArgumentException.class, () -> SafeMediaService.detectType(svg, false));

        String dirty = "<p>Bonjour</p><script>alert(1)</script><a href=\"javascript:alert(1)\">clic</a>";
        String clean = htmlSanitizerService.sanitize(dirty);
        assertFalse(clean.toLowerCase().contains("<script"));
        assertFalse(clean.toLowerCase().contains("javascript:"));
    }

    @Test
    @DisplayName("Sécurité JWT : utilisateur suspendu bloqué immédiatement et IDOR refusé")
    void testSuspendedUserJwtBlockedAndIdor() throws Exception {
        User suspended = saveUser("+221778000009", "Suspended", Role.ROLE_USER, true);
        String token = jwtUtil.generateToken(suspended, suspended.getId(), suspended.getRole().name(), suspended.getFullName());

        mockMvc.perform(get("/api/orders/my-orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        User userA = saveUser("+221778000010", "UserA", Role.ROLE_USER, false);
        User userB = saveUser("+221778000011", "UserB", Role.ROLE_USER, false);
        Product product = saveProduct(userB, "Produit B", new BigDecimal("5000"));
        Order orderB = saveOrder(userB, userA, product, "ORD-IDOR-1", new BigDecimal("5050"));

        String tokenA = jwtUtil.generateToken(userA, userA.getId(), userA.getRole().name(), userA.getFullName());
        // UserA n'est ni admin ni l'acheteur (userB) -> confirmReceipt refusé
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> orderService.confirmReceipt(orderB.getId(), userA));
        mockMvc.perform(get("/api/admin/ledger")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    private User saveUser(String phone, String firstName, Role role, boolean suspended) {
        return userRepository.save(User.builder()
                .firstName(firstName)
                .lastName("Audit")
                .phone(phone)
                .password(passwordEncoder.encode("StrongPass123!"))
                .role(role)
                .isVerified(true)
                .isSuspended(suspended)
                .build());
    }

    private Product saveProduct(User seller, String title, BigDecimal price) {
        Category cat = categoryRepository.findAll().stream().findFirst().orElseThrow();
        return productRepository.save(Product.builder()
                .seller(seller)
                .category(cat)
                .title(title)
                .description("Article de test unitaire pour audit production")
                .price(price)
                .condition(ProductCondition.GOOD)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    private Order saveOrder(User buyer, User seller, Product product, String orderNumber, BigDecimal total) {
        return orderRepository.save(Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .itemPrice(product.getPrice())
                .originalPrice(product.getPrice())
                .agreedPrice(product.getPrice())
                .validationFee(new BigDecimal("100"))
                .deliveryFee(BigDecimal.ZERO)
                .totalAmount(total)
                .platformCommission(new BigDecimal("2000"))
                .sellerPayout(product.getPrice().subtract(new BigDecimal("2000")))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .status(OrderStatus.PENDING_PAYMENT)
                .build());
    }

    private Payment savePendingPayment(Order order, String token) {
        return paymentRepository.save(Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.WAVE)
                .amount(order.getTotalAmount())
                .validationFee(order.getValidationFee())
                .status(PaymentStatus.INITIATED)
                .escrowStatus(EscrowStatus.LOCKED)
                .payoutStatus(PayoutStatus.NONE)
                .transactionReference(order.getOrderNumber())
                .paytechToken(token)
                .build());
    }

    private PayTechIpnPayload buildIpn(String ref, BigDecimal amount, String token, String keySha, String secSha) {
        PayTechIpnPayload ipn = new PayTechIpnPayload();
        ipn.setTypeEvent("sale_complete");
        ipn.setRefCommand(ref);
        ipn.setItemPrice(amount);
        ipn.setCurrency("XOF");
        ipn.setPaymentMethod("Wave");
        ipn.setToken(token);
        ipn.setApiKeySha256(keySha);
        ipn.setApiSecretSha256(secSha);
        return ipn;
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
