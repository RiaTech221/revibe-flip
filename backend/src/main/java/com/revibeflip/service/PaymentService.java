package com.revibeflip.service;

import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.Payment;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.PaymentRepository;
import com.revibeflip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;
    private final NotificationService notificationService;
    private final com.revibeflip.service.payment.PaymentGatewayService paymentGatewayService;

    private final Random random = new Random();

    /**
     * Initie un paiement auprès de la passerelle réelle (Wave, Orange Money via Paydunya ou Wave Business).
     */
    @Transactional
    public com.revibeflip.dto.InitiatePaymentResponse initiatePayment(com.revibeflip.dto.InitiatePaymentRequest request, User buyer) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous ne pouvez payer que vos propres commandes.");
        }

        if (OrderStatus.COMPLETED.equals(order.getStatus()) || OrderStatus.PAID_ESCROW_LOCKED.equals(order.getStatus())) {
            throw new IllegalStateException("Cette commande a déjà été payée.");
        }

        String prefix = switch (request.getPaymentMethod()) {
            case WAVE -> "WAVE-SN-";
            case ORANGE_MONEY -> "OM-SN-";
            case FREE_MONEY -> "FREE-SN-";
        };
        String txRef = prefix + System.currentTimeMillis() + "-" + (1000 + random.nextInt(9000));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElse(Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .validationFee(order.getValidationFee())
                        .build());

        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(txRef);
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setPayerPhoneNumber(request.getPhoneNumber());
        paymentRepository.save(payment);

        return paymentGatewayService.initiateCheckout(order, request.getPaymentMethod(), request.getPhoneNumber(), txRef);
    }

    /**
     * Traite la confirmation asynchrone (Webhook / IPN) envoyée par Wave ou Paydunya.
     */
    @Transactional
    public PaymentDto processWebhookConfirmation(java.util.Map<String, Object> payload, java.util.Map<String, String> headers) {
        com.revibeflip.service.payment.PaymentWebhookResult result = paymentGatewayService.processWebhook(payload, headers);

        if (result.getTransactionReference() == null) {
            throw new IllegalArgumentException("Référence de transaction introuvable dans le webhook.");
        }

        Payment payment = paymentRepository.findByTransactionReference(result.getTransactionReference())
                .orElseThrow(() -> new IllegalArgumentException("Paiement non trouvé pour la référence: " + result.getTransactionReference()));

        if (result.isSuccessful()) {
            Order order = payment.getOrder();
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setEscrowStatus(EscrowStatus.LOCKED);
            payment.setPaymentDate(LocalDateTime.now());
            payment.setGatewayResponsePayload(result.getRawPayload());
            Payment savedPayment = paymentRepository.save(payment);

            order.setStatus(OrderStatus.PAID_ESCROW_LOCKED);
            orderRepository.save(order);

            Product product = order.getProduct();
            product.setStatus(ProductStatus.SOLD);
            productRepository.save(product);

            deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> {
                d.setStatus(DeliveryStatus.PICKED_UP);
                d.setPickedUpAt(LocalDateTime.now());
                deliveryRepository.save(d);
            });

            notificationService.createNotification(
                    order.getBuyer(),
                    "Paiement " + payment.getPaymentMethod().getDisplayName() + " confirmé !",
                    "Votre paiement de " + order.getTotalAmount() + " FCFA a été sécurisé sous séquestre (Escrow).",
                    NotificationType.PAYMENT_CONFIRMED,
                    "/orders/" + order.getId()
            );

            notificationService.createNotification(
                    order.getSeller(),
                    "Article vendu & Payé !",
                    order.getBuyer().getFullName() + " a payé la commande " + order.getOrderNumber() + ". Les fonds sont en séquestre.",
                    NotificationType.ORDER_CREATED,
                    "/orders/" + order.getId()
            );

            log.info("Webhook: Paiement validé avec succès pour la commande {}", order.getOrderNumber());
            return PaymentDto.fromEntity(savedPayment);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.warn("Webhook: Paiement échoué pour la référence {}", result.getTransactionReference());
            return PaymentDto.fromEntity(payment);
        }
    }

    @Transactional
    public PaymentDto processPayment(ProcessPaymentRequest request, User buyer) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous ne pouvez payer que vos propres commandes.");
        }

        if (OrderStatus.COMPLETED.equals(order.getStatus()) || OrderStatus.PAID_ESCROW_LOCKED.equals(order.getStatus())) {
            throw new IllegalStateException("Cette commande a déjà été payée.");
        }

        // Prefix for local African payment provider simulation
        String prefix = switch (request.getPaymentMethod()) {
            case WAVE -> "WAVE-SN-";
            case ORANGE_MONEY -> "OM-SN-";
            case FREE_MONEY -> "FREE-SN-";
        };
        String txRef = prefix + System.currentTimeMillis() + "-" + (1000 + random.nextInt(9000));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElse(Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .validationFee(order.getValidationFee())
                        .build());

        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(txRef);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setEscrowStatus(EscrowStatus.LOCKED); // Locked in Escrow until buyer confirmation
        payment.setPayerPhoneNumber(request.getPhoneNumber());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setGatewayResponsePayload("{\"status\":\"SUCCESS\",\"provider\":\"" + request.getPaymentMethod() +
                "\",\"currency\":\"XOF\",\"amount\":" + order.getTotalAmount() + "}");

        Payment savedPayment = paymentRepository.save(payment);

        // Update Order status
        order.setStatus(OrderStatus.PAID_ESCROW_LOCKED);
        orderRepository.save(order);

        // Mark product as SOLD
        Product product = order.getProduct();
        product.setStatus(ProductStatus.SOLD);
        productRepository.save(product);

        // Update delivery status to PICKED_UP
        deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> {
            d.setStatus(DeliveryStatus.PICKED_UP);
            d.setPickedUpAt(LocalDateTime.now());
            deliveryRepository.save(d);
        });

        // Notifications
        notificationService.createNotification(
                buyer,
                "Paiement " + request.getPaymentMethod().getDisplayName() + " réussi !",
                "Votre paiement de " + order.getTotalAmount() + " FCFA a été sécurisé sous séquestre (Escrow). Votre colis est en cours de préparation.",
                NotificationType.PAYMENT_CONFIRMED,
                "/orders/" + order.getId()
        );

        notificationService.createNotification(
                order.getSeller(),
                "Article vendu & Payé !",
                buyer.getFullName() + " a payé la commande " + order.getOrderNumber() + ". Les fonds sont sécurisés en séquestre. Veuillez préparer l'envoi.",
                NotificationType.ORDER_CREATED,
                "/orders/" + order.getId()
        );

        log.info("Paiement effectué pour commande {} : réf {}, montant {} FCFA",
                order.getOrderNumber(), txRef, order.getTotalAmount());

        return PaymentDto.fromEntity(savedPayment);
    }

    public PaymentDto getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(PaymentDto::fromEntity)
                .orElse(null);
    }

    public PaymentDto getPaymentByReference(String reference) {
        return paymentRepository.findByTransactionReference(reference)
                .map(PaymentDto::fromEntity)
                .orElse(null);
    }
}
