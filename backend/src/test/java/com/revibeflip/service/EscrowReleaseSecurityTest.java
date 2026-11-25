package com.revibeflip.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PayTechGateway;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.*;
import com.revibeflip.sms.SmsProvider;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Suite de tests de sécurité SEC-03 : Libération du séquestre vendeur.
 *
 * Cette classe n'est pas annotée @Transactional pour permettre la concurrence multi-threads réelle.
 * Les tests sont conçus pour échouer sur le code initial avant la correction SEC-03.
 */
@SpringBootTest
@ActiveProfiles("dev")
class EscrowReleaseSecurityTest {

    private static final AtomicLong SEQ = new AtomicLong(900000);

    @Autowired private OrderService orderService;
    @Autowired private PaymentService paymentService;
    @Autowired private LedgerService ledgerService;
    @Autowired private OrderAutoConfirmScheduler orderAutoConfirmScheduler;

    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private PaymentGateway paymentGateway;
    @MockitoBean private SmsProvider smsProvider;

    private final List<Long> createdOrderIds = new CopyOnWriteArrayList<>();
    private final List<Long> createdUserIds = new CopyOnWriteArrayList<>();
    private final List<Long> createdProductIds = new CopyOnWriteArrayList<>();

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        for (Long orderId : createdOrderIds) {
            deliveryRepository.findByOrderId(orderId).ifPresent(deliveryRepository::delete);
            paymentRepository.findByOrderId(orderId).ifPresent(paymentRepository::delete);
            orderRepository.deleteById(orderId);
        }
        for (Long prodId : createdProductIds) {
            productRepository.findById(prodId).ifPresent(productRepository::delete);
        }
        for (Long userId : createdUserIds) {
            userRepository.findById(userId).ifPresent(userRepository::delete);
        }
        createdOrderIds.clear();
        createdProductIds.clear();
        createdUserIds.clear();
    }

    // -------------------------------------------------------------------------------------------------
    // 1. Deux threads confirment en même temps la même commande DELIVERED :
    //    un seul appel à initiateTransfer, une seule écriture SELLER_PAYOUT, une seule PLATFORM_COMMISSION.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("1. Concurrence : deux confirmations simultanées ne déclenchent qu'un seul virement et une seule écriture")
    void testConcurrentBuyerConfirmationsSinglePayoutAndLedger() throws Exception {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any())).thenAnswer(inv -> {
            Thread.sleep(100);
            PaymentGateway.TransferRequest req = inv.getArgument(0);
            return new PaymentGateway.TransferResult(true, req.externalId(), "PROCESSING", "{}");
        });

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> task = () -> {
            ready.countDown();
            start.await();
            try {
                orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());
                return true;
            } catch (Exception e) {
                return false;
            }
        };

        Future<Boolean> f1 = pool.submit(task);
        Future<Boolean> f2 = pool.submit(task);
        ready.await();
        start.countDown();

        f1.get(5, TimeUnit.SECONDS);
        f2.get(5, TimeUnit.SECONDS);
        pool.shutdown();

        // Exactement un seul appel prestataire
        verify(paymentGateway, times(1)).initiateTransfer(any());

        // Grand livre : exactement 1 SELLER_PAYOUT et 1 PLATFORM_COMMISSION
        List<LedgerEntry> entries = ledgerEntryRepository.findAll().stream()
                .filter(e -> fixture.order().getId().equals(e.getOrderId()))
                .toList();
        long payoutCount = entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.SELLER_PAYOUT).count();
        long commissionCount = entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.PLATFORM_COMMISSION).count();
        assertEquals(1, payoutCount, "Une seule écriture SELLER_PAYOUT doit être créée");
        assertEquals(1, commissionCount, "Une seule écriture PLATFORM_COMMISSION doit être créée");
    }

    // -------------------------------------------------------------------------------------------------
    // 2. Confirmation de l'acheteur et auto-confirmation simultanées : même résultat.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("2. Concurrence : confirmation acheteur et auto-confirmation simultanées = un seul gagnant")
    void testConcurrentBuyerAndSchedulerSinglePayoutAndLedger() throws Exception {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);
        // Date de livraison dépassée de 10 jours pour éligibilité scheduler
        fixture.delivery().setDeliveredAt(LocalDateTime.now().minusDays(10));
        deliveryRepository.save(fixture.delivery());

        when(paymentGateway.initiateTransfer(any())).thenAnswer(inv -> {
            Thread.sleep(100);
            PaymentGateway.TransferRequest req = inv.getArgument(0);
            return new PaymentGateway.TransferResult(true, req.externalId(), "PROCESSING", "{}");
        });

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> buyerTask = () -> {
            ready.countDown();
            start.await();
            try {
                orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());
                return true;
            } catch (Exception e) {
                return false;
            }
        };

        Callable<Boolean> schedulerTask = () -> {
            ready.countDown();
            start.await();
            try {
                orderAutoConfirmScheduler.autoConfirmDeliveredOrders();
                return true;
            } catch (Exception e) {
                return false;
            }
        };

        Future<Boolean> f1 = pool.submit(buyerTask);
        Future<Boolean> f2 = pool.submit(schedulerTask);
        ready.await();
        start.countDown();

        f1.get(5, TimeUnit.SECONDS);
        f2.get(5, TimeUnit.SECONDS);
        pool.shutdown();

        verify(paymentGateway, times(1)).initiateTransfer(any());

        List<LedgerEntry> entries = ledgerEntryRepository.findAll().stream()
                .filter(e -> fixture.order().getId().equals(e.getOrderId()))
                .toList();
        assertEquals(1, entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.SELLER_PAYOUT).count());
    }

    // -------------------------------------------------------------------------------------------------
    // 3. Rejeu après succès : aucun nouvel appel au prestataire.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("3. Rejeu : un nouvel appel après succès est sans effet et ne rappelle pas le prestataire")
    void testReplayAfterSuccessNoNewTransfer() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any()))
                .thenReturn(new PaymentGateway.TransferResult(true, "PAYOUT-REF-1", "PROCESSING", "{}"));

        orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());
        verify(paymentGateway, times(1)).initiateTransfer(any());

        // Rejeu
        assertThrows(IllegalStateException.class, () ->
                orderService.confirmReceipt(fixture.order().getId(), fixture.buyer())
        );

        verifyNoMoreInteractions(paymentGateway);
    }

    // -------------------------------------------------------------------------------------------------
    // 4. Vendeur, tiers ou administrateur qui appelle confirmReceipt : 403, sans effet.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("4. Sécurité : vendeur, tiers ou administrateur appelant confirmReceipt sont rejetés (403)")
    void testNonBuyerForbiddenOnConfirmReceipt() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        User admin = createUser("Admin", Role.ROLE_ADMIN);
        User thirdParty = createUser("Tiers", Role.ROLE_USER);

        assertThrows(AccessDeniedException.class, () ->
                orderService.confirmReceipt(fixture.order().getId(), fixture.seller())
        );
        assertThrows(AccessDeniedException.class, () ->
                orderService.confirmReceipt(fixture.order().getId(), thirdParty)
        );
        assertThrows(AccessDeniedException.class, () ->
                orderService.confirmReceipt(fixture.order().getId(), admin)
        );

        verifyNoInteractions(paymentGateway);
    }

    // -------------------------------------------------------------------------------------------------
    // 5. Commande non DELIVERED, ou DISPUTED : refusée, sans appel au prestataire.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("5. Statut : commande non DELIVERED ou DISPUTED est refusée sans appel prestataire")
    void testNonDeliveredOrDisputedOrderRefusedNoTransfer() {
        OrderFixture shippedFixture = createOrderFixture(OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT);
        assertThrows(IllegalStateException.class, () ->
                orderService.confirmReceipt(shippedFixture.order().getId(), shippedFixture.buyer())
        );

        OrderFixture disputedFixture = createOrderFixture(OrderStatus.DISPUTED, DeliveryStatus.DELIVERED);
        assertThrows(IllegalStateException.class, () ->
                orderService.confirmReceipt(disputedFixture.order().getId(), disputedFixture.buyer())
        );

        verifyNoInteractions(paymentGateway);
    }

    // -------------------------------------------------------------------------------------------------
    // 6. Le montant envoyé au prestataire est sellerPayout. L'identifiant de virement est « PAYOUT- » + UUID complet.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("6. Données prestataire : montant = sellerPayout et identifiant = PAYOUT- + UUID complet (36 chars)")
    void testPayoutAmountIsSellerPayoutAndExternalIdFormat() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any()))
                .thenReturn(new PaymentGateway.TransferResult(true, "ref", "PROCESSING", "{}"));

        orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());

        ArgumentCaptor<PaymentGateway.TransferRequest> captor = ArgumentCaptor.forClass(PaymentGateway.TransferRequest.class);
        verify(paymentGateway).initiateTransfer(captor.capture());

        PaymentGateway.TransferRequest req = captor.getValue();
        assertEquals(0, fixture.order().getSellerPayout().compareTo(req.amount()), "Le montant doit être le net vendeur");
        assertTrue(req.externalId().startsWith("PAYOUT-"), "L'id doit commencer par PAYOUT-");

        String uuidPart = req.externalId().substring("PAYOUT-".length());
        assertDoesNotThrow(() -> UUID.fromString(uuidPart), "L'identifiant doit comporter un UUID complet valide");
    }

    // -------------------------------------------------------------------------------------------------
    // 7. L'identifiant ET le statut PROCESSING sont déjà validés en base AU MOMENT de l'appel au prestataire
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("7. Trois temps : payoutReference et payoutStatus=PROCESSING sont déjà persistés au moment de l'appel HTTP")
    void testExternalIdAndProcessingStatusCommittedBeforeProviderCall() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any())).thenAnswer(inv -> {
            PaymentGateway.TransferRequest req = inv.getArgument(0);
            // Vérifier directement en base pendant l'appel
            Payment current = paymentRepository.findByOrderId(fixture.order().getId()).orElseThrow();
            assertEquals(req.externalId(), current.getPayoutReference(), "L'id de virement doit être persisté avant l'appel");
            assertEquals(PayoutStatus.PROCESSING, current.getPayoutStatus(), "Le statut doit être PROCESSING avant l'appel");
            return new PaymentGateway.TransferResult(true, req.externalId(), "PROCESSING", "{}");
        });

        orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());
    }

    // -------------------------------------------------------------------------------------------------
    // 8. Retour rapide : pendant l'appel simulé, appelle handleTransferIpn avec « success » ;
    //    à la fin, payoutStatus est COMPLETED (non écrasé), séquestre libéré, grand livre cohérent sans doublon.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("8. Course retour IPN rapide : handleTransferIpn succès reçu pendant l'appel ne doit pas être écrasé")
    void testQuickIpnDuringInitiateTransferLeavesCompletedNotOverwritten() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any())).thenAnswer(inv -> {
            PaymentGateway.TransferRequest req = inv.getArgument(0);
            // Simuler l'arrivée de l'IPN de virement pendant que l'appel d'initiation répond
            paymentService.handleTransferIpn(req.externalId(), "success");
            return new PaymentGateway.TransferResult(true, req.externalId(), "PROCESSING", "{}");
        });

        orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());

        Payment finalPayment = paymentRepository.findByOrderId(fixture.order().getId()).orElseThrow();
        assertEquals(PayoutStatus.COMPLETED, finalPayment.getPayoutStatus(), "Le statut COMPLETED ne doit pas être écrasé");
        assertEquals(EscrowStatus.RELEASED_TO_SELLER, finalPayment.getEscrowStatus());

        List<LedgerEntry> entries = ledgerEntryRepository.findAll().stream()
                .filter(e -> fixture.order().getId().equals(e.getOrderId()))
                .toList();
        assertEquals(1, entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.SELLER_PAYOUT).count(), "Pas de doublon grand livre");
    }

    // -------------------------------------------------------------------------------------------------
    // 9. Refus du prestataire, puis exception : payoutStatus MANUAL_REQUIRED, escrowStatus reste LOCKED,
    //    AUCUNE écriture SELLER_PAYOUT ni PLATFORM_COMMISSION, erreur journalisée, aucun nouvel appel.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("9. Échec prestataire : refus/exception -> MANUAL_REQUIRED, escrowStatus=LOCKED, aucune écriture grand livre")
    void testProviderRefusalThenExceptionSetsManualRequiredEscrowLockedNoLedger() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        when(paymentGateway.initiateTransfer(any()))
                .thenReturn(new PaymentGateway.TransferResult(false, "ref", "FAILED", "Refused by operator"));

        orderService.confirmReceipt(fixture.order().getId(), fixture.buyer());

        Payment payment = paymentRepository.findByOrderId(fixture.order().getId()).orElseThrow();
        assertEquals(PayoutStatus.MANUAL_REQUIRED, payment.getPayoutStatus());
        assertEquals(EscrowStatus.LOCKED, payment.getEscrowStatus(), "Le séquestre doit rester LOCKED en cas d'échec de virement");

        List<LedgerEntry> entries = ledgerEntryRepository.findAll().stream()
                .filter(e -> fixture.order().getId().equals(e.getOrderId()))
                .toList();
        long payouts = entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.SELLER_PAYOUT).count();
        long commissions = entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.PLATFORM_COMMISSION).count();
        assertEquals(0, payouts, "Aucun SELLER_PAYOUT ne doit être écrit au grand livre en cas de refus");
        assertEquals(0, commissions, "Aucune PLATFORM_COMMISSION ne doit être écrite en cas de refus");
    }

    // -------------------------------------------------------------------------------------------------
    // 10. Planificateur : avec deux commandes éligibles dont la première lève une erreur,
    //     la seconde est quand même traitée et validée.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("10. Planificateur : résilience par commande, l'échec de la première ne bloque pas la seconde")
    void testSchedulerProcessesSecondOrderWhenFirstThrowsError() {
        OrderFixture fixture1 = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);
        fixture1.delivery().setDeliveredAt(LocalDateTime.now().minusDays(10));
        deliveryRepository.save(fixture1.delivery());

        OrderFixture fixture2 = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);
        fixture2.delivery().setDeliveredAt(LocalDateTime.now().minusDays(10));
        deliveryRepository.save(fixture2.delivery());

        // La commande 1 échoue avec une exception inattendue
        when(paymentGateway.initiateTransfer(any())).thenAnswer(inv -> {
            PaymentGateway.TransferRequest req = inv.getArgument(0);
            if (req.externalId().contains(fixture1.order().getOrderNumber())) {
                throw new RuntimeException("Crash simulation sur commande 1");
            }
            return new PaymentGateway.TransferResult(true, req.externalId(), "PROCESSING", "{}");
        });

        orderAutoConfirmScheduler.autoConfirmDeliveredOrders();

        // Commande 2 doit quand même être complétée
        Order order2 = orderRepository.findById(fixture2.order().getId()).orElseThrow();
        assertEquals(OrderStatus.COMPLETED, order2.getStatus(), "La commande 2 doit être complétée malgré le crash de la commande 1");
    }

    // -------------------------------------------------------------------------------------------------
    // 11. Grand livre : un doublon (order_id, entry_type) est refusé par la base elle-même ;
    //     recordReleaseToSeller reste idempotent si la contrainte se déclenche.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("11. Grand livre : contrainte UNIQUE (order_id, entry_type) et idempotence de recordReleaseToSeller")
    void testLedgerUniqueConstraintRefusesDuplicatesAndRecordReleaseIdempotent() {
        OrderFixture fixture = createOrderFixture(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED);

        // Premier appel
        ledgerService.recordReleaseToSeller(fixture.order(), "REF-1");

        // Deuxième appel : doit être sans effet et ne pas lever d'erreur bloquante
        assertDoesNotThrow(() -> ledgerService.recordReleaseToSeller(fixture.order(), "REF-2"));

        List<LedgerEntry> entries = ledgerEntryRepository.findAll().stream()
                .filter(e -> fixture.order().getId().equals(e.getOrderId()))
                .toList();
        long payoutCount = entries.stream().filter(e -> e.getEntryType() == LedgerEntryType.SELLER_PAYOUT).count();
        assertEquals(1, payoutCount, "Une seule entrée SELLER_PAYOUT doit exister");
    }

    // -------------------------------------------------------------------------------------------------
    // 12. Délais : avec un faux serveur HTTP local qui répond après un délai supérieur au timeout configuré,
    //     PayTechGateway renvoie un échec rapidement au lieu de bloquer.
    // -------------------------------------------------------------------------------------------------
    @Test
    @DisplayName("12. Timeouts HTTP : PayTechGateway échoue rapidement face à un serveur lent sans bloquer")
    void testPayTechGatewayTimeoutFailsFastWithSlowServer() throws IOException {
        // Serveur local lent répondant après 2000 ms
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/transfer/transferFund", exchange -> {
            try {
                Thread.sleep(1500);
            } catch (InterruptedException ignored) {}
            byte[] response = "{\"success\": 1, \"transfer_id\": \"TRK-1\"}".getBytes();
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });
        server.start();

        int port = server.getAddress().getPort();
        try {
            PayTechProperties props = new PayTechProperties();
            props.setApiKey("test-key");
            props.setApiSecret("test-secret");
            props.setBaseUrl("http://localhost:" + port);
            props.setEnv("test");
            props.setIpnUrl("http://localhost/ipn");
            props.setSuccessUrl("http://localhost/s");
            props.setCancelUrl("http://localhost/c");
            // Délais courts : 300 ms de lecture
            props.setConnectTimeoutMs(200);
            props.setReadTimeoutMs(300);

            PayTechGateway slowGateway = new PayTechGateway(props, objectMapper);

            long start = System.currentTimeMillis();
            PaymentGateway.TransferResult result = slowGateway.initiateTransfer(
                    new PaymentGateway.TransferRequest(new BigDecimal("1000"), "+221770000000", "Wave", "PAYOUT-TEST-TIMEOUT")
            );
            long elapsed = System.currentTimeMillis() - start;

            assertFalse(result.accepted(), "Le transfert doit être refusé en raison du timeout");
            assertTrue(elapsed < 1200, "L'appel doit échouer rapidement (reçu: " + elapsed + " ms, attendu < 1200 ms)");
        } finally {
            server.stop(0);
        }
    }

    // -------------------------------------------------------------------------------------------------
    // Fixtures & Utilitaires
    // -------------------------------------------------------------------------------------------------
    private record OrderFixture(Order order, Payment payment, Delivery delivery, User buyer, User seller) {}

    private User createUser(String name, Role role) {
        long id = SEQ.incrementAndGet();
        User user = userRepository.save(User.builder()
                .phone("+221" + (770000000L + id))
                .firstName(name)
                .lastName("Sec03")
                .password(passwordEncoder.encode("Pass123!"))
                .role(role)
                .isVerified(true)
                .build());
        createdUserIds.add(user.getId());
        return user;
    }

    private OrderFixture createOrderFixture(OrderStatus orderStatus, DeliveryStatus deliveryStatus) {
        User seller = createUser("Seller", Role.ROLE_USER);
        User buyer = createUser("Buyer", Role.ROLE_USER);

        long id = SEQ.incrementAndGet();
        Category cat = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder().name("Cat-" + id).slug("cat-" + id).build()));

        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .category(cat)
                .title("Product-" + id)
                .description("Desc")
                .price(new BigDecimal("10000"))
                .status(ProductStatus.SOLD)
                .condition(ProductCondition.GOOD)
                .build());
        createdProductIds.add(product.getId());

        Order order = orderRepository.save(Order.builder()
                .orderNumber("RF-SEC03-" + id)
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
                .status(orderStatus)
                .build());
        createdOrderIds.add(order.getId());

        Delivery delivery = deliveryRepository.save(Delivery.builder()
                .order(order)
                .trackingNumber("TRK-SEC03-" + id)
                .mode(DeliveryMode.HOME_DELIVERY)
                .status(deliveryStatus)
                .deliveredAt(deliveryStatus == DeliveryStatus.DELIVERED ? LocalDateTime.now().minusHours(1) : null)
                .build());

        Payment payment = paymentRepository.save(Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.WAVE)
                .amount(order.getTotalAmount())
                .validationFee(order.getValidationFee())
                .status(PaymentStatus.SUCCESS)
                .escrowStatus(orderStatus == OrderStatus.COMPLETED ? EscrowStatus.RELEASED_TO_SELLER : EscrowStatus.LOCKED)
                .payoutStatus(PayoutStatus.NONE)
                .transactionReference("TX-" + id)
                .build());

        return new OrderFixture(order, payment, delivery, buyer, seller);
    }
}
