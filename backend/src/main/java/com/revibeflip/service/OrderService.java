package com.revibeflip.service;

import com.revibeflip.dto.CreateOrderRequest;
import com.revibeflip.dto.DeliveryDto;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.PaymentDto;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Service Métier : Gestion du cycle de vie des Commandes et du Séquestre (Escrow).
 *
 * <p>Responsabilités principales selon les principes de Clean Architecture :</p>
 * <ul>
 *   <li>Validation stricte des règles métier (compte non suspendu, article actif, anti-doublon d'achat).</li>
 *   <li>Calcul dynamique des frais de protection sous séquestre (1%) et commissions plateforme.</li>
 *   <li>Transition d'état sécurisée (PENDING_PAYMENT -> PAID_ESCROW_LOCKED -> SHIPPED -> DELIVERED -> COMPLETED).</li>
 *   <li>Libération conditionnelle des fonds séquestrés vers le vendeur après confirmation acheteur.</li>
 * </ul>
 *
 * @author Équipe Ingénierie ReVibe FliP
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final PlatformSettingRepository platformSettingRepository;
    private final CartRepository cartRepository;
    private final PaymentService paymentService;

    private final Random random = new Random();

    /**
     * Crée une nouvelle commande avec verrouillage des fonds sous séquestre.
     *
     * @param request Données de la commande (article, mode de livraison, coordonnées destinataire).
     * @param buyer   Utilisateur acheteur authentifié.
     * @return OrderDto DTO enrichi représentant la commande créée.
     * @throws IllegalStateException Si l'acheteur est suspendu ou si l'article est indisponible.
     * @throws IllegalArgumentException Si l'acheteur tente d'acheter son propre article.
     */
    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, User buyer) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Vous ne pouvez pas passer de commande.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (!ProductStatus.ACTIVE.equals(product.getStatus())) {
            throw new IllegalStateException("Cet article n'est plus disponible à l'achat.");
        }

        if (orderRepository.existsByProductIdAndStatusIn(product.getId(), List.of(
                OrderStatus.PAID_ESCROW_LOCKED,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
        ))) {
            throw new IllegalStateException("Cet article fait déjà l'objet d'une commande en cours ou est déjà vendu.");
        }

        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas acheter votre propre article.");
        }

        // Point 4 : Taux configurables lus depuis la base de données (PlatformSetting)
        BigDecimal currentCommissionRate = platformSettingRepository.findFirstByOrderByIdAsc()
                .map(PlatformSetting::getCommissionRate)
                .orElse(BigDecimal.valueOf(20.0))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal currentValidationFeeRate = platformSettingRepository.findFirstByOrderByIdAsc()
                .map(PlatformSetting::getValidationFeeRate)
                .orElse(BigDecimal.valueOf(1.0))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal itemPrice = product.getPrice();
        // Frais de validation (1%)
        BigDecimal validationFee = itemPrice.multiply(currentValidationFeeRate).setScale(0, RoundingMode.HALF_UP);
        // Delivery fee: 2000 FCFA for home delivery, 0 for in-person handover
        BigDecimal deliveryFee = DeliveryMode.HOME_DELIVERY.equals(request.getDeliveryMode())
                ? BigDecimal.valueOf(2000)
                : BigDecimal.ZERO;

        BigDecimal totalAmount = itemPrice.add(validationFee).add(deliveryFee);

        // Platform commission on the product sale
        BigDecimal platformCommission = itemPrice.multiply(currentCommissionRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal sellerPayout = itemPrice.subtract(platformCommission);

        String orderNumber = "RF-2026-" + String.format("%05d", 10000 + random.nextInt(90000));

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(product.getSeller())
                .product(product)
                .originalPrice(itemPrice)
                .agreedPrice(itemPrice)
                .itemPrice(itemPrice)
                .validationFee(validationFee)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .platformCommission(platformCommission)
                .sellerPayout(sellerPayout)
                .deliveryMode(request.getDeliveryMode())
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryCity(request.getDeliveryCity() != null ? request.getDeliveryCity() : "Dakar")
                .deliveryPhone(request.getDeliveryPhone() != null ? request.getDeliveryPhone() : buyer.getPhone())
                .deliveryNotes(request.getDeliveryNotes())
                .status(OrderStatus.PENDING_PAYMENT)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Create Delivery entry
        String trackingNumber = "TRK-DKR-" + String.format("%05d", 10000 + random.nextInt(90000));
        Delivery delivery = Delivery.builder()
                .order(savedOrder)
                .trackingNumber(trackingNumber)
                .mode(request.getDeliveryMode())
                .status(DeliveryStatus.PENDING)
                .estimatedDelivery(LocalDateTime.now().plusDays(1))
                .carrierName(DeliveryMode.HOME_DELIVERY.equals(request.getDeliveryMode()) ? "Express Moto Dakar" : "Remise en main propre")
                .build();
        deliveryRepository.save(delivery);

        // Nettoyage automatique de l'article dans le panier de l'acheteur s'il y était
        try {
            cartRepository.findByBuyerId(buyer.getId()).ifPresent(cart -> {
                boolean removed = cart.getItems().removeIf(item -> item.getProduct().getId().equals(product.getId()));
                if (removed) {
                    if (cart.getItems().isEmpty()) {
                        cart.setSeller(null);
                    }
                    cartRepository.save(cart);
                }
            });
        } catch (Exception e) {
            log.warn("Impossible de nettoyer le panier de l'acheteur {} : {}", buyer.getId(), e.getMessage());
        }

        // Notify seller of new pending order
        notificationService.createNotification(
                product.getSeller(),
                "Nouvelle intention d'achat !",
                buyer.getFullName() + " a initié une commande pour votre article : " + product.getTitle(),
                NotificationType.ORDER_CREATED,
                "/orders/" + savedOrder.getId()
        );

        return enrichOrderDto(savedOrder);
    }

    /**
     * Récupère une commande par son identifiant avec contrôle d'accès strict (RBAC).
     *
     * @param id          Identifiant unique de la commande.
     * @param currentUser Utilisateur tentant d'accéder à la commande.
     * @return OrderDto Détails complets de la commande avec livraison et paiement.
     * @throws org.springframework.security.access.AccessDeniedException Si l'utilisateur n'est ni l'acheteur, ni le vendeur, ni un administrateur.
     */
    public OrderDto getOrderById(Long id, User currentUser) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        boolean isBuyer = order.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = order.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(currentUser.getRole().name());

        if (!isBuyer && !isSeller && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Accès non autorisé à cette commande.");
        }

        return enrichOrderDto(order);
    }

    public List<OrderDto> getUserOrdersAsBuyer(Long buyerId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
                .stream()
                .map(this::enrichOrderDto)
                .collect(Collectors.toList());
    }

    public org.springframework.data.domain.Page<OrderDto> getBuyerOrdersPaginated(Long buyerId, OrderStatus status, org.springframework.data.domain.Pageable pageable) {
        return orderRepository.searchBuyerOrdersPage(buyerId, status, pageable)
                .map(this::enrichOrderDto);
    }

    public List<OrderDto> getUserOrdersAsSeller(Long sellerId) {
        return orderRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::enrichOrderDto)
                .collect(Collectors.toList());
    }

    /**
     * Confirme la réception conforme de l'article par l'acheteur et débloque le séquestre.
     *
     * <p>Conséquences métier :</p>
     * <ul>
     *   <li>Statut commande -> COMPLETED.</li>
     *   <li>Statut livraison -> DELIVERED.</li>
     *   <li>Statut séquestre paiement -> RELEASED_TO_SELLER (versement des gains au vendeur).</li>
     *   <li>Notifications push/in-app envoyées au vendeur et invitation d'avis envoyée à l'acheteur.</li>
     * </ul>
     *
     * @param orderId Identifiant de la commande à valider.
     * @param buyer   Acheteur confirmant la commande.
     * @return OrderDto Commande mise à jour.
     */
    @Transactional
    public OrderDto confirmReceipt(Long orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId()) && !"ROLE_ADMIN".equals(buyer.getRole().name())) {
            throw new org.springframework.security.access.AccessDeniedException("Seul l'acheteur peut confirmer la réception.");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("La confirmation de réception n'est possible qu'une fois la commande livrée (statut actuel : " + order.getStatus() + ").");
        }

        OrderStateMachine.validateTransition(order.getStatus(), OrderStatus.COMPLETED);
        order.setStatus(OrderStatus.COMPLETED);
        Order savedOrder = orderRepository.save(order);

        // Update Delivery status to DELIVERED
        deliveryRepository.findByOrderId(orderId).ifPresent(d -> {
            d.setStatus(DeliveryStatus.DELIVERED);
            if (d.getDeliveredAt() == null) {
                d.setDeliveredAt(LocalDateTime.now());
            }
            deliveryRepository.save(d);
        });

        // Déclenchement du versement net vendeur et écriture immuable au grand livre
        paymentService.releaseFundsToSeller(savedOrder);

        // Notify seller that funds are released
        notificationService.createNotification(
                order.getSeller(),
                "Paiement libéré !",
                "L'acheteur a confirmé la bonne réception de l'article. Le versement de " + order.getSellerPayout() + " FCFA a été déclenché.",
                NotificationType.ORDER_DELIVERED,
                "/orders/" + order.getId()
        );

        // Prompt buyer to leave a review
        notificationService.createNotification(
                order.getBuyer(),
                "Donnez votre avis !",
                "Comment s'est passée votre transaction avec " + order.getSeller().getFullName() + " ? Laissez une note pour aider la communauté.",
                NotificationType.NEW_REVIEW,
                "/orders/" + order.getId()
        );

        return enrichOrderDto(savedOrder);
    }

    public OrderDto enrichOrderDto(Order order) {
        OrderDto dto = OrderDto.fromEntity(order);
        deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> dto.setDelivery(DeliveryDto.fromEntity(d)));
        paymentRepository.findByOrderId(order.getId()).ifPresent(p -> dto.setPayment(PaymentDto.fromEntity(p)));
        return dto;
    }
}
