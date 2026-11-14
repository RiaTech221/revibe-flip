package com.revibeflip.service;

import com.revibeflip.dto.PayTechIpnPayload;
import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.PaymentInitiationResponse;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.ChatOffer;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.OrderItem;
import com.revibeflip.entity.Payment;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.*;
import com.revibeflip.payment.PayTechProperties;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.ChatOfferRepository;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.PaymentRepository;
import com.revibeflip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service métier de gestion des paiements PayTech, conservation des fonds,
 * grand livre immuable et versements aux vendeurs.
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
    private final PaymentGateway paymentGateway;
    private final PayTechProperties payTechProperties;
    private final LedgerService ledgerService;

    /**
     * Initie un paiement PayTech pour une commande.
     * Le montant est exclusivement recalculé/lu depuis la base côté serveur.
     * La commande reste en attente jusqu'à réception de l'IPN ou vérification serveur.
     */
    @Transactional
    public PaymentInitiationResponse initiatePayment(ProcessPaymentRequest request, User buyer) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Impossible d'effectuer un paiement.");
        }

        Order order = orderRepository.findByIdForUpdate(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new AccessDeniedException("Vous ne pouvez payer que vos propres commandes.");
        }

        if (OrderStatus.COMPLETED.equals(order.getStatus()) || OrderStatus.PAID_ESCROW_LOCKED.equals(order.getStatus())) {
            throw new IllegalStateException("Cette commande a déjà été payée.");
        }

        if (order.getStatus() == OrderStatus.EXPIRED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cette commande est expirée ou annulée. Le paiement est impossible.");
        }

        if (order.getReservationExpiresAt() != null && LocalDateTime.now().isAfter(order.getReservationExpiresAt())) {
            order.setStatus(OrderStatus.EXPIRED);
            releaseReservedProducts(order);
            orderRepository.save(order);
            throw new IllegalStateException("Le délai de réservation de cette commande a expiré. L'article a été remis en vente.");
        }

        if (order.getChatOfferId() != null) {
            ChatOffer offer = chatOfferRepository.findById(order.getChatOfferId())
                    .orElseThrow(() -> new IllegalStateException("Offre liée introuvable."));
            if (offer.getStatus() != OfferStatus.OFFER_ACCEPTED) {
                throw new IllegalStateException("Le paiement est impossible car l'offre n'a pas été acceptée.");
            }
        }

        // Vérifier que les articles n'ont pas déjà été vendus à un autre acheteur
        ensureProductsAvailableForSale(order);

        OrderStateMachine.validateTransition(order.getStatus(), OrderStatus.PAID_ESCROW_LOCKED);

        String itemName = order.getProduct() != null ? order.getProduct().getTitle() : "Commande " + order.getOrderNumber();
        PaymentGateway.PaymentInitiationResult result = paymentGateway.initiatePayment(
                new PaymentGateway.PaymentInitiationRequest(
                        order.getOrderNumber(),
                        itemName,
                        "Paiement commande " + order.getOrderNumber(),
                        order.getTotalAmount(),
                        "XOF",
                        request.getPaymentMethod(),
                        "{\"orderId\":" + order.getId() + "}"
                )
        );

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElse(Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .validationFee(order.getValidationFee())
                        .build());

        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(order.getOrderNumber());
        payment.setPaytechToken(result.token());
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setEscrowStatus(EscrowStatus.LOCKED);
        payment.setPayerPhoneNumber(request.getPhoneNumber());
        payment.setGatewayResponsePayload(result.rawPayload());
        paymentRepository.save(payment);

        return PaymentInitiationResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .reference(order.getOrderNumber())
                .token(result.token())
                .redirectUrl(result.redirectUrl())
                .amount(order.getTotalAmount())
                .currency("XOF")
                .build();
    }

    /**
     * Traitement transactionnel, idempotent et sécurisé de la notification IPN PayTech.
     */
    @Transactional
    public void handlePayTechIpn(PayTechIpnPayload payload, String sourceIp) {
        List<String> allowedIps = payTechProperties.getAllowedIpList();
        if (!allowedIps.isEmpty() && (sourceIp == null || !allowedIps.contains(sourceIp))) {
            log.warn("IPN PayTech rejeté : IP source non autorisée ({}).", sourceIp);
            throw new AccessDeniedException("IP source non autorisée.");
        }

        if (!paymentGateway.verifyIpnSignature(payload.getApiKeySha256(), payload.getApiSecretSha256())) {
            log.warn("IPN PayTech rejeté : signature SHA-256 invalide pour ref={}.", payload.getRefCommand());
            throw new AccessDeniedException("Signature IPN invalide.");
        }

        if (payload.getRefCommand() == null || payload.getRefCommand().isBlank()) {
            throw new IllegalArgumentException("Référence commande manquante dans l'IPN.");
        }

        Order order = orderRepository.findByOrderNumberForUpdate(payload.getRefCommand().trim())
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable pour référence IPN."));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new IllegalStateException("Transaction de paiement introuvable pour cette commande."));

        // Idempotence : un IPN reçu deux fois ne produit aucun doublon
        if (payment.getStatus() == PaymentStatus.SUCCESS
                || order.getStatus() == OrderStatus.PAID_ESCROW_LOCKED
                || order.getStatus() == OrderStatus.COMPLETED) {
            log.info("IPN déjà traité (idempotent) pour commande {}.", order.getOrderNumber());
            return;
        }

        String event = payload.getTypeEvent() != null ? payload.getTypeEvent().trim().toLowerCase() : "";
        if ("sale_canceled".equals(event) || "sale_failed".equals(event) || "canceled".equals(event)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setGatewayResponsePayload("IPN:" + event);
            paymentRepository.save(payment);
            log.info("Paiement annulé ou échoué via IPN pour commande {}.", order.getOrderNumber());
            return;
        }

        if (!"sale_complete".equals(event) && !"complete".equals(event)) {
            log.info("Événement IPN ignoré ({}) pour commande {}.", event, order.getOrderNumber());
            return;
        }

        // Vérification devise & montant
        if (payload.getCurrency() != null && !"XOF".equalsIgnoreCase(payload.getCurrency().trim())) {
            throw new IllegalStateException("Devise IPN incohérente : " + payload.getCurrency());
        }

        BigDecimal receivedAmount = payload.getFinalItemPrice() != null ? payload.getFinalItemPrice() : payload.getItemPrice();
        if (receivedAmount == null || receivedAmount.compareTo(order.getTotalAmount()) != 0) {
            log.warn("Montant IPN incohérent pour commande {} : attendu={}, reçu={}.",
                    order.getOrderNumber(), order.getTotalAmount(), receivedAmount);
            throw new IllegalStateException("Montant IPN incohérent avec la commande.");
        }

        // Confirmation auprès de PayTech get-status si token disponible
        String tokenToCheck = payload.getToken() != null && !payload.getToken().isBlank()
                ? payload.getToken()
                : payment.getPaytechToken();
        if (tokenToCheck != null && !tokenToCheck.isBlank()) {
            PaymentGateway.PaymentStatusResult statusResult = paymentGateway.getPaymentStatus(tokenToCheck);
            if (statusResult.found() && statusResult.status() != null
                    && !"complete".equalsIgnoreCase(statusResult.status())
                    && !"completed".equalsIgnoreCase(statusResult.status())
                    && !"paid".equalsIgnoreCase(statusResult.status())
                    && !"success".equalsIgnoreCase(statusResult.status())) {
                throw new IllegalStateException("Vérification serveur PayTech non confirmée (statut: " + statusResult.status() + ").");
            }
        }

        finalizePaidOrder(order, payment, tokenToCheck);
    }

    /**
     * Vérifie le statut réel d'un paiement auprès de PayTech (appelé par la page de retour ou la tâche planifiée).
     */
    @Transactional
    public PaymentDto verifyOrderPaymentStatus(Long orderId, User requester) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        boolean isAdmin = Role.ROLE_ADMIN.equals(requester.getRole());
        boolean isBuyer = order.getBuyer() != null && order.getBuyer().getId().equals(requester.getId());
        boolean isSeller = order.getSeller() != null && order.getSeller().getId().equals(requester.getId());
        if (!isAdmin && !isBuyer && !isSeller) {
            throw new AccessDeniedException("Accès refusé à cette commande.");
        }

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable pour cette commande."));

        if (payment.getStatus() == PaymentStatus.INITIATED && payment.getPaytechToken() != null && !payment.getPaytechToken().isBlank()) {
            PaymentGateway.PaymentStatusResult statusResult = paymentGateway.getPaymentStatus(payment.getPaytechToken());
            if (statusResult.found() && statusResult.status() != null) {
                String st = statusResult.status().toLowerCase();
                if ("complete".equals(st) || "completed".equals(st) || "paid".equals(st) || "success".equals(st)) {
                    if (statusResult.amount() == null || statusResult.amount().compareTo(order.getTotalAmount()) == 0) {
                        finalizePaidOrder(order, payment, payment.getPaytechToken());
                    }
                } else if ("canceled".equals(st) || "cancelled".equals(st) || "failed".equals(st) || "expired".equals(st)) {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                }
            }
        }

        return PaymentDto.fromEntity(payment);
    }

    /**
     * Finalise une commande payée sous verrou pessimiste anti-double-vente et enregistre le grand livre.
     */
    @Transactional
    public void finalizePaidOrder(Order order, Payment payment, String token) {
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return;
        }

        OrderStateMachine.validateTransition(order.getStatus(), OrderStatus.PAID_ESCROW_LOCKED);

        // Verrou pessimiste sur les articles pour empêcher toute double vente concurrente
        lockAndMarkProductsSold(order);

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setEscrowStatus(EscrowStatus.LOCKED);
        payment.setPaymentDate(LocalDateTime.now());
        if (token != null && !token.isBlank()) {
            payment.setPaytechToken(token);
        }
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PAID_ESCROW_LOCKED);
        orderRepository.save(order);

        ledgerService.recordPaymentReceived(order, payment.getTransactionReference());

        deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> {
            d.setStatus(DeliveryStatus.PICKED_UP);
            deliveryRepository.save(d);
        });

        notificationService.createNotification(
                order.getSeller(),
                "Nouvelle vente confirmée !",
                String.format("L'acheteur a réglé %s FCFA pour '%s'. Le paiement est conservé par ReVibe FliP jusqu'à confirmation de réception.",
                        order.getTotalAmount(),
                        order.getProduct() != null ? order.getProduct().getTitle() : "votre commande"),
                NotificationType.PAYMENT_CONFIRMED,
                "/seller"
        );

        notificationService.createNotification(
                order.getBuyer(),
                "Paiement confirmé !",
                String.format("Votre paiement de %s FCFA pour la commande %s a été validé. Le vendeur prépare votre colis.",
                        order.getTotalAmount(), order.getOrderNumber()),
                NotificationType.PAYMENT_CONFIRMED,
                "/orders/" + order.getId()
        );
    }

    /**
     * Déclenche la libération des fonds nets au vendeur (avec idempotence et blocage en cas de litige).
     */
    @Transactional
    public void releaseFundsToSeller(Order order) {
        if (order.getStatus() == OrderStatus.DISPUTED) {
            throw new IllegalStateException("Un litige est ouvert sur cette commande : la libération des fonds est bloquée.");
        }

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment == null) {
            return;
        }

        if (payment.getEscrowStatus() == EscrowStatus.RELEASED_TO_SELLER
                && (payment.getPayoutStatus() == PayoutStatus.COMPLETED || payment.getPayoutStatus() == PayoutStatus.PROCESSING)) {
            return;
        }

        User seller = order.getSeller();
        String recipientPhone = seller != null ? seller.getPhone() : null;
        if (recipientPhone == null || recipientPhone.isBlank()) {
            payment.setEscrowStatus(EscrowStatus.RELEASED_TO_SELLER);
            payment.setEscrowReleasedDate(LocalDateTime.now());
            payment.setPayoutStatus(PayoutStatus.MANUAL_REQUIRED);
            paymentRepository.save(payment);
            ledgerService.recordReleaseToSeller(order, payment.getTransactionReference());
            return;
        }

        payment.setEscrowStatus(EscrowStatus.RELEASED_TO_SELLER);
        payment.setEscrowReleasedDate(LocalDateTime.now());
        payment.setPayoutRecipientPhone(recipientPhone);

        String externalId = "PAYOUT-" + order.getOrderNumber() + "-" + UUID.randomUUID().toString().substring(0, 8);
        String serviceName = mapTransferService(payment.getPaymentMethod());
        PaymentGateway.TransferResult transferResult = paymentGateway.initiateTransfer(
                new PaymentGateway.TransferRequest(
                        order.getSellerPayout(),
                        recipientPhone,
                        serviceName,
                        externalId
                )
        );

        payment.setPayoutReference(transferResult.transferReference());
        if (transferResult.accepted()) {
            payment.setPayoutStatus(PayoutStatus.PROCESSING);
        } else {
            payment.setPayoutStatus(PayoutStatus.MANUAL_REQUIRED);
        }
        paymentRepository.save(payment);

        ledgerService.recordReleaseToSeller(order, payment.getTransactionReference());
    }

    @Transactional
    public void handleTransferIpn(String externalId, String status) {
        if (externalId == null || externalId.isBlank()) {
            return;
        }
        Payment payment = paymentRepository.findByPayoutReference(externalId).orElse(null);
        if (payment == null) {
            return;
        }
        if (payment.getPayoutStatus() == PayoutStatus.COMPLETED) {
            return;
        }
        if ("success".equalsIgnoreCase(status) || "completed".equalsIgnoreCase(status)) {
            payment.setPayoutStatus(PayoutStatus.COMPLETED);
            payment.setPayoutDate(LocalDateTime.now());
        } else if ("failed".equalsIgnoreCase(status) || "canceled".equalsIgnoreCase(status)) {
            payment.setPayoutStatus(PayoutStatus.FAILED);
        }
        paymentRepository.save(payment);
    }

    @Transactional
    public void recordOrderRefund(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment == null || payment.getStatus() != PaymentStatus.SUCCESS) {
            return;
        }
        if (payment.getEscrowStatus() == EscrowStatus.REFUNDED_TO_BUYER) {
            return;
        }
        payment.setEscrowStatus(EscrowStatus.REFUNDED_TO_BUYER);
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setPayoutStatus(PayoutStatus.NONE);
        paymentRepository.save(payment);
        ledgerService.recordRefund(order, payment.getTransactionReference(), order.getTotalAmount());
    }

    private void ensureProductsAvailableForSale(Order order) {
        if (order.getProduct() != null) {
            Product p = productRepository.findByIdForUpdate(order.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Article introuvable."));
            if (p.getStatus() == ProductStatus.SOLD) {
                throw new IllegalStateException("Cet article a déjà été vendu.");
            }
        }
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Product p = productRepository.findByIdForUpdate(item.getProduct().getId())
                            .orElseThrow(() -> new IllegalStateException("Article introuvable."));
                    if (p.getStatus() == ProductStatus.SOLD) {
                        throw new IllegalStateException("Un des articles de la commande a déjà été vendu.");
                    }
                }
            }
        }
    }

    private void lockAndMarkProductsSold(Order order) {
        if (order.getProduct() != null) {
            int updated = productRepository.markSoldIfNotSold(order.getProduct().getId());
            if (updated == 0) {
                throw new IllegalStateException("Conflit : cet article a déjà été vendu sur une autre commande.");
            }
        }
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    int updated = productRepository.markSoldIfNotSold(item.getProduct().getId());
                    if (updated == 0) {
                        throw new IllegalStateException("Conflit : l'article '" + item.getProduct().getTitle() + "' a déjà été vendu.");
                    }
                }
            }
        }
    }

    private void releaseReservedProducts(Order order) {
        if (order.getProduct() != null && order.getProduct().getStatus() == ProductStatus.RESERVED) {
            order.getProduct().setStatus(ProductStatus.ACTIVE);
            productRepository.save(order.getProduct());
        }
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null && item.getProduct().getStatus() == ProductStatus.RESERVED) {
                    item.getProduct().setStatus(ProductStatus.ACTIVE);
                    productRepository.save(item.getProduct());
                }
            }
        }
    }

    private String mapTransferService(PaymentMethod method) {
        if (method == null) return "Orange Money Senegal";
        return switch (method) {
            case WAVE -> "Wave Senegal";
            case ORANGE_MONEY -> "Orange Money Senegal";
            case FREE_MONEY -> "Free Money Senegal";
        };
    }

    public PaymentDto getPaymentByOrderId(Long orderId, User requester) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable pour cette commande."));
        Order order = payment.getOrder();
        boolean isAdmin = Role.ROLE_ADMIN.equals(requester.getRole());
        boolean isBuyer = order.getBuyer() != null && order.getBuyer().getId().equals(requester.getId());
        boolean isSeller = order.getSeller() != null && order.getSeller().getId().equals(requester.getId());
        if (!isAdmin && !isBuyer && !isSeller) {
            throw new AccessDeniedException("Accès refusé aux informations de paiement de cette commande.");
        }
        return PaymentDto.fromEntity(payment);
    }
}
