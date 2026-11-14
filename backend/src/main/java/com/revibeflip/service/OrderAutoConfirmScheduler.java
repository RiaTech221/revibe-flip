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

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
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

            try {
                OrderStateMachine.validateTransition(order.getStatus(), OrderStatus.COMPLETED);
                order.setStatus(OrderStatus.COMPLETED);
                Order saved = orderRepository.save(order);
                paymentService.releaseFundsToSeller(saved);

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
