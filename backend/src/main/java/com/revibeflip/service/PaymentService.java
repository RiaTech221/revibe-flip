package com.revibeflip.service;

import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.OrderItem;
import com.revibeflip.entity.Payment;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.*;
import com.revibeflip.entity.ChatOffer;
import com.revibeflip.repository.ChatOfferRepository;
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

/**
 * Service Métier : Traitement des Paiements et Séquestre Financier (Mobile Money Escrow).
 *
 * <p>Fonctions clés d'ingénierie financière :</p>
 * <ul>
 *   <li>Traitement Mobile Money (Wave Sénégal, Orange Money, Free Money).</li>
 *   <li>Sécurisation des transactions sous séquestre certifié (statut ESCROW_LOCKED).</li>
 *   <li>Verrouillage anti-concurrence des articles dès confirmation du paiement.</li>
 *   <li>Génération de références de transaction uniques et traçables.</li>
 * </ul>
 *
 * @author Équipe Ingénierie ReVibe FliP
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;
    private final NotificationService notificationService;
    private final ChatOfferRepository chatOfferRepository;

    private final Random random = new Random();

    /**
     * Traite un paiement Mobile Money pour une commande et verrouille le montant sous séquestre.
     *
     * @param request Paramètres de paiement (identifiant commande, méthode de paiement, numéro de téléphone).
     * @param buyer   Utilisateur acheteur effectuant le paiement.
     * @return PaymentDto DTO du paiement enregistré et validé.
     * @throws IllegalStateException Si la commande est déjà payée, annulée ou expirée.
     * @throws org.springframework.security.access.AccessDeniedException Si l'utilisateur n'est pas l'acheteur de la commande.
     */
    @Transactional
    public PaymentDto processPayment(ProcessPaymentRequest request, User buyer) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Impossible d'effectuer un paiement.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Vous ne pouvez payer que vos propres commandes.");
        }

        if (OrderStatus.COMPLETED.equals(order.getStatus()) || OrderStatus.PAID_ESCROW_LOCKED.equals(order.getStatus())) {
            throw new IllegalStateException("Cette commande a déjà été payée.");
        }

        if (order.getStatus() == OrderStatus.EXPIRED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cette commande est expirée ou annulée. Le paiement est impossible.");
        }

        // Vérification du délai de réservation
        if (order.getReservationExpiresAt() != null && LocalDateTime.now().isAfter(order.getReservationExpiresAt())) {
            order.setStatus(OrderStatus.EXPIRED);
            if (order.getProduct() != null) {
                order.getProduct().setStatus(ProductStatus.ACTIVE);
                productRepository.save(order.getProduct());
            }
            orderRepository.save(order);
            throw new IllegalStateException("Le délai de réservation de cette commande a expiré. L'article a été remis en vente.");
        }

        // RÈGLE MÉTIER : Vérification de l'offre acceptée
        if (order.getChatOfferId() != null) {
            ChatOffer offer = chatOfferRepository.findById(order.getChatOfferId())
                    .orElseThrow(() -> new IllegalStateException("Offre liée introuvable."));
            if (offer.getStatus() != OfferStatus.OFFER_ACCEPTED) {
                throw new IllegalStateException("Le paiement est impossible car l'offre n'a pas été acceptée (statut: " + offer.getStatus() + ").");
            }
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
        if (product != null) {
            product.setStatus(ProductStatus.SOLD);
            productRepository.save(product);
        }

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem orderItem : order.getItems()) {
                if (orderItem.getProduct() != null) {
                    orderItem.getProduct().setStatus(ProductStatus.SOLD);
                    productRepository.save(orderItem.getProduct());
                }
            }
        }

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
}
