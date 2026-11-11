package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.exception.SellerConflictException;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service métier du panier d'achat mono-vendeur avec détection et prévention des conflits multi-vendeurs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final NotificationService notificationService;
    private final PlatformSettingRepository platformSettingRepository;
    private final ChatService chatService;

    private final Random random = new Random();

    private static final List<OrderStatus> ACTIVE_ORDER_STATUSES = List.of(
            OrderStatus.PAID_ESCROW_LOCKED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
    );

    @Transactional
    public CartDto getCart(User buyer) {
        Cart cart = getOrCreateCart(buyer);
        return buildCartDto(cart);
    }

    @Transactional
    public CartDto addToCart(User buyer, AddToCartRequest request) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Vous ne pouvez pas utiliser le panier.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas ajouter votre propre article au panier.");
        }

        if (!ProductStatus.ACTIVE.equals(product.getStatus())) {
            throw new IllegalStateException("Cet article n'est plus disponible à l'achat.");
        }

        if (orderRepository.existsByProductIdAndStatusIn(product.getId(), ACTIVE_ORDER_STATUSES)) {
            throw new IllegalStateException("Cet article fait déjà l'objet d'une commande en cours ou est déjà vendu.");
        }

        Cart cart = getOrCreateCart(buyer);

        // RÈGLE MONO-VENDEUR
        if (cart.getSeller() != null && !cart.getSeller().getId().equals(product.getSeller().getId()) && !cart.getItems().isEmpty()) {
            if (Boolean.TRUE.equals(request.getForceReplaceSeller())) {
                cart.getItems().clear();
                cart.setSeller(product.getSeller());
            } else {
                throw new SellerConflictException(
                        cart.getSeller().getId(),
                        cart.getSeller().getFullName(),
                        product.getSeller().getId(),
                        product.getSeller().getFullName()
                );
            }
        }

        // Règle seconde main : article unique (quantité = 1, pas de doublon)
        boolean alreadyInCart = cart.getItems().stream()
                .anyMatch(i -> i.getProduct().getId().equals(product.getId()));
        if (alreadyInCart) {
            throw new IllegalStateException("Cet article est déjà dans votre panier.");
        }

        if (cart.getSeller() == null) {
            cart.setSeller(product.getSeller());
        }

        CartItem item = CartItem.builder()
                .cart(cart)
                .product(product)
                .build();
        cart.getItems().add(item);

        Cart saved = cartRepository.save(cart);
        return buildCartDto(saved);
    }

    @Transactional
    public CartDto removeFromCart(User buyer, Long productId) {
        Cart cart = getOrCreateCart(buyer);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));

        if (cart.getItems().isEmpty()) {
            cart.setSeller(null);
        }

        Cart saved = cartRepository.save(cart);
        return buildCartDto(saved);
    }

    @Transactional
    public CartDto clearCart(User buyer) {
        Cart cart = getOrCreateCart(buyer);
        cart.getItems().clear();
        cart.setSeller(null);
        Cart saved = cartRepository.save(cart);
        return buildCartDto(saved);
    }

    @Transactional
    public ConversationDto startDiscussionFromCart(User buyer) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Impossible d'ouvrir une discussion.");
        }

        Cart cart = getOrCreateCart(buyer);
        if (cart.getItems().isEmpty() || cart.getSeller() == null) {
            throw new IllegalStateException("Votre panier est vide.");
        }

        List<Long> productIds = cart.getItems().stream()
                .map(i -> i.getProduct().getId())
                .collect(Collectors.toList());

        Long primaryProductId = productIds.get(0);

        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour ! J'ai sélectionné ").append(cart.getItems().size()).append(" article(s) dans votre boutique :\n");
        for (CartItem item : cart.getItems()) {
            sb.append("• ").append(item.getProduct().getTitle())
              .append(" (").append(item.getProduct().getPrice()).append(" FCFA)\n");
        }
        sb.append("Sous-total : ").append(buildCartDto(cart).getSubtotal()).append(" FCFA.\n");
        sb.append("Pouvons-nous échanger pour finaliser l'achat et la livraison ?");

        StartConversationRequest req = StartConversationRequest.builder()
                .productId(primaryProductId)
                .productIds(productIds)
                .initialMessage(sb.toString())
                .build();

        return chatService.startConversation(req, buyer);
    }

    @Transactional
    public OrderDto checkoutCart(User buyer, CreateOrderFromCartRequest request) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Vous ne pouvez pas commander.");
        }

        Cart cart = getOrCreateCart(buyer);
        if (cart.getItems().isEmpty() || cart.getSeller() == null) {
            throw new IllegalStateException("Votre panier est vide.");
        }

        User seller = cart.getSeller();
        if (seller.getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas commander vos propres articles.");
        }

        List<Product> products = new ArrayList<>();
        BigDecimal itemPriceSum = BigDecimal.ZERO;

        for (CartItem item : cart.getItems()) {
            Product p = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

            if (!p.getSeller().getId().equals(seller.getId())) {
                throw new IllegalStateException("Le panier contient des articles de vendeurs différents.");
            }

            if (!ProductStatus.ACTIVE.equals(p.getStatus())) {
                throw new IllegalStateException("L'article '" + p.getTitle() + "' n'est plus disponible (statut: " + p.getStatus() + "). Veuillez le retirer du panier.");
            }

            if (orderRepository.existsByProductIdAndStatusIn(p.getId(), ACTIVE_ORDER_STATUSES)) {
                throw new IllegalStateException("L'article '" + p.getTitle() + "' fait déjà l'objet d'une commande en cours ou est déjà vendu. Veuillez le retirer du panier.");
            }

            products.add(p);
            itemPriceSum = itemPriceSum.add(p.getPrice());
        }

        // Taux configurables (PlatformSetting)
        BigDecimal currentCommissionRate = platformSettingRepository.findFirstByOrderByIdAsc()
                .map(PlatformSetting::getCommissionRate)
                .orElse(BigDecimal.valueOf(20.0))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal currentValidationFeeRate = platformSettingRepository.findFirstByOrderByIdAsc()
                .map(PlatformSetting::getValidationFeeRate)
                .orElse(BigDecimal.valueOf(1.0))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        // Frais de validation 1% sur le total des articles
        BigDecimal validationFee = itemPriceSum.multiply(currentValidationFeeRate).setScale(0, RoundingMode.HALF_UP);

        // Frais de livraison calculés UNE SEULE FOIS pour l'ensemble de la commande mono-vendeur
        BigDecimal deliveryFee = DeliveryMode.HOME_DELIVERY.equals(request.getDeliveryMode())
                ? BigDecimal.valueOf(2000)
                : BigDecimal.ZERO;

        BigDecimal totalAmount = itemPriceSum.add(validationFee).add(deliveryFee);
        BigDecimal platformCommission = itemPriceSum.multiply(currentCommissionRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal sellerPayout = itemPriceSum.subtract(platformCommission);

        String orderNumber = "RF-2026-" + String.format("%05d", 10000 + random.nextInt(90000));
        Product primaryProduct = products.get(0);

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(seller)
                .product(primaryProduct)
                .itemPrice(itemPriceSum)
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
                .deliveryStatus(DeliveryStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Création des OrderItems
        List<OrderItem> orderItems = new ArrayList<>();
        for (Product p : products) {
            String imgUrl = (p.getImages() != null && !p.getImages().isEmpty())
                    ? p.getImages().get(0).getImageUrl()
                    : null;

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(p)
                    .price(p.getPrice())
                    .title(p.getTitle())
                    .imageUrl(imgUrl)
                    .build();
            orderItems.add(orderItemRepository.save(orderItem));
        }
        savedOrder.setItems(orderItems);

        // Création de la livraison unique pour la commande
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

        // Vider le panier de l'acheteur après la commande
        cart.getItems().clear();
        cart.setSeller(null);
        cartRepository.save(cart);

        // Notification vendeur
        notificationService.createNotification(
                seller,
                "Nouvelle commande groupée (" + products.size() + " article" + (products.size() > 1 ? "s" : "") + ") !",
                buyer.getFullName() + " a commandé " + products.size() + " article(s) dans votre boutique pour " + itemPriceSum + " FCFA.",
                NotificationType.ORDER_CREATED,
                "/orders/" + savedOrder.getId()
        );

        return enrichOrderDto(savedOrder);
    }

    private Cart getOrCreateCart(User buyer) {
        return cartRepository.findByBuyerId(buyer.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .buyer(buyer)
                        .items(new ArrayList<>())
                        .build()));
    }

    private CartDto buildCartDto(Cart cart) {
        List<CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean hasUnavailable = false;

        for (CartItem item : cart.getItems()) {
            Product p = item.getProduct();
            boolean isLocked = orderRepository.existsByProductIdAndStatusIn(p.getId(), ACTIVE_ORDER_STATUSES);
            CartItemDto dto = CartItemDto.fromEntity(item, isLocked);
            itemDtos.add(dto);

            if (!dto.isAvailable()) {
                hasUnavailable = true;
            } else {
                subtotal = subtotal.add(p.getPrice());
            }
        }

        BigDecimal currentValidationFeeRate = platformSettingRepository.findFirstByOrderByIdAsc()
                .map(PlatformSetting::getValidationFeeRate)
                .orElse(BigDecimal.valueOf(1.0))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal validationFee = subtotal.multiply(currentValidationFeeRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal deliveryFee = itemDtos.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(2000);
        BigDecimal total = subtotal.add(validationFee).add(deliveryFee);

        return CartDto.builder()
                .id(cart.getId())
                .sellerId(cart.getSeller() != null ? cart.getSeller().getId() : null)
                .sellerName(cart.getSeller() != null ? cart.getSeller().getFullName() : null)
                .items(itemDtos)
                .subtotal(subtotal)
                .validationFee(validationFee)
                .deliveryFee(deliveryFee)
                .totalAmount(total)
                .totalCount(itemDtos.size())
                .hasUnavailableItems(hasUnavailable)
                .build();
    }

    private OrderDto enrichOrderDto(Order order) {
        OrderDto dto = OrderDto.fromEntity(order);
        deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> dto.setDelivery(DeliveryDto.fromEntity(d)));
        return dto;
    }
}
