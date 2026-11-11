package com.revibeflip.service;

import com.revibeflip.dto.DeliveryDto;
import com.revibeflip.dto.UpdateDeliveryStatusRequest;
import com.revibeflip.entity.Delivery;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.repository.DeliveryRepository;
import com.revibeflip.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service métier de gestion logistique, suivi de livraison et assignation des transporteurs/coursiers.
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public DeliveryDto getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Informations de livraison non trouvées pour cette commande."));
        return DeliveryDto.fromEntity(delivery);
    }

    public DeliveryDto getDeliveryByTrackingNumber(String trackingNumber) {
        Delivery delivery = deliveryRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new IllegalArgumentException("Numéro de suivi introuvable : " + trackingNumber));
        return DeliveryDto.fromEntity(delivery);
    }

    @Transactional
    public DeliveryDto updateDeliveryStatus(Long deliveryId, UpdateDeliveryStatusRequest request, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Livraison non trouvée."));

        Order order = delivery.getOrder();

        // Allowed: Seller or Admin or Courier
        boolean isSeller = order.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(currentUser.getRole().name());

        if (!isSeller && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Non autorisé à mettre à jour la livraison.");
        }

        delivery.setStatus(request.getStatus());
        if (request.getCarrierName() != null) delivery.setCarrierName(request.getCarrierName());
        if (request.getCarrierPhone() != null) delivery.setCarrierPhone(request.getCarrierPhone());
        if (request.getNotes() != null) delivery.setNotes(request.getNotes());

        if (DeliveryStatus.PICKED_UP.equals(request.getStatus()) && delivery.getPickedUpAt() == null) {
            delivery.setPickedUpAt(LocalDateTime.now());
        } else if (DeliveryStatus.DELIVERED.equals(request.getStatus())) {
            delivery.setDeliveredAt(LocalDateTime.now());
            if (OrderStatus.PAID_ESCROW_LOCKED.equals(order.getStatus()) || OrderStatus.SHIPPED.equals(order.getStatus())) {
                order.setStatus(OrderStatus.DELIVERED);
                orderRepository.save(order);
            }
        } else if (DeliveryStatus.IN_TRANSIT.equals(request.getStatus())) {
            order.setStatus(OrderStatus.SHIPPED);
            orderRepository.save(order);
        }

        Delivery saved = deliveryRepository.save(delivery);

        // Notify Buyer
        notificationService.createNotification(
                order.getBuyer(),
                "Suivi colis : " + request.getStatus().getLabel(),
                "Votre commande " + order.getOrderNumber() + " a changé de statut : " + request.getStatus().getLabel(),
                NotificationType.DELIVERY_STATUS_CHANGED,
                "/orders/" + order.getId()
        );

        // Notify Seller
        notificationService.createNotification(
                order.getSeller(),
                "Mise à jour livraison : " + request.getStatus().getLabel(),
                "La commande " + order.getOrderNumber() + " est désormais : " + request.getStatus().getLabel(),
                NotificationType.DELIVERY_STATUS_CHANGED,
                "/orders/" + order.getId()
        );

        return DeliveryDto.fromEntity(saved);
    }
}
