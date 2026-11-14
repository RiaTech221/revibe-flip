package com.revibeflip.config;

import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Script de seed pour le profil 'dev' (ReVibe FliP).
 * Insertion idempotente et sans doublons de 15 commandes réalistes couvrant
 * l'intégralité des 8 statuts sur 30 jours, les 3 moyens de paiement (Wave, Orange Money, Free Money),
 * les fonds séquestrés (LOCKED) et libérés (RELEASED), 3 signalements, et le journal d'audit.
 */
@Component
@Profile("dev")
@org.springframework.core.annotation.Order(100) // S'exécute après DataInitializer
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final CategoryRepository categoryRepository;
    private final CountryRepository countryRepository;
    private final ChatOfferRepository chatOfferRepository;
    private final ReviewRepository reviewRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAll(false);
    }

    /**
     * Initialisation complète idempotente des données de test dev.
     * @param forceReset si true, supprime les données dev existantes pour les réinitialiser à neuf.
     */
    @Transactional
    public void seedAll(boolean forceReset) {
        if (forceReset) {
            log.info("Réinitialisation forcée des données de test dev demandée...");
            orderRepository.deleteByOrderNumberStartingWith("RF-DEV-");
        }

        // 1. TOUJOURS assurer les utilisateurs de test (Admin, Aminata, Moussa, Fatou)
        User admin = ensureUser("+221770000000", "Super", "Admin", "Admin1234!", Role.ROLE_ADMIN, "Almadies, Dakar");
        User aminata = ensureUser("+221771112233", "Aminata", "Diallo", "Passer123!", Role.ROLE_USER, "Mermoz, Dakar");
        User moussa = ensureUser("+221774445566", "Moussa", "Ndiaye", "Passer123!", Role.ROLE_USER, "Plateau, Dakar");
        User fatou = ensureUser("+221778889900", "Fatou", "Sow", "Passer123!", Role.ROLE_USER, "Point E, Dakar");

        // Vérification d'idempotence des commandes : ne pas dupliquer si déjà inséré
        if (orderRepository.countByOrderNumberStartingWith("RF-DEV-") >= 15) {
            log.info("DevDataSeeder: 15 commandes de test dev déjà présentes. Insertion des commandes ignorée pour préserver l'idempotence.");
            return;
        }

        log.info("DevDataSeeder: Début de l'initialisation des 15 commandes et données dev...");

        // 2. Assurer les catégories et produits
        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            products = seedFallbackProducts(aminata, moussa);
        }

        // 3. Assurer les paramètres plateforme (taux de commission et validation)
        PlatformSetting setting = platformSettingRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            PlatformSetting s = PlatformSetting.builder()
                    .commissionRate(BigDecimal.valueOf(20.0))
                    .validationFeeRate(BigDecimal.valueOf(1.0))
                    .platformName("ReVibe FliP")
                    .supportEmail("contact@revibeflip.com")
                    .supportPhone("+221771234567")
                    .currency("FCFA")
                    .build();
            return platformSettingRepository.save(s);
        });

        BigDecimal commRate = setting.getCommissionRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal valFeeRate = setting.getValidationFeeRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        LocalDateTime now = LocalDateTime.now();

        // 4. 15 Commandes réalistes échelonnées sur les 30 derniers jours (tous les statuts couverts)
        List<DevOrderSpec> specs = List.of(
                // 1. Terminée & fonds libérés (Wave) - J-28
                new DevOrderSpec("RF-DEV-00001", fatou, aminata, products.get(0 % products.size()), BigDecimal.valueOf(35000),
                        OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.RELEASED_TO_SELLER, 28),
                // 2. Terminée & fonds libérés (Orange Money) - J-25
                new DevOrderSpec("RF-DEV-00002", fatou, moussa, products.get(1 % products.size()), BigDecimal.valueOf(28000),
                        OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.ORANGE_MONEY, EscrowStatus.RELEASED_TO_SELLER, 25),
                // 3. Terminée & fonds libérés (Free Money) - J-22
                new DevOrderSpec("RF-DEV-00003", fatou, aminata, products.get(2 % products.size()), BigDecimal.valueOf(25000),
                        OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.FREE_MONEY, EscrowStatus.RELEASED_TO_SELLER, 22),
                // 4. Annulée & remboursée à l'acheteur - J-20
                new DevOrderSpec("RF-DEV-00004", moussa, aminata, products.get(3 % products.size()), BigDecimal.valueOf(15000),
                        OrderStatus.CANCELLED, DeliveryStatus.CANCELLED, PaymentMethod.WAVE, EscrowStatus.REFUNDED_TO_BUYER, 20),
                // 5. Expirée avant paiement - J-18
                new DevOrderSpec("RF-DEV-00005", fatou, moussa, products.get(4 % products.size()), BigDecimal.valueOf(12000),
                        OrderStatus.EXPIRED, DeliveryStatus.CANCELLED, null, null, 18),
                // 6. Terminée & fonds libérés (Wave) - J-15
                new DevOrderSpec("RF-DEV-00006", fatou, aminata, products.get(5 % products.size()), BigDecimal.valueOf(42000),
                        OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.RELEASED_TO_SELLER, 15),
                // 7. Payée sous séquestre LOCKED (Orange Money) - J-13
                new DevOrderSpec("RF-DEV-00007", fatou, moussa, products.get(6 % products.size()), BigDecimal.valueOf(22000),
                        OrderStatus.PAID_ESCROW_LOCKED, DeliveryStatus.PENDING, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 13),
                // 8. Expédiée sous séquestre LOCKED (Free Money) - J-10
                new DevOrderSpec("RF-DEV-00008", moussa, aminata, products.get(7 % products.size()), BigDecimal.valueOf(19500),
                        OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT, PaymentMethod.FREE_MONEY, EscrowStatus.LOCKED, 10),
                // 9. Livrée en attente confirmation acheteur (LOCKED) - J-8
                new DevOrderSpec("RF-DEV-00009", fatou, aminata, products.get(8 % products.size()), BigDecimal.valueOf(31000),
                        OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 8),
                // 10. Livrée en attente confirmation acheteur (LOCKED) - J-6
                new DevOrderSpec("RF-DEV-00010", fatou, moussa, products.get(9 % products.size()), BigDecimal.valueOf(18000),
                        OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 6),
                // 11. En litige - bloquée par litige (LOCKED) - J-4
                new DevOrderSpec("RF-DEV-00011", moussa, aminata, products.get(10 % products.size()), BigDecimal.valueOf(14000),
                        OrderStatus.DISPUTED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 4),
                // 12. Expédiée en cours d'acheminement (LOCKED) - J-3
                new DevOrderSpec("RF-DEV-00012", fatou, moussa, products.get(11 % products.size()), BigDecimal.valueOf(27000),
                        OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 3),
                // 13. Payée sous séquestre LOCKED - J-2
                new DevOrderSpec("RF-DEV-00013", fatou, aminata, products.get(12 % products.size()), BigDecimal.valueOf(45000),
                        OrderStatus.PAID_ESCROW_LOCKED, DeliveryStatus.DISPATCHED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 2),
                // 14. En attente de paiement - J-1
                new DevOrderSpec("RF-DEV-00014", fatou, moussa, products.get(13 % products.size()), BigDecimal.valueOf(9500),
                        OrderStatus.PENDING_PAYMENT, DeliveryStatus.PENDING, null, null, 1),
                // 15. En attente de paiement - Aujourd'hui
                new DevOrderSpec("RF-DEV-00015", moussa, aminata, products.get(14 % products.size()), BigDecimal.valueOf(16500),
                        OrderStatus.PENDING_PAYMENT, DeliveryStatus.PENDING, null, null, 0)
        );

        for (DevOrderSpec s : specs) {
            if (orderRepository.existsByOrderNumber(s.orderNumber)) {
                continue;
            }

            LocalDateTime orderDate = now.minusDays(s.daysAgo).minusHours((s.orderNumber.hashCode() % 12 + 12) % 12);
            BigDecimal itemPrice = s.price;
            BigDecimal validationFee = itemPrice.multiply(valFeeRate).setScale(0, RoundingMode.HALF_UP);
            BigDecimal deliveryFee = BigDecimal.valueOf(1500);
            BigDecimal totalAmount = itemPrice.add(validationFee).add(deliveryFee);
            BigDecimal commission = itemPrice.multiply(commRate).setScale(0, RoundingMode.HALF_UP);
            BigDecimal sellerPayout = itemPrice.subtract(commission);

            Order order = Order.builder()
                    .orderNumber(s.orderNumber)
                    .buyer(s.buyer)
                    .seller(s.seller)
                    .product(s.product)
                    .itemPrice(itemPrice)
                    .originalPrice(itemPrice)
                    .agreedPrice(itemPrice)
                    .validationFee(validationFee)
                    .deliveryFee(deliveryFee)
                    .totalAmount(totalAmount)
                    .platformCommission(commission)
                    .sellerPayout(sellerPayout)
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .deliveryAddress("Plateau, Dakar")
                    .deliveryCity("Dakar")
                    .deliveryPhone(s.buyer.getPhone())
                    .status(s.status)
                    .deliveryStatus(s.deliveryStatus)
                    .createdAt(orderDate)
                    .updatedAt(orderDate)
                    .build();

            order = orderRepository.save(order);

            if (s.paymentMethod != null && s.escrowStatus != null) {
                Payment payment = Payment.builder()
                        .order(order)
                        .paymentMethod(s.paymentMethod)
                        .transactionReference("TXN-" + s.orderNumber)
                        .amount(totalAmount)
                        .validationFee(validationFee)
                        .status(s.status == OrderStatus.CANCELLED ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS)
                        .escrowStatus(s.escrowStatus)
                        .payerPhoneNumber(s.buyer.getPhone())
                        .createdAt(orderDate)
                        .paymentDate(orderDate)
                        .build();
                paymentRepository.save(payment);
            }
        }

        // 5. Signalements de démonstration (3 signalements : PENDING, RESOLVED, DISMISSED)
        if (reportRepository.count() == 0) {
            Report r1 = Report.builder()
                    .reporter(fatou)
                    .reportedProduct(products.get(10 % products.size()))
                    .reason(ReportReason.MISLEADING_LISTING)
                    .details("La commande reçue ne correspond pas à l'annonce.")
                    .status(ReportStatus.PENDING)
                    .createdAt(now.minusDays(2))
                    .build();

            Report r2 = Report.builder()
                    .reporter(aminata)
                    .reportedProduct(products.get(0))
                    .reason(ReportReason.COUNTERFEIT)
                    .details("Vérification demandée pour authenticité.")
                    .status(ReportStatus.RESOLVED)
                    .adminNotes("Document d'achat fourni et vérifié par l'équipe.")
                    .createdAt(now.minusDays(7))
                    .resolvedAt(now.minusDays(5))
                    .build();

            Report r3 = Report.builder()
                    .reporter(moussa)
                    .reportedUser(fatou)
                    .reason(ReportReason.OTHER)
                    .details("L'acheteur a changé d'avis sans motif valable.")
                    .status(ReportStatus.DISMISSED)
                    .adminNotes("Conforme aux conditions de rétractation.")
                    .createdAt(now.minusDays(12))
                    .resolvedAt(now.minusDays(10))
                    .build();

            reportRepository.saveAll(List.of(r1, r2, r3));
            log.info("DevDataSeeder: 3 signalements (en attente, résolu, rejeté) insérés.");
        }

        // 6. Actions dans le journal d'audit (AdminActionLog)
        if (adminActionLogRepository.count() == 0 && admin != null) {
            List<AdminActionLog> logs = List.of(
                    AdminActionLog.builder().admin(admin).actionType("SETTINGS_UPDATE").targetType("PLATFORM_SETTING").targetId("1").details("Validation paramètres commission 20% et frais 1%").createdAt(now.minusDays(20)).build(),
                    AdminActionLog.builder().admin(admin).actionType("PRODUCT_STATUS_UPDATE").targetType("PRODUCT").targetId(products.get(0).getId().toString()).details("Modération annonce Bazin Riche validée").createdAt(now.minusDays(15)).build(),
                    AdminActionLog.builder().admin(admin).actionType("REPORT_RESOLVED").targetType("REPORT").targetId("2").details("Résolution signalement authenticité conforme").createdAt(now.minusDays(5)).build(),
                    AdminActionLog.builder().admin(admin).actionType("USER_REACTIVATE").targetType("USER").targetId(moussa.getId().toString()).details("Validation profil vendeur vérifié").createdAt(now.minusDays(3)).build(),
                    AdminActionLog.builder().admin(admin).actionType("ESCROW_PAYOUT").targetType("ORDER").targetId("RF-DEV-00001").details("Libération des fonds séquestre vendeur").createdAt(now.minusDays(1)).build()
            );
            adminActionLogRepository.saveAll(logs);
            log.info("DevDataSeeder: Journal d'audit initialisé avec 5 actions d'administration.");
        }

        // 7. Message de contact pour bandeau « À traiter »
        if (contactMessageRepository.count() == 0) {
            ContactMessage msg = ContactMessage.builder()
                    .fullName("Awa Diop")
                    .email("awa.diop@example.com")
                    .phone("+221773334455")
                    .subject("Question sur les délais de livraison à Thiès")
                    .message("Bonjour, livrez-vous hors de Dakar notamment à Thiès et Mbour ?")
                    .status(ContactMessageStatus.NEW)
                    .createdAt(now.minusHours(6))
                    .build();
            contactMessageRepository.save(msg);
            log.info("DevDataSeeder: 1 message de contact non traité créé pour le bandeau à traiter.");
        }

        // 8. Données spécifiques pour l'Espace Vendeur (pour Aminata et Moussa)
        // 8.1. Annonce désactivée par modération pour Aminata
        if (productRepository.countBySellerIdAndDeactivationReasonIsNotNull(aminata.getId()) == 0) {
            Product disabledP = Product.builder()
                    .title("Robe Soirée Dentelle Défectueuse")
                    .description("Robe de soirée élégante.")
                    .price(BigDecimal.valueOf(18000))
                    .originalPrice(BigDecimal.valueOf(25000))
                    .seller(aminata)
                    .category(products.get(0).getCategory())
                    .condition(ProductCondition.GOOD)
                    .status(ProductStatus.INACTIVE)
                    .deactivationReason("Photos non conformes aux directives de la communauté (floues / manque de détail)")
                    .locationCity("Dakar")
                    .build();
            productRepository.save(disabledP);
        }

        // 8.2. Offres de négociation pour Aminata et Moussa
        if (chatOfferRepository.count() == 0) {
            Product prodAminata = products.stream().filter(p -> p.getSeller().getId().equals(aminata.getId())).findFirst().orElse(products.get(0));
            Product prodMoussa = products.stream().filter(p -> p.getSeller().getId().equals(moussa.getId())).findFirst().orElse(products.get(1));

            // Conversation Fatou -> Aminata
            Conversation convAminata = conversationRepository.findByProductAndUsers(prodAminata.getId(), fatou.getId(), aminata.getId())
                    .orElseGet(() -> conversationRepository.save(Conversation.builder()
                            .buyer(fatou)
                            .seller(aminata)
                            .product(prodAminata)
                            .lastMessagePreview("Pouvez-vous me faire un prix à 25 000 FCFA ?")
                            .lastMessageAt(now.minusHours(1))
                            .build()));

            ChatOffer offer1 = ChatOffer.builder()
                    .conversation(convAminata)
                    .seller(aminata)
                    .buyer(fatou)
                    .product(prodAminata)
                    .initialPrice(prodAminata.getPrice())
                    .agreedPrice(BigDecimal.valueOf(25000))
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .deliveryFee(BigDecimal.valueOf(1500))
                    .validationFee(BigDecimal.valueOf(250))
                    .totalAmount(BigDecimal.valueOf(26750))
                    .validityHours(24)
                    .expiresAt(now.plusHours(2)) // Expire dans moins de 2h pour déclencher le conseil contextuel
                    .status(OfferStatus.OFFER_SENT)
                    .createdAt(now.minusHours(22))
                    .build();
            chatOfferRepository.save(offer1);

            // Message non lu dans la conversation avec Aminata
            Message unreadMsgAminata = Message.builder()
                    .conversation(convAminata)
                    .sender(fatou)
                    .content("Bonjour Aminata, j'ai envoyé une offre à 25 000 FCFA. Est-elle toujours disponible ?")
                    .messageType(MessageType.TEXT)
                    .isRead(false)
                    .sentAt(now.minusHours(1))
                    .build();
            messageRepository.save(unreadMsgAminata);

            // Conversation Fatou -> Moussa
            Conversation convMoussa = conversationRepository.findByProductAndUsers(prodMoussa.getId(), fatou.getId(), moussa.getId())
                    .orElseGet(() -> conversationRepository.save(Conversation.builder()
                            .buyer(fatou)
                            .seller(moussa)
                            .product(prodMoussa)
                            .lastMessagePreview("Est-ce que la livraison est possible à Dakar Plateau ?")
                            .lastMessageAt(now.minusHours(3))
                            .build()));

            ChatOffer offer2 = ChatOffer.builder()
                    .conversation(convMoussa)
                    .seller(moussa)
                    .buyer(fatou)
                    .product(prodMoussa)
                    .initialPrice(prodMoussa.getPrice())
                    .agreedPrice(BigDecimal.valueOf(18000))
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .deliveryFee(BigDecimal.valueOf(1500))
                    .validationFee(BigDecimal.valueOf(180))
                    .totalAmount(BigDecimal.valueOf(19680))
                    .validityHours(24)
                    .expiresAt(now.plusHours(18))
                    .status(OfferStatus.OFFER_SENT)
                    .createdAt(now.minusHours(6))
                    .build();
            chatOfferRepository.save(offer2);

            Message unreadMsgMoussa = Message.builder()
                    .conversation(convMoussa)
                    .sender(fatou)
                    .content("Bonjour Moussa, est-ce que la livraison est possible cet après-midi ?")
                    .messageType(MessageType.TEXT)
                    .isRead(false)
                    .sentAt(now.minusHours(3))
                    .build();
            messageRepository.save(unreadMsgMoussa);
        }

        // 8.3. Avis clients vérifiés pour Aminata et Moussa
        if (reviewRepository.count() == 0) {
            Order o1 = orderRepository.findByOrderNumber("RF-DEV-00001").orElse(null);
            Order o2 = orderRepository.findByOrderNumber("RF-DEV-00002").orElse(null);
            Order o3 = orderRepository.findByOrderNumber("RF-DEV-00003").orElse(null);
            Order o6 = orderRepository.findByOrderNumber("RF-DEV-00006").orElse(null);
            Order o10 = orderRepository.findByOrderNumber("RF-DEV-00010").orElse(null);

            List<Review> reviews = new ArrayList<>();
            if (o1 != null) {
                reviews.add(Review.builder()
                        .order(o1)
                        .targetUser(aminata)
                        .reviewer(fatou)
                        .rating(5)
                        .comment("Excellente vendeuse ! Article absolument impeccable, conforme à la description et envoi soigné.")
                        .createdAt(now.minusDays(14))
                        .build());
            }

            if (o3 != null) {
                reviews.add(Review.builder()
                        .order(o3)
                        .targetUser(aminata)
                        .reviewer(fatou)
                        .rating(5)
                        .comment("Très satisfaite de cet achat. Vendeuse réactive et courtoise !")
                        .createdAt(now.minusDays(8))
                        .build());
            }

            if (o6 != null) {
                reviews.add(Review.builder()
                        .order(o6)
                        .targetUser(aminata)
                        .reviewer(fatou)
                        .rating(4)
                        .comment("Bonne qualité générale, tissu agréable et belle finition.")
                        .createdAt(now.minusDays(3))
                        .build());
            }

            if (o2 != null) {
                reviews.add(Review.builder()
                        .order(o2)
                        .targetUser(moussa)
                        .reviewer(fatou)
                        .rating(5)
                        .comment("Vendeur ponctuel et vêtement de très bonne qualité. Je recommande vivement !")
                        .createdAt(now.minusDays(10))
                        .build());
            }

            if (o10 != null) {
                reviews.add(Review.builder()
                        .order(o10)
                        .targetUser(moussa)
                        .reviewer(fatou)
                        .rating(4)
                        .comment("Conforme aux attentes, transaction fluide.")
                        .createdAt(now.minusDays(4))
                        .build());
            }

            if (!reviews.isEmpty()) {
                reviewRepository.saveAll(reviews);
            }
        }

        // 8.4. Notifications pour Aminata et Moussa
        if (notificationRepository.count() == 0) {
            Notification n1 = Notification.builder()
                    .user(aminata)
                    .title("Nouvelle commande payée !")
                    .message("Votre commande #RF-DEV-00013 a été réglée avec succès via Wave. Vous pouvez préparer le colis.")
                    .type(NotificationType.PAYMENT_CONFIRMED)
                    .link("/seller?tab=orders")
                    .isRead(false)
                    .createdAt(now.minusHours(4))
                    .build();

            Notification n2 = Notification.builder()
                    .user(aminata)
                    .title("Offre reçue")
                    .message("Fatou Sow vous a proposé 25 000 FCFA. L'offre expire bientôt.")
                    .type(NotificationType.NEW_OFFER)
                    .link("/seller?tab=orders")
                    .isRead(false)
                    .createdAt(now.minusHours(2))
                    .build();

            Notification n3 = Notification.builder()
                    .user(aminata)
                    .title("Nouvel avis 5 étoiles")
                    .message("Fatou Sow vous a attribué 5 étoiles avec un commentaire élogieux !")
                    .type(NotificationType.NEW_REVIEW)
                    .link("/seller?tab=reviews")
                    .isRead(true)
                    .createdAt(now.minusDays(3))
                    .build();

            Notification n4 = Notification.builder()
                    .user(moussa)
                    .title("Nouvelle commande à traiter")
                    .message("La commande #RF-DEV-00007 est payée sous séquestre. Préparez l'expédition.")
                    .type(NotificationType.PAYMENT_CONFIRMED)
                    .link("/seller?tab=orders")
                    .isRead(false)
                    .createdAt(now.minusHours(5))
                    .build();

            notificationRepository.saveAll(List.of(n1, n2, n3, n4));
        }

        log.info("DevDataSeeder: Insertion idempotente réussie. 15 commandes réparties sur 30j avec Wave, OM, Free, fonds LOCKED & RELEASED.");
    }

    private User ensureUser(String phone, String firstName, String lastName, String rawPassword, Role role, String address) {
        Country senegal = countryRepository.findByCode("SN").orElse(null);
        User u = userRepository.findByPhone(phone).orElseGet(() -> User.builder()
                .phone(phone)
                .firstName(firstName)
                .lastName(lastName)
                .email(firstName.toLowerCase() + "@revibeflip.com")
                .role(role)
                .country(senegal)
                .city("Dakar")
                .address(address)
                .build());
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setIsVerified(true);
        u.setIsSuspended(false);
        u.setRole(role);
        if (u.getEmail() == null || u.getEmail().isBlank()) {
            u.setEmail(firstName.toLowerCase() + "@revibeflip.com");
        }
        return userRepository.save(u);
    }

    private List<Product> seedFallbackProducts(User seller1, User seller2) {
        Country senegal = countryRepository.findByCode("SN").orElse(null);
        Category cat = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category c = Category.builder().name("Mode Générale").slug("mode-generale").active(true).build();
            return categoryRepository.save(c);
        });

        List<Product> list = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            Product p = Product.builder()
                    .title("Article de mode sénégalaise N°" + i)
                    .description("Superbe pièce sélectionnée avec soin pour la communauté ReVibe FliP.")
                    .price(BigDecimal.valueOf(10000 + (i * 2500)))
                    .originalPrice(BigDecimal.valueOf(15000 + (i * 3000)))
                    .seller(i % 2 == 0 ? seller1 : seller2)
                    .category(cat)
                    .country(senegal)
                    .condition(ProductCondition.VERY_GOOD)
                    .status(ProductStatus.ACTIVE)
                    .locationCity("Dakar")
                    .build();
            list.add(productRepository.save(p));
        }
        return list;
    }

    private static class DevOrderSpec {
        final String orderNumber;
        final User buyer;
        final User seller;
        final Product product;
        final BigDecimal price;
        final OrderStatus status;
        final DeliveryStatus deliveryStatus;
        final PaymentMethod paymentMethod;
        final EscrowStatus escrowStatus;
        final int daysAgo;

        DevOrderSpec(String orderNumber, User buyer, User seller, Product product, BigDecimal price,
                     OrderStatus status, DeliveryStatus deliveryStatus,
                     PaymentMethod paymentMethod, EscrowStatus escrowStatus, int daysAgo) {
            this.orderNumber = orderNumber;
            this.buyer = buyer;
            this.seller = seller;
            this.product = product;
            this.price = price;
            this.status = status;
            this.deliveryStatus = deliveryStatus;
            this.paymentMethod = paymentMethod;
            this.escrowStatus = escrowStatus;
            this.daysAgo = daysAgo;
        }
    }
}
