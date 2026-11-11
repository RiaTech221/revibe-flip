package com.revibeflip.config;

import com.revibeflip.entity.Order;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Script de seed pour le profil 'dev' (jamais activé en production).
 * Initialise 6 commandes échelonnées sur les 7 derniers jours avec différents statuts de livraison,
 * des paiements associés (Wave, Orange Money, Free Money) avec séquestre LOCKED et RELEASED,
 * ainsi que 3 signalements (en attente, résolu, rejeté).
 *
 * NOTE SUR LE SÉQUESTRE :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire de paiement
 * (Wave/Orange Money/Free Money) et la validation du cadre juridique avant la production.
 */
@Component
@Profile("dev")
@org.springframework.core.annotation.Order(10)
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedPlatformSettings();
        seedDiverseProducts();
        seedDevOrdersAndPayments();
        seedDevReports();
        seedDevConversations();
        seedDevReviews();
    }

    private void seedPlatformSettings() {
        if (platformSettingRepository.count() == 0) {
            User admin = userRepository.findByPhone("+221770000000").orElse(null);
            PlatformSetting setting = PlatformSetting.builder()
                    .commissionRate(BigDecimal.valueOf(20.0))
                    .validationFeeRate(BigDecimal.valueOf(1.0))
                    .platformName("ReVibe FliP")
                    .supportEmail("contact@revibeflip.com")
                    .supportPhone("+221770000000")
                    .currency("FCFA")
                    .offerValidityHours(24)
                    .reservationDurationHours(24)
                    .demoMode(true)
                    .updatedBy(admin)
                    .build();
            platformSettingRepository.save(setting);
            log.info("Paramètres de plateforme par défaut initialisés (Commission 20%, Validation 1%).");
        }
    }

    private void seedDevOrdersAndPayments() {
        if (orderRepository.count() > 0) return;

        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) return;

        User fatou = userRepository.findByPhone("+221778889900").orElse(null);
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);

        if (fatou == null || aminata == null || moussa == null) return;

        PlatformSetting setting = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> PlatformSetting.builder().build());

        BigDecimal commRate = setting.getCommissionRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal valFeeRate = setting.getValidationFeeRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        LocalDateTime now = LocalDateTime.now();

        // 6 commandes réparties sur les 7 derniers jours avec statuts de livraison variés
        createOrderWithPayment(products.get(0 % products.size()), fatou, aminata,
                now.minusDays(6).withHour(10).withMinute(30),
                "RF-2026-10101", DeliveryMode.HOME_DELIVERY, DeliveryStatus.PENDING, OrderStatus.PAID_ESCROW_LOCKED,
                PaymentMethod.WAVE, "TXN-WAVE-89210", PaymentStatus.SUCCESS, EscrowStatus.LOCKED,
                commRate, valFeeRate);

        createOrderWithPayment(products.get(1 % products.size()), fatou, moussa,
                now.minusDays(4).withHour(14).withMinute(15),
                "RF-2026-10102", DeliveryMode.HOME_DELIVERY, DeliveryStatus.PICKED_UP, OrderStatus.SHIPPED,
                PaymentMethod.ORANGE_MONEY, "TXN-OM-47201", PaymentStatus.SUCCESS, EscrowStatus.LOCKED,
                commRate, valFeeRate);

        createOrderWithPayment(products.get(2 % products.size()), moussa, aminata,
                now.minusDays(3).withHour(11).withMinute(0),
                "RF-2026-10103", DeliveryMode.HOME_DELIVERY, DeliveryStatus.IN_TRANSIT, OrderStatus.SHIPPED,
                PaymentMethod.FREE_MONEY, "TXN-FREE-31902", PaymentStatus.SUCCESS, EscrowStatus.LOCKED,
                commRate, valFeeRate);

        createOrderWithPayment(products.get(3 % products.size()), fatou, aminata,
                now.minusDays(2).withHour(16).withMinute(45),
                "RF-2026-10104", DeliveryMode.HOME_DELIVERY, DeliveryStatus.OUT_FOR_DELIVERY, OrderStatus.SHIPPED,
                PaymentMethod.WAVE, "TXN-WAVE-99214", PaymentStatus.SUCCESS, EscrowStatus.LOCKED,
                commRate, valFeeRate);

        createOrderWithPayment(products.get(4 % products.size()), aminata, moussa,
                now.minusDays(1).withHour(9).withMinute(20),
                "RF-2026-10105", DeliveryMode.DIRECT_HANDOVER, DeliveryStatus.DELIVERED, OrderStatus.DELIVERED,
                PaymentMethod.ORANGE_MONEY, "TXN-OM-77812", PaymentStatus.SUCCESS, EscrowStatus.LOCKED,
                commRate, valFeeRate);

        createOrderWithPayment(products.get(5 % products.size()), fatou, moussa,
                now.withHour(12).withMinute(10),
                "RF-2026-10106", DeliveryMode.HOME_DELIVERY, DeliveryStatus.DELIVERED, OrderStatus.COMPLETED,
                PaymentMethod.WAVE, "TXN-WAVE-11005", PaymentStatus.SUCCESS, EscrowStatus.RELEASED_TO_SELLER,
                commRate, valFeeRate);

        log.info("6 commandes de test et paiements associés (Wave, Orange Money, Free Money) insérés en profil dev.");
    }

    private void createOrderWithPayment(Product product, User buyer, User seller,
                                        LocalDateTime createdAt, String orderNumber,
                                        DeliveryMode deliveryMode, DeliveryStatus deliveryStatus,
                                        OrderStatus orderStatus, PaymentMethod paymentMethod,
                                        String txnRef, PaymentStatus paymentStatus,
                                        EscrowStatus escrowStatus, BigDecimal commRate, BigDecimal valFeeRate) {
        BigDecimal itemPrice = product.getPrice();
        BigDecimal validationFee = itemPrice.multiply(valFeeRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal deliveryFee = DeliveryMode.HOME_DELIVERY.equals(deliveryMode) ? BigDecimal.valueOf(2000) : BigDecimal.ZERO;
        BigDecimal totalAmount = itemPrice.add(validationFee).add(deliveryFee);
        BigDecimal platformCommission = itemPrice.multiply(commRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal sellerPayout = itemPrice.subtract(platformCommission);

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .product(product)
                .buyer(buyer)
                .seller(seller)
                .itemPrice(itemPrice)
                .validationFee(validationFee)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .platformCommission(platformCommission)
                .sellerPayout(sellerPayout)
                .deliveryMode(deliveryMode)
                .deliveryAddress(buyer.getAddress() != null ? buyer.getAddress() : "Plateau, Rue Carnot")
                .deliveryCity(buyer.getCity() != null ? buyer.getCity() : "Dakar")
                .deliveryPhone(buyer.getPhone())
                .status(orderStatus)
                .deliveryStatus(deliveryStatus)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();

        Order savedOrder = orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(paymentMethod)
                .transactionReference(txnRef)
                .amount(totalAmount)
                .validationFee(validationFee)
                .status(paymentStatus)
                .escrowStatus(escrowStatus)
                .payerPhoneNumber(buyer.getPhone())
                .paymentDate(createdAt)
                .escrowReleasedDate(EscrowStatus.RELEASED_TO_SELLER.equals(escrowStatus) ? createdAt.plusHours(2) : null)
                .createdAt(createdAt)
                .build();

        paymentRepository.save(payment);
    }

    private void seedDevReports() {
        if (reportRepository.count() > 0) return;

        List<Product> products = productRepository.findAll();
        User fatou = userRepository.findByPhone("+221778889900").orElse(null);
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);

        if (fatou == null || aminata == null || moussa == null || products.isEmpty()) return;

        // 1. En attente
        Report r1 = Report.builder()
                .reporter(fatou)
                .reportedProduct(products.get(0))
                .reportedUser(products.get(0).getSeller())
                .reason(ReportReason.MISLEADING_LISTING)
                .details("La couleur réelle du vêtement ne correspond pas aux photos publiées dans l'annonce.")
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(3))
                .build();

        // 2. Résolu
        Report r2 = Report.builder()
                .reporter(aminata)
                .reportedProduct(products.get(1 % products.size()))
                .reportedUser(products.get(1 % products.size()).getSeller())
                .reason(ReportReason.COUNTERFEIT)
                .details("Suspicion de logo imité sur cet article de mode.")
                .status(ReportStatus.RESOLVED)
                .adminNotes("Vérification auprès du vendeur. Annonce réajustée avec mention conforme.")
                .resolvedAt(LocalDateTime.now().minusDays(1))
                .createdAt(LocalDateTime.now().minusDays(4))
                .build();

        // 3. Rejeté (Dismissed)
        Report r3 = Report.builder()
                .reporter(moussa)
                .reportedUser(fatou)
                .reason(ReportReason.ABUSIVE_BEHAVIOR)
                .details("L'acheteur a annulé son offre au dernier moment.")
                .status(ReportStatus.DISMISSED)
                .adminNotes("Signalement non fondé. Les acheteurs ont le droit d'annuler avant le paiement.")
                .resolvedAt(LocalDateTime.now().minusDays(2))
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        reportRepository.saveAll(List.of(r1, r2, r3));
        log.info("3 signalements de test (en attente, résolu, rejeté) insérés en profil dev.");
    }

    private void seedDiverseProducts() {
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        if (aminata == null || moussa == null) return;

        Category mode = categoryRepository.findBySlug("mode-femme")
                .or(() -> categoryRepository.findAll().stream().findFirst()).orElse(null);
        if (mode == null) return;

        // Ajouter un produit en DRAFT et un en INACTIVE pour Aminata s'ils n'existent pas
        if (productRepository.countBySellerIdAndStatus(aminata.getId(), ProductStatus.DRAFT) == 0) {
            Product draft = Product.builder()
                    .seller(aminata)
                    .category(mode)
                    .country(aminata.getCountry())
                    .title("Collier Pendentif Ébène et Argent (Brouillon)")
                    .description("Bijou artisanal traditionnel sénégalais en cours de rédaction.")
                    .price(BigDecimal.valueOf(8000))
                    .condition(ProductCondition.VERY_GOOD)
                    .locationCity("Dakar Plateau")
                    .status(ProductStatus.DRAFT)
                    .build();
            productRepository.save(draft);
        }

        if (productRepository.countBySellerIdAndStatus(aminata.getId(), ProductStatus.INACTIVE) == 0) {
            Product inactive = Product.builder()
                    .seller(aminata)
                    .category(mode)
                    .country(aminata.getCountry())
                    .title("Foulard en Soie Imprimée Wax (Désactivé)")
                    .description("Article temporairement indisponible pour cause de réapprovisionnement.")
                    .price(BigDecimal.valueOf(4500))
                    .condition(ProductCondition.GOOD)
                    .locationCity("Dakar Mermoz")
                    .status(ProductStatus.INACTIVE)
                    .build();
            productRepository.save(inactive);
        }
    }

    private void seedDevConversations() {
        if (conversationRepository.count() > 0) return;

        User fatou = userRepository.findByPhone("+221778889900").orElse(null);
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        List<Product> products = productRepository.findAll();

        if (fatou == null || aminata == null || products.isEmpty()) return;

        // Conversation 1 : Fatou (Acheteur) <-> Aminata (Vendeur)
        Product prod1 = products.get(0);
        Conversation conv1 = Conversation.builder()
                .buyer(fatou)
                .seller(aminata)
                .product(prod1)
                .lastMessagePreview("Bonjour, est-ce que le grand boubou est disponible pour un essayage ?")
                .lastMessageAt(LocalDateTime.now().minusHours(3))
                .build();
        Conversation savedConv1 = conversationRepository.save(conv1);

        Message m1 = Message.builder()
                .conversation(savedConv1)
                .sender(fatou)
                .content("Bonjour Aminata, je suis très intéressée par votre Grand Boubou brodé.")
                .isRead(true)
                .sentAt(LocalDateTime.now().minusHours(4))
                .build();

        Message m2 = Message.builder()
                .conversation(savedConv1)
                .sender(aminata)
                .content("Bonjour Fatou ! Oui il est en parfait état, bazin getzner authentique garanti.")
                .isRead(true)
                .sentAt(LocalDateTime.now().minusHours(3).minusMinutes(30))
                .build();

        Message m3 = Message.builder()
                .conversation(savedConv1)
                .sender(fatou)
                .content("Parfait, est-ce que la livraison vers Mermoz est rapide via Wave ?")
                .isRead(false)
                .sentAt(LocalDateTime.now().minusHours(2))
                .build();

        messageRepository.saveAll(List.of(m1, m2, m3));

        // Conversation 2 : Fatou <-> Moussa
        if (moussa != null && products.size() > 1) {
            Product prod2 = products.get(1);
            Conversation conv2 = Conversation.builder()
                    .buyer(fatou)
                    .seller(moussa)
                    .product(prod2)
                    .lastMessagePreview("Oui le prix est négociable de 1000 FCFA.")
                    .lastMessageAt(LocalDateTime.now().minusDays(1))
                    .build();
            Conversation savedConv2 = conversationRepository.save(conv2);

            Message m2_1 = Message.builder()
                    .conversation(savedConv2)
                    .sender(fatou)
                    .content("Bonjour Moussa, faites-vous une remise sur les baskets ?")
                    .isRead(true)
                    .sentAt(LocalDateTime.now().minusDays(1).minusHours(2))
                    .build();

            Message m2_2 = Message.builder()
                    .conversation(savedConv2)
                    .sender(moussa)
                    .content("Oui le prix est négociable de 1000 FCFA.")
                    .isRead(true)
                    .sentAt(LocalDateTime.now().minusDays(1))
                    .build();

            messageRepository.saveAll(List.of(m2_1, m2_2));
        }

        log.info("Conversations et messages de test insérés avec succès en profil dev.");
    }

    private void seedDevReviews() {
        if (reviewRepository.count() > 0) return;

        List<Order> orders = orderRepository.findAll();
        User fatou = userRepository.findByPhone("+221778889900").orElse(null);
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);

        if (orders.isEmpty() || fatou == null || aminata == null) return;

        // Trouver une commande livrée ou complétée
        Order order1 = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getDeliveryStatus() == DeliveryStatus.DELIVERED)
                .findFirst().orElse(orders.get(0));

        Review rev1 = Review.builder()
                .order(order1)
                .reviewer(fatou)
                .targetUser(aminata)
                .rating(5)
                .comment("Vendeuse exceptionnelle ! Article parfaitement conforme, emballage soigné et remise rapide.")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        reviewRepository.save(rev1);

        if (orders.size() > 1 && moussa != null) {
            Order order2 = orders.get(1);
            // Vérifier que orderId n'est pas déjà dans un review
            if (reviewRepository.findByOrderId(order2.getId()).isEmpty()) {
                Review rev2 = Review.builder()
                        .order(order2)
                        .reviewer(fatou)
                        .targetUser(moussa)
                        .rating(4)
                        .comment("Bonne transaction, envoi conforme et réactif par téléphone.")
                        .createdAt(LocalDateTime.now().minusDays(1))
                        .build();
                reviewRepository.save(rev2);
            }
        }

        log.info("Évaluations et avis clients de test insérés en profil dev.");
    }
}
