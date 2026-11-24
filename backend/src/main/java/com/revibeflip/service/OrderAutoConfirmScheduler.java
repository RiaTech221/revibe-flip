package com.revibeflip.service;

import com.revibeflip.entity.Delivery;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Confirmation automatique de réception après expiration du délai paramétré (sauf litige).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderAutoConfirmScheduler {

    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    @Value("${revibeflip.order.auto-confirm-days:7}")
    private int autoConfirmDays;

    // SEC-03 : Pas de @Transactional global sur le planificateur afin qu'un échec sur une commande ne bloque pas les autres
    @Scheduled(cron = "0 0 * * * *")
    public void autoConfirmDeliveredOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(1, autoConfirmDays));
        List<Order> candidates = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED);

        for (Order order : candidates) {
            Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
            if (delivery == null || delivery.getStatus() != DeliveryStatus.DELIVERED || delivery.getDeliveredAt() == null) {
                continue;
            }
            if (delivery.getDeliveredAt().isAfter(cutoff)) {
                continue;
            }

            // Point d'intégration : Preuve de livraison avant auto-confirmation à valider avec les transporteurs
            // Point d'intégration : Rattachement de Report à Order à modéliser (actuellement Report cible Product/User sans lien direct Order).

            try {
                // SEC-03 : Libération unitaire sécurisée en 3 temps dans sa propre transaction isolée
                paymentService.releaseFundsToSeller(order.getId());

                notificationService.createNotification(
                        order.getSeller(),
                        "Réception confirmée automatiquement",
                        "Le délai de confirmation pour la commande " + order.getOrderNumber() + " est écoulé. Le versement a été déclenché.",
                        NotificationType.PAYMENT_CONFIRMED,
                        "/seller"
                );
            } catch (Exception ex) {
                log.error("Erreur auto-confirmation commande {}: {}", order.getOrderNumber(), ex.getMessage());
            }
        }
    }
}
