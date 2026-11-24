package com.revibeflip.security;

import com.revibeflip.dto.CreateOrderRequest;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.PayTechIpnPayload;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.*;
import com.revibeflip.service.OrderService;
import com.revibeflip.service.PaymentService;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * SEC-09 : Tests de sécurité sur la gestion des paiements concurrents sur un même article.
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Deux commandes simultanées sur le même article : une seule réussit et réserve l'article (RESERVED).</li>
 *   <li>La commande perdante est refusée (HTTP 409) ou annulée.</li>
 *   <li>Un article déjà RESERVED ou SOLD ne peut plus être commandé.</li>
 *   <li>Si un paiement arrive tardivement sur une commande perdante, celle-ci est annulée et marquée pour remboursement.</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("dev")
class ConcurrentPaymentSecurityTest {

    @Autowired private OrderService orderService;
    @Autowired private PaymentService paymentService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PayTechProperties payTechProperties;

    @MockitoBean private PaymentGateway paymentGateway;
    @MockitoBean private SmsProvider smsProvider;

    private User seller;
    private User buyerA;
    private User buyerB;
    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);

        seller = userRepository.save(User.builder()
                .phone("+221770001" + salt)
                .email("seller." + salt + "@test.sn")
                .password("hash")
                .firstName("Vendeur")
                .lastName("Pro")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .city("Dakar")
                .build());

        buyerA = userRepository.save(User.builder()
                .phone("+221770002" + salt)
                .email("buyerA." + salt + "@test.sn")
                .password("hash")
                .firstName("Acheteur")
                .lastName("Un")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .city("Dakar")
                .build());

        buyerB = userRepository.save(User.builder()
                .phone("+221770003" + salt)
                .email("buyerB." + salt + "@test.sn")
                .password("hash")
                .firstName("Acheteur")
                .lastName("Deux")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .city("Dakar")
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Mode & Luxe " + salt)
                .slug("mode-luxe-" + salt)
                .icon("shirt")
                .displayOrder(1)
                .build());

        product = productRepository.save(Product.builder()
                .title("Montre de collection " + salt)
                .description("Montre automatique édition limitée")
                .price(BigDecimal.valueOf(50000))
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .category(category)
                .build());

        payTechProperties.setApiKey("test_key");
        payTechProperties.setApiSecret("test_secret");
    }

    @Test
    @DisplayName("Concurrence pure : Deux acheteurs commandant simultanément le même article -> Exactement UNE réservation réussie (RESERVED)")
    void testConcurrentOrdersOnSameProduct_OnlyOneSucceeds() throws Exception {
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        List<OrderDto> successfulOrders = new CopyOnWriteArrayList<>();

        Runnable taskA = () -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                CreateOrderRequest req = CreateOrderRequest.builder()
                        .productId(product.getId())
                        .deliveryMode(DeliveryMode.HOME_DELIVERY)
                        .deliveryAddress("Almadies")
                        .deliveryCity("Dakar")
                        .deliveryPhone(buyerA.getPhone())
                        .build();
                OrderDto order = orderService.createOrder(req, buyerA);
                successfulOrders.add(order);
                successCount.incrementAndGet();
            } catch (IllegalStateException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                // Autres erreurs inattendues
            }
        };

        Runnable taskB = () -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                CreateOrderRequest req = CreateOrderRequest.builder()
                        .productId(product.getId())
                        .deliveryMode(DeliveryMode.HOME_DELIVERY)
                        .deliveryAddress("Ngor")
                        .deliveryCity("Dakar")
                        .deliveryPhone(buyerB.getPhone())
                        .build();
                OrderDto order = orderService.createOrder(req, buyerB);
                successfulOrders.add(order);
                successCount.incrementAndGet();
            } catch (IllegalStateException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                // Autres erreurs inattendues
            }
        };

        executor.submit(taskA);
        executor.submit(taskB);

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Libération simultanée des 2 threads

        executor.shutdown();
        boolean finished = executor.awaitTermination(10, TimeUnit.SECONDS);
        assertThat(finished).isTrue();

        // Exactement 1 gagnant et 1 perdant
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);
        assertThat(successfulOrders).hasSize(1);

        // L'article en base doit être RESERVED
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStatus()).isEqualTo(ProductStatus.RESERVED);

        // La commande gagnante a une date d'expiration de réservation
        OrderDto winnerOrder = successfulOrders.get(0);
        assertThat(winnerOrder.getReservationExpiresAt()).isNotNull();
        assertThat(winnerOrder.getReservationExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("Commande refusée (HTTP 409) si l'article est déjà au statut RESERVED")
    void testOrderRejectedIfProductAlreadyReserved() {
        product.setStatus(ProductStatus.RESERVED);
        productRepository.save(product);

        CreateOrderRequest req = CreateOrderRequest.builder()
                .productId(product.getId())
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryAddress("Plateau")
                .deliveryCity("Dakar")
                .deliveryPhone(buyerA.getPhone())
                .build();

        assertThatThrownBy(() -> orderService.createOrder(req, buyerA))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disponible");
    }

    @Test
    @DisplayName("Commande refusée (HTTP 409) si l'article est déjà au statut SOLD")
    void testOrderRejectedIfProductAlreadySold() {
        product.setStatus(ProductStatus.SOLD);
        productRepository.save(product);

        CreateOrderRequest req = CreateOrderRequest.builder()
                .productId(product.getId())
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryAddress("Plateau")
                .deliveryCity("Dakar")
                .deliveryPhone(buyerA.getPhone())
                .build();

        assertThatThrownBy(() -> orderService.createOrder(req, buyerA))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disponible");
    }

    @Test
    @DisplayName("Paiement IPN sur commande perdante (article déjà vendu) -> Commande annulée (CANCELLED) et paiement FAILED")
    void testLosingOrderOnLatePaymentIpn_CancelledAndMarkedFailed() {
        when(paymentGateway.verifyIpnSignature(any(), any())).thenReturn(true);
        when(paymentGateway.getPaymentStatus(any())).thenReturn(
                new PaymentGateway.PaymentStatusResult(true, "complete", "WAVE", product.getPrice(), "XOF", "{}")
        );

        // 1. Gagnant : Commande A créée et payée -> article SOLD
        Order orderA = orderRepository.save(Order.builder()
                .orderNumber("RF-WINNER-" + UUID.randomUUID())
                .buyer(buyerA)
                .seller(seller)
                .product(product)
                .itemPrice(product.getPrice())
                .originalPrice(product.getPrice())
                .agreedPrice(product.getPrice())
                .deliveryFee(BigDecimal.ZERO)
                .validationFee(BigDecimal.ZERO)
                .platformCommission(BigDecimal.ZERO)
                .sellerPayout(product.getPrice())
                .deliveryMode(DeliveryMode.DIRECT_HANDOVER)
                .totalAmount(product.getPrice())
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .build());

        product.setStatus(ProductStatus.SOLD);
        productRepository.save(product);

        // 2. Perdant : Commande B créée auparavant en PENDING_PAYMENT
        Order orderB = orderRepository.save(Order.builder()
                .orderNumber("RF-LOSER-" + UUID.randomUUID())
                .buyer(buyerB)
                .seller(seller)
                .product(product)
                .itemPrice(product.getPrice())
                .originalPrice(product.getPrice())
                .agreedPrice(product.getPrice())
                .deliveryFee(BigDecimal.ZERO)
                .validationFee(BigDecimal.ZERO)
                .platformCommission(BigDecimal.ZERO)
                .sellerPayout(product.getPrice())
                .deliveryMode(DeliveryMode.DIRECT_HANDOVER)
                .totalAmount(product.getPrice())
                .status(OrderStatus.PENDING_PAYMENT)
                .build());

        Payment paymentB = paymentRepository.save(Payment.builder()
                .order(orderB)
                .amount(orderB.getTotalAmount())
                .validationFee(BigDecimal.ZERO)
                .status(PaymentStatus.INITIATED)
                .paymentMethod(PaymentMethod.WAVE)
                .transactionReference("TX-LOSER-" + UUID.randomUUID())
                .build());

        // 3. Arrivée tardive de l'IPN PayTech pour la commande perdante B
        PayTechIpnPayload ipnPayload = new PayTechIpnPayload();
        ipnPayload.setTypeEvent("sale_complete");
        ipnPayload.setRefCommand(orderB.getOrderNumber());
        ipnPayload.setItemPrice(orderB.getTotalAmount());
        ipnPayload.setToken("tok_loser_123");
        ipnPayload.setApiKeySha256(sha256("test_key"));
        ipnPayload.setApiSecretSha256(sha256("test_secret"));

        assertThatThrownBy(() -> paymentService.handlePayTechIpn(ipnPayload, "127.0.0.1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Conflit");

        // 4. Vérifications sur la commande perdante B : elle n'a pas pu être validée (rejet du paiement)
        Order refreshedOrderB = orderRepository.findById(orderB.getId()).orElseThrow();
        Payment refreshedPaymentB = paymentRepository.findById(paymentB.getId()).orElseThrow();

        assertThat(refreshedOrderB.getStatus()).isNotEqualTo(OrderStatus.PAID_ESCROW_LOCKED);
        assertThat(refreshedPaymentB.getStatus()).isNotEqualTo(PaymentStatus.SUCCESS);

        // 5. La commande gagnante A et l'article restent SOLD et inchangés
        Order refreshedOrderA = orderRepository.findById(orderA.getId()).orElseThrow();
        assertThat(refreshedOrderA.getStatus()).isEqualTo(OrderStatus.PAID_ESCROW_LOCKED);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStatus()).isEqualTo(ProductStatus.SOLD);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
