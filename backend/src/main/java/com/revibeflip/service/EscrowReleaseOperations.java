package com.revibeflip.service;

import com.revibeflip.entity.Order;
import com.revibeflip.entity.Payment;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Composant transactionnel exécutant les phases de base de données (Temps 1 et Temps 3)
 * de la libération du séquestre vendeur (SEC-03).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EscrowReleaseOperations {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;

    public record PayoutPreparation(
            Long orderId,
            String orderNumber,
            String payoutReference,
            BigDecimal amount,
            String recipientPhone,
            PaymentMethod paymentMethod
    ) {}

    /**
     * Temps 1 (Transactionnel) : Pose un verrou pessimiste, vérifie l'éligibilité,
     * génère et persiste l'identifiant de virement à l'état PROCESSING, et valide la transaction.
     *
     * @param orderId Identifiant de la commande à libérer.
     * @return Informations préparées pour l'appel externe, ou vide si la commande est déjà traitée ou inéligible.
     */
    @Transactional
    public Optional<PayoutPreparation> prepareAndLockPayout(Long orderId) {
        // SEC-03 : Verrou pessimiste avec délai d'attente borné pour interdire les accès concurrents
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée : " + orderId));

        // SEC-03 : Blocage strict si un litige est ouvert sur la commande
        if (order.getStatus() == OrderStatus.DISPUTED) {
            throw new IllegalStateException("Un litige est ouvert sur cette commande : la libération des fonds est bloquée.");
        }

        // SEC-03 : Vérification du statut de livraison
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new IllegalStateException("La confirmation de réception n'est possible qu'une fois la commande livrée (statut actuel : " + order.getStatus() + ").");
        }

        // SEC-03 : Verrou pessimiste sur l'entité Payment associée
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalStateException("Paiement non trouvé pour la commande : " + orderId));

        // SEC-03 : Garde d'idempotence : si le virement est déjà en cours ou clos, sortir sans effet
        if (payment.getPayoutStatus() != PayoutStatus.NONE) {
            log.info("Libération ignorée : virement déjà initié ou traité (statut={}) pour commande {}.",
                    payment.getPayoutStatus(), order.getOrderNumber());
            return Optional.empty();
        }

        String recipientPhone = order.getSeller() != null ? order.getSeller().getPhone() : null;
        if (recipientPhone == null || recipientPhone.isBlank()) {
            // SEC-03 : En l'absence de coordonnées téléphoniques, passage en traitement manuel sans écriture comptable
            payment.setPayoutStatus(PayoutStatus.MANUAL_REQUIRED);
            paymentRepository.save(payment);
            log.warn("Libération séquestre impossible : téléphone vendeur manquant pour commande {}.", order.getOrderNumber());
            return Optional.empty();
        }

        // Passage de la commande à COMPLETED si non encore fait
        if (order.getStatus() != OrderStatus.COMPLETED) {
            OrderStateMachine.validateTransition(order.getStatus(), OrderStatus.COMPLETED);
            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
        }

        // Mise à jour de la livraison à DELIVERED
        deliveryRepository.findByOrderId(orderId).ifPresent(d -> {
            d.setStatus(DeliveryStatus.DELIVERED);
            if (d.getDeliveredAt() == null) {
                d.setDeliveredAt(LocalDateTime.now());
            }
            deliveryRepository.save(d);
        });

        // SEC-03 : Génération et persistance de l'identifiant unique PAYOUT-{UUID} avant l'appel externe
        String payoutReference = "PAYOUT-" + UUID.randomUUID();
        payment.setPayoutReference(payoutReference);
        payment.setPayoutStatus(PayoutStatus.PROCESSING);
        payment.setPayoutRecipientPhone(recipientPhone);
        paymentRepository.save(payment);

        notificationService.createNotification(
                order.getSeller(),
                "Paiement libéré !",
                "L'acheteur a confirmé la bonne réception de l'article. Le versement de " + order.getSellerPayout() + " FCFA a été déclenché.",
                NotificationType.ORDER_DELIVERED,
                "/orders/" + order.getId()
        );

        notificationService.createNotification(
                order.getBuyer(),
                "Donnez votre avis !",
                "Comment s'est passée votre transaction avec " + order.getSeller().getFullName() + " ? Laissez une note pour aider la communauté.",
                NotificationType.NEW_REVIEW,
                "/orders/" + order.getId()
        );

        return Optional.of(new PayoutPreparation(
                order.getId(),
                order.getOrderNumber(),
                payoutReference,
                order.getSellerPayout(),
                recipientPhone,
                payment.getPaymentMethod()
        ));
    }

    /**
     * Temps 3 (Transactionnel) : Enregistre le résultat de l'initiation sous verrou et ventile le grand livre.
     *
     * @param orderId Identifiant de la commande.
     * @param payoutReference Référence de virement générée au Temps 1.
     * @param accepted Vrai si le prestataire a accepté le virement.
     */
    @Transactional
    public void finalizePayout(Long orderId, String payoutReference, boolean accepted) {
        // SEC-03 : Verrouillage pessimiste pour concilier l'état avec un éventuel retour IPN asynchrone
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalStateException("Paiement non trouvé pour la commande : " + orderId));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("Commande non trouvée : " + orderId));

        if (payment.getPayoutStatus() == PayoutStatus.PROCESSING) {
            if (accepted) {
                // Point d'intégration : Rapprochement des virements bloqués via tâche d'audit dédiée
                payment.setEscrowStatus(EscrowStatus.RELEASED_TO_SELLER);
                payment.setEscrowReleasedDate(LocalDateTime.now());
                paymentRepository.save(payment);
                // Point d'intégration : Écriture comptable à la confirmation finale du prestataire
                ledgerService.recordReleaseToSeller(order, payment.getTransactionReference());
                log.info("Virement accepté par le prestataire pour commande {} (ref: {}).",
                        order.getOrderNumber(), PaymentService.sanitizeAndTruncateRef(payoutReference));
            } else {
                // SEC-03 : En cas de refus, le séquestre reste LOCKED et aucune écriture n'est enregistrée
                // Point d'intégration : Relance contrôlée et état « à vérifier » à implémenter pour les échecs réversibles
                payment.setPayoutStatus(PayoutStatus.MANUAL_REQUIRED);
                paymentRepository.save(payment);
                log.warn("Virement refusé pour commande {} (ref: {}). Séquestre maintenu LOCKED.",
                        order.getOrderNumber(), PaymentService.sanitizeAndTruncateRef(payoutReference));
            }
        } else if (payment.getPayoutStatus() == PayoutStatus.COMPLETED) {
            // SEC-03 : L'IPN de virement a déjà validé le virement pendant l'appel HTTP (ne pas écraser COMPLETED)
            payment.setEscrowStatus(EscrowStatus.RELEASED_TO_SELLER);
            if (payment.getEscrowReleasedDate() == null) {
                payment.setEscrowReleasedDate(LocalDateTime.now());
            }
            paymentRepository.save(payment);
            ledgerService.recordReleaseToSeller(order, payment.getTransactionReference());
            log.info("Virement déjà validé COMPLETED par IPN pour commande {} (ref: {}).",
                    order.getOrderNumber(), PaymentService.sanitizeAndTruncateRef(payoutReference));
        }
    }
}
