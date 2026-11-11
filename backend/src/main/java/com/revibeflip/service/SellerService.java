package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service central pour l'Espace Vendeur ReVibe FliP.
 * Gère le profil, les annonces, commandes, livraison, messagerie temps réel,
 * transactions, avis et notifications du vendeur avec vérification stricte de propriété.
 *
 * NOTE SUR LE SÉQUESTRE (Point 6) :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire
 * (Wave, Orange Money, Free Money) et la validation du cadre juridique avant la production.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SellerService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final CountryRepository countryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ==========================================
    // 1. COMPTE ET PROFIL VENDEUR
    // ==========================================
    public SellerProfileDto getSellerProfile(User seller) {
        Long sellerId = seller.getId();
        long totalListings = productRepository.countBySellerId(sellerId);
        long activeListings = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.ACTIVE);
        long soldListings = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.SOLD);
        long totalSalesCount = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);

        BigDecimal totalTurnover = orderRepository.sumSellerCompletedTurnover(sellerId);
        if (totalTurnover == null) totalTurnover = BigDecimal.ZERO;

        Double averageRating = reviewRepository.calculateAverageRating(sellerId);
        if (averageRating == null) averageRating = 5.0;
        long reviewCount = reviewRepository.countByTargetUserId(sellerId);

        return SellerProfileDto.builder()
                .id(seller.getId())
                .firstName(seller.getFirstName())
                .lastName(seller.getLastName())
                .fullName(seller.getFullName())
                .phone(seller.getPhone())
                .email(seller.getEmail())
                .countryCode(seller.getCountry() != null ? seller.getCountry().getCode() : "SN")
                .countryName(seller.getCountry() != null ? seller.getCountry().getName() : "Sénégal")
                .city(seller.getCity())
                .address(seller.getAddress())
                .profilePicture(seller.getProfilePicture())
                .isSuspended(Boolean.TRUE.equals(seller.getIsSuspended()))
                .isVerified(Boolean.TRUE.equals(seller.getIsVerified()))
                .memberSince(seller.getCreatedAt())
                .totalListings(totalListings)
                .activeListings(activeListings)
                .soldListings(soldListings)
                .totalSalesCount(totalSalesCount)
                .totalTurnover(totalTurnover)
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .build();
    }

    @Transactional
    public SellerProfileDto updateSellerProfile(User seller, UpdateSellerProfileRequest request) {
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            seller.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            seller.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null) {
            seller.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getCity() != null) {
            seller.setCity(request.getCity().trim());
        }
        if (request.getAddress() != null) {
            seller.setAddress(request.getAddress().trim());
        }
        if (request.getProfilePicture() != null) {
            seller.setProfilePicture(request.getProfilePicture());
        }

        userRepository.save(seller);
        return getSellerProfile(seller);
    }

    // ==========================================
    // 2. TABLEAU DE BORD VENDEUR (DASHBOARD)
    // ==========================================
    public SellerDashboardDto getSellerDashboard(User seller) {
        Long sellerId = seller.getId();

        // Récupération dynamique des taux de la plateforme (Point 2 & 4)
        PlatformSetting settings = platformSettingRepository.findFirstByOrderByIdAsc().orElse(null);
        BigDecimal commissionRate = settings != null ? settings.getCommissionRate() : BigDecimal.valueOf(20.0);
        BigDecimal validationFeeRate = settings != null ? settings.getValidationFeeRate() : BigDecimal.valueOf(1.0);

        long totalProducts = productRepository.countBySellerId(sellerId);
        long activeProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.ACTIVE);
        long soldProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.SOLD);
        long inactiveProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.INACTIVE);
        long draftProducts = productRepository.countBySellerIdAndStatus(sellerId, ProductStatus.DRAFT);

        // Commandes à traiter (PAID_ESCROW_LOCKED) et en cours de livraison (SHIPPED / DELIVERED)
        long ordersToProcess = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PAID_ESCROW_LOCKED);
        long shippedOrders = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.SHIPPED);
        long deliveredOrders = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.DELIVERED);
        long completedOrders = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);

        // Calculs financiers
        BigDecimal turnover = orderRepository.sumSellerCompletedTurnover(sellerId);
        if (turnover == null) turnover = BigDecimal.ZERO;

        BigDecimal commission = orderRepository.sumSellerCommissionPaid(sellerId);
        if (commission == null) commission = BigDecimal.ZERO;

        BigDecimal netEarnings = orderRepository.sumSellerCompletedPayout(sellerId);
        if (netEarnings == null) netEarnings = BigDecimal.ZERO;

        BigDecimal pendingEscrow = orderRepository.sumSellerPendingEscrow(sellerId);
        if (pendingEscrow == null) pendingEscrow = BigDecimal.ZERO;

        Double averageRating = reviewRepository.calculateAverageRating(sellerId);
        if (averageRating == null) averageRating = 5.0;
        long reviewCount = reviewRepository.countByTargetUserId(sellerId);

        long unreadMessagesCount = messageRepository.countTotalUnreadForUser(sellerId);

        // Dernières commandes
        Pageable top5 = PageRequest.of(0, 5, Sort.by("createdAt").descending());
        Page<Order> recentOrdersPage = orderRepository.searchSellerOrdersPage(sellerId, null, null, top5);
        List<OrderDto> recentOrders = recentOrdersPage.getContent().stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());

        return SellerDashboardDto.builder()
                .sellerName(seller.getFullName())
                .sellerPhone(seller.getPhone())
                .sellerCity(seller.getCity())
                .isSuspended(Boolean.TRUE.equals(seller.getIsSuspended()))
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .soldProducts(soldProducts)
                .inactiveProducts(inactiveProducts)
                .draftProducts(draftProducts)
                .ordersToProcess(ordersToProcess)
                .ordersInDelivery(shippedOrders + deliveredOrders)
                .completedOrders(completedOrders)
                .turnover(turnover)
                .platformCommission(commission)
                .netEarnings(netEarnings)
                .pendingEscrow(pendingEscrow)
                .commissionRate(commissionRate)
                .validationFeeRate(validationFeeRate)
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .reviewCount(reviewCount)
                .unreadMessagesCount(unreadMessagesCount)
                .recentOrders(recentOrders)
                .build();
    }

    // ==========================================
    // 3. GESTION DES ANNONCES (AVEC VÉRIFICATION STRICTE DE PROPRIÉTÉ)
    // ==========================================
    public PageResponseDto<ProductDto> getSellerProducts(User seller, String query, ProductStatus status, Pageable pageable) {
        Page<Product> page = productRepository.searchSellerProducts(seller.getId(), query, status, pageable);
        List<ProductDto> dtos = page.getContent().stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public ProductDto getSellerProductById(User seller, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);
        return ProductDto.fromEntity(product);
    }

    @Transactional
    public ProductDto createProduct(User seller, SellerProductRequest request) {
        checkSellerNotSuspended(seller);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Rayon / Catégorie invalide"));

        Country country = seller.getCountry();
        if (request.getCountryCode() != null && !request.getCountryCode().isBlank()) {
            country = countryRepository.findByCode(request.getCountryCode()).orElse(country);
        }

        ProductStatus initialStatus = Boolean.TRUE.equals(request.getIsDraft()) ? ProductStatus.DRAFT : ProductStatus.ACTIVE;

        // Validation photos obligatoires pour publication active
        if (initialStatus == ProductStatus.ACTIVE && (request.getImages() == null || request.getImages().isEmpty())) {
            throw new IllegalArgumentException("Au moins une photo est requise pour publier une annonce active.");
        }

        Product product = Product.builder()
                .seller(seller)
                .category(category)
                .country(country)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .condition(request.getCondition())
                .brand(request.getBrand() != null ? request.getBrand().trim() : null)
                .size(request.getSize() != null ? request.getSize().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .defects(request.getDefects() != null ? request.getDefects().trim() : null)
                .measurements(request.getMeasurements() != null ? request.getMeasurements().trim() : null)
                .locationCity(request.getLocationCity() != null ? request.getLocationCity().trim() : seller.getCity())
                .status(initialStatus)
                .viewCount(0)
                .build();

        Product saved = productRepository.save(product);

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<ProductImage> imageEntities = new ArrayList<>();
            for (int i = 0; i < request.getImages().size(); i++) {
                String url = request.getImages().get(i);
                if (url != null && !url.isBlank()) {
                    imageEntities.add(ProductImage.builder()
                            .product(saved)
                            .imageUrl(url.trim())
                            .isPrimary(i == 0)
                            .displayOrder(i)
                            .build());
                }
            }
            productImageRepository.saveAll(imageEntities);
            saved.setImages(imageEntities);
        }

        log.info("Nouvelle annonce #{} créée par le vendeur {}", saved.getId(), seller.getPhone());
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public ProductDto updateProduct(User seller, Long productId, SellerProductRequest request) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        // RÈGLE MÉTIER : Impossible de modifier le prix d'une annonce ayant une commande en cours
        boolean hasActiveOrders = orderRepository.existsByProductIdAndStatusIn(productId,
                List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID_ESCROW_LOCKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
        if (hasActiveOrders && request.getPrice() != null && request.getPrice().compareTo(product.getPrice()) != 0) {
            throw new IllegalStateException("Impossible de modifier le prix d'une annonce faisant actuellement l'objet d'une commande en cours.");
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Catégorie invalide"));
            product.setCategory(category);
        }

        product.setTitle(request.getTitle().trim());
        product.setDescription(request.getDescription().trim());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        if (request.getCondition() != null) product.setCondition(request.getCondition());
        product.setBrand(request.getBrand());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setDefects(request.getDefects());
        product.setMeasurements(request.getMeasurements());
        if (request.getLocationCity() != null) product.setLocationCity(request.getLocationCity());

        if (Boolean.TRUE.equals(request.getIsDraft())) {
            product.setStatus(ProductStatus.DRAFT);
        } else if (product.getStatus() == ProductStatus.DRAFT) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        // Mise à jour des photos si fournies
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            productImageRepository.deleteByProductId(productId);
            List<ProductImage> imageEntities = new ArrayList<>();
            for (int i = 0; i < request.getImages().size(); i++) {
                String url = request.getImages().get(i);
                if (url != null && !url.isBlank()) {
                    imageEntities.add(ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isPrimary(i == 0)
                            .displayOrder(i)
                            .build());
                }
            }
            productImageRepository.saveAll(imageEntities);
            product.setImages(imageEntities);
        }

        return ProductDto.fromEntity(productRepository.save(product));
    }

    @Transactional
    public ProductDto toggleProductStatus(User seller, Long productId, ProductStatus newStatus) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        if (product.getStatus() == ProductStatus.SOLD) {
            throw new IllegalStateException("Une annonce vendue ne peut pas changer de statut manuellement.");
        }

        product.setStatus(newStatus);
        return ProductDto.fromEntity(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(User seller, Long productId) {
        checkSellerNotSuspended(seller);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Annonce introuvable"));
        checkProductOwnership(seller, product);

        // RÈGLE MÉTIER : Impossible de supprimer une annonce ayant une commande en cours
        boolean hasActiveOrders = orderRepository.existsByProductIdAndStatusIn(productId,
                List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID_ESCROW_LOCKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED));
        if (hasActiveOrders) {
            throw new IllegalStateException("Action impossible : cette annonce est rattachée à une commande en cours de traitement.");
        }

        productImageRepository.deleteByProductId(productId);
        productRepository.delete(product);
        log.info("Annonce #{} supprimée par son vendeur {}", productId, seller.getPhone());
    }

    // ==========================================
    // 4. RÉCEPTION ET TRAITEMENT DES COMMANDES
    // ==========================================
    public PageResponseDto<OrderDto> getSellerOrders(User seller, String query, OrderStatus status, Pageable pageable) {
        Page<Order> page = orderRepository.searchSellerOrdersPage(seller.getId(), query, status, pageable);
        List<OrderDto> dtos = page.getContent().stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public OrderDto getSellerOrderById(User seller, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);
        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto acceptOrder(User seller, Long orderId) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        if (order.getStatus() != OrderStatus.PAID_ESCROW_LOCKED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("La commande n'est pas dans un état permettant son acceptation.");
        }

        // Notification à l'acheteur
        createNotification(order.getBuyer(),
                "Commande acceptée !",
                "Le vendeur a accepté votre commande " + order.getOrderNumber() + ". Préparation en cours.",
                NotificationType.ORDER_CREATED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto refuseOrder(User seller, Long orderId, String reason) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Impossible d'annuler une commande déjà livrée ou finalisée.");
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Remettre les annonces disponibles
        if (order.getProduct() != null) {
            order.getProduct().setStatus(ProductStatus.ACTIVE);
            productRepository.save(order.getProduct());
        }
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem orderItem : order.getItems()) {
                if (orderItem.getProduct() != null) {
                    orderItem.getProduct().setStatus(ProductStatus.ACTIVE);
                    productRepository.save(orderItem.getProduct());
                }
            }
        }

        // Annuler le paiement associé (Remboursement acheteur)
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setEscrowStatus(EscrowStatus.REFUNDED_TO_BUYER);
            paymentRepository.save(payment);
        }

        // Notification à l'acheteur
        createNotification(order.getBuyer(),
                "Commande refusée",
                "Le vendeur a annulé la commande " + order.getOrderNumber() + (reason != null ? " : " + reason : "") + ". Vos fonds vous seront remboursés.",
                NotificationType.ORDER_CREATED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(orderRepository.save(order));
    }

    @Transactional
    public OrderDto markReadyForPickup(User seller, Long orderId) {
        checkSellerNotSuspended(seller);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        checkOrderSellerOwnership(seller, order);

        // Le vendeur fait progresser : PENDING → PICKED_UP
        order.setDeliveryStatus(DeliveryStatus.PICKED_UP);
        order.setStatus(OrderStatus.SHIPPED);

        createNotification(order.getBuyer(),
                "Colis pris en charge !",
                "Votre article pour la commande " + order.getOrderNumber() + " a été remis au transporteur.",
                NotificationType.DELIVERY_STATUS_CHANGED,
                "/orders/" + order.getId());

        return OrderDto.fromEntity(orderRepository.save(order));
    }

    // ==========================================
    // 5. TRANSACTIONS ET GAINS (AVEC DÉCOMPOSITION COMPLÈTE)
    // ==========================================
    public PageResponseDto<SellerTransactionDto> getSellerTransactions(User seller, Pageable pageable) {
        Page<Payment> payments = paymentRepository.findBySellerId(seller.getId(), pageable);
        List<SellerTransactionDto> dtos = payments.getContent().stream()
                .map(this::mapToSellerTransactionDto)
                .collect(Collectors.toList());
        return PageResponseDto.of(payments, dtos);
    }

    public SellerTransactionSummaryDto getSellerTransactionSummary(User seller) {
        Long sellerId = seller.getId();
        BigDecimal gross = orderRepository.sumSellerCompletedTurnover(sellerId);
        if (gross == null) gross = BigDecimal.ZERO;

        BigDecimal comm = orderRepository.sumSellerCommissionPaid(sellerId);
        if (comm == null) comm = BigDecimal.ZERO;

        BigDecimal net = orderRepository.sumSellerCompletedPayout(sellerId);
        if (net == null) net = BigDecimal.ZERO;

        BigDecimal pending = orderRepository.sumSellerPendingEscrow(sellerId);
        if (pending == null) pending = BigDecimal.ZERO;

        long total = paymentRepository.findBySellerId(sellerId, PageRequest.of(0, 1)).getTotalElements();
        long locked = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.PAID_ESCROW_LOCKED) +
                      orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.SHIPPED) +
                      orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.DELIVERED);
        long released = orderRepository.countBySellerIdAndStatus(sellerId, OrderStatus.COMPLETED);

        return SellerTransactionSummaryDto.builder()
                .totalGrossSales(gross)
                .totalCommissionPaid(comm)
                .totalNetPaid(net)
                .pendingEscrow(pending)
                .totalTransactionsCount(total)
                .lockedTransactionsCount(locked)
                .releasedTransactionsCount(released)
                .build();
    }

    private SellerTransactionDto mapToSellerTransactionDto(Payment p) {
        Order order = p.getOrder();
        String title = (order != null && order.getProduct() != null) ? order.getProduct().getTitle() : "Article vendu";
        String img = (order != null && order.getProduct() != null) ? order.getProduct().getPrimaryImageUrl() : null;

        BigDecimal itemPrice = order != null ? order.getItemPrice() : p.getAmount();
        BigDecimal valFee = order != null ? order.getValidationFee() : BigDecimal.ZERO;
        BigDecimal delFee = order != null ? order.getDeliveryFee() : BigDecimal.ZERO;
        BigDecimal comm = order != null ? order.getPlatformCommission() : BigDecimal.ZERO;
        BigDecimal payout = order != null ? order.getSellerPayout() : p.getAmount();

        return SellerTransactionDto.builder()
                .id(p.getId())
                .transactionReference(p.getTransactionReference())
                .orderNumber(order != null ? order.getOrderNumber() : "N/A")
                .orderId(order != null ? order.getId() : null)
                .productTitle(title)
                .productImage(img)
                .itemPrice(itemPrice)
                .validationFee(valFee)
                .deliveryFee(delFee)
                .platformCommission(comm)
                .sellerPayout(payout)
                .paymentMethod(p.getPaymentMethod().name())
                .paymentMethodName(p.getPaymentMethod().getDisplayName())
                .paymentStatus(p.getStatus().name())
                .escrowStatus(p.getEscrowStatus() != null ? p.getEscrowStatus().name() : "LOCKED")
                .createdAt(p.getCreatedAt())
                .releasedAt(p.getEscrowReleasedDate())
                .build();
    }

    // ==========================================
    // 6. ÉVALUATIONS ET SIGNALEMENTS D'AVIS
    // ==========================================
    public PageResponseDto<ReviewDto> getSellerReviews(User seller, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(seller.getId(), pageable);
        List<ReviewDto> dtos = reviews.getContent().stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(reviews, dtos);
    }

    @Transactional
    public void reportReview(User seller, Long reviewId, ReportReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NoSuchElementException("Évaluation introuvable"));

        // Seul le vendeur visé par l'avis peut le signaler comme abusif
        if (!review.getTargetUser().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Vous ne pouvez signaler que les avis laissés sur votre propre profil.");
        }

        Report report = Report.builder()
                .reporter(seller)
                .reportedUser(review.getReviewer())
                .reason(ReportReason.ABUSIVE_BEHAVIOR)
                .details("Signalement d'avis abusif (Avis #" + review.getId() + ") : " +
                        request.getReason() + " - Note : " + review.getRating() + "/5 - Commentaire : \"" + review.getComment() + "\". " +
                        (request.getDetails() != null ? "Détails : " + request.getDetails() : ""))
                .status(ReportStatus.PENDING)
                .build();

        reportRepository.save(report);
        log.info("Avis #{} signalé par le vendeur {} pour abus", reviewId, seller.getPhone());
    }

    // ==========================================
    // 7. MESSAGERIE ACHETEUR-VENDEUR EN TEMPS RÉEL (STOMP)
    // ==========================================
    public List<ConversationSummaryDto> getSellerConversations(User seller) {
        List<Conversation> convs = conversationRepository.findByUser(seller.getId());
        return convs.stream().map(c -> {
            boolean isSellerInConv = c.getSeller().getId().equals(seller.getId());
            User otherUser = isSellerInConv ? c.getBuyer() : c.getSeller();
            long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), seller.getId());

            return ConversationSummaryDto.builder()
                    .id(c.getId())
                    .productId(c.getProduct() != null ? c.getProduct().getId() : null)
                    .productTitle(c.getProduct() != null ? c.getProduct().getTitle() : "Annonce")
                    .productImage(c.getProduct() != null ? c.getProduct().getPrimaryImageUrl() : null)
                    .productPrice(c.getProduct() != null ? c.getProduct().getPrice() : null)
                    .otherUserId(otherUser.getId())
                    .otherUserName(otherUser.getFullName())
                    .otherUserPhone(otherUser.getPhone())
                    .otherUserProfilePicture(otherUser.getProfilePicture())
                    .lastMessagePreview(c.getLastMessagePreview())
                    .lastMessageAt(c.getLastMessageAt())
                    .unreadCount(unread)
                    .isOtherUserSeller(!isSellerInConv)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<ChatMessageDto> getConversationMessages(User user, Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation introuvable"));
        checkConversationParticipant(user, conv);

        // Marquer les messages entrants comme lus
        messageRepository.markAsReadForUser(conversationId, user.getId());

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        return messages.stream().map(m -> ChatMessageDto.builder()
                .id(m.getId())
                .conversationId(conversationId)
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .sentAt(m.getSentAt())
                .isMe(m.getSender().getId().equals(user.getId()))
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(User sender, Long conversationId, String content) {
        checkSellerNotSuspended(sender);
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation introuvable"));
        checkConversationParticipant(sender, conv);

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(content.trim())
                .isRead(false)
                .build();
        Message saved = messageRepository.save(message);

        // Mise à jour aperçu dans conversation
        conv.setLastMessagePreview(content.length() > 80 ? content.substring(0, 80) + "..." : content);
        conv.setLastMessageAt(saved.getSentAt());
        conversationRepository.save(conv);

        ChatMessageDto dto = ChatMessageDto.builder()
                .id(saved.getId())
                .conversationId(conversationId)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .content(saved.getContent())
                .isRead(false)
                .sentAt(saved.getSentAt())
                .isMe(true)
                .build();

        // Envoi en temps réel via WebSocket STOMP
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
            User recipient = conv.getBuyer().getId().equals(sender.getId()) ? conv.getSeller() : conv.getBuyer();
            messagingTemplate.convertAndSend("/topic/users/" + recipient.getId() + "/messages", dto);

            // Création d'une notification push
            createNotification(recipient,
                    "Nouveau message de " + sender.getFullName(),
                    content.length() > 100 ? content.substring(0, 100) + "..." : content,
                    NotificationType.NEW_MESSAGE,
                    "/messages?conversation=" + conversationId);
        } catch (Exception e) {
            log.warn("Impossible d'envoyer le message via WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    // ==========================================
    // 8. NOTIFICATIONS VENDEUR
    // ==========================================
    public PageResponseDto<NotificationDto> getUserNotifications(User user, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<NotificationDto> dtos = page.getContent().stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDto.of(page, dtos);
    }

    public long getUnreadNotificationsCount(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markNotificationAsRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification introuvable"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Accès non autorisé à cette notification.");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user.getId());
    }

    private void createNotification(User target, String title, String message, NotificationType type, String link) {
        if (target == null) return;
        Notification n = Notification.builder()
                .user(target)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    // ==========================================
    // GARDE-FOUS DE SÉCURITÉ ET PROPRIÉTÉ
    // ==========================================
    private void checkSellerNotSuspended(User seller) {
        if (Boolean.TRUE.equals(seller.getIsSuspended())) {
            throw new AccessDeniedException("Votre compte est actuellement suspendu par l'administration de ReVibe FliP.");
        }
    }

    private void checkProductOwnership(User seller, Product product) {
        if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Accès refusé : vous n'êtes pas le propriétaire de cette annonce.");
        }
    }

    private void checkOrderSellerOwnership(User seller, Order order) {
        if (order.getSeller() == null || !order.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Accès refusé : vous n'êtes pas le vendeur associé à cette commande.");
        }
    }

    private void checkConversationParticipant(User user, Conversation conversation) {
        boolean isBuyer = conversation.getBuyer() != null && conversation.getBuyer().getId().equals(user.getId());
        boolean isSeller = conversation.getSeller() != null && conversation.getSeller().getId().equals(user.getId());
        if (!isBuyer && !isSeller) {
            throw new AccessDeniedException("Accès refusé : vous ne participez pas à cette conversation.");
        }
    }
}
