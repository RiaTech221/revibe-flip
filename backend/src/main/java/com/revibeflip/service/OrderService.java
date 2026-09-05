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

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Value("${revibeflip.fees.commission-rate:0.20}")
    private double commissionRate;

    @Value("${revibeflip.fees.validation-fee-rate:0.01}")
    private double validationFeeRate;

    private final Random random = new Random();

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request, User buyer) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (!ProductStatus.ACTIVE.equals(product.getStatus())) {
            throw new IllegalStateException("Cet article n'est plus disponible à l'achat.");
        }

        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas acheter votre propre article.");
        }

        BigDecimal itemPrice = product.getPrice();
        // 1% Validation Fee
        BigDecimal validationFee = itemPrice.multiply(BigDecimal.valueOf(validationFeeRate)).setScale(0, RoundingMode.HALF_UP);
        // Delivery fee: 2000 FCFA for home delivery, 0 for in-person handover
        BigDecimal deliveryFee = DeliveryMode.HOME_DELIVERY.equals(request.getDeliveryMode())
                ? BigDecimal.valueOf(2000)
                : BigDecimal.ZERO;

        BigDecimal totalAmount = itemPrice.add(validationFee).add(deliveryFee);

        // 20% platform commission on the product sale
        BigDecimal platformCommission = itemPrice.multiply(BigDecimal.valueOf(commissionRate)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal sellerPayout = itemPrice.subtract(platformCommission);

        String orderNumber = "RF-2026-" + String.format("%05d", 10000 + random.nextInt(90000));

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(product.getSeller())
                .product(product)
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

    public List<OrderDto> getUserOrdersAsSeller(Long sellerId) {
        return orderRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(this::enrichOrderDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto confirmReceipt(Long orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId()) && !"ROLE_ADMIN".equals(buyer.getRole().name())) {
            throw new org.springframework.security.access.AccessDeniedException("Seul l'acheteur peut confirmer la réception.");
        }

        order.setStatus(OrderStatus.COMPLETED);
        Order savedOrder = orderRepository.save(order);

        // Update Delivery status to DELIVERED
        deliveryRepository.findByOrderId(orderId).ifPresent(d -> {
            d.setStatus(DeliveryStatus.DELIVERED);
            d.setDeliveredAt(LocalDateTime.now());
            deliveryRepository.save(d);
        });

        // Release Escrow funds to seller
        paymentRepository.findByOrderId(orderId).ifPresent(p -> {
            p.setEscrowStatus(EscrowStatus.RELEASED_TO_SELLER);
            p.setEscrowReleasedDate(LocalDateTime.now());
            paymentRepository.save(p);
        });

        // Notify seller that funds are released
        notificationService.createNotification(
                order.getSeller(),
                "Fonds débloqués (Escrow) !",
                "L'acheteur a confirmé la bonne réception de l'article. Vos gains de " + order.getSellerPayout() + " FCFA ont été versés.",
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
