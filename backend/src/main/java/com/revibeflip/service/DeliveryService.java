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

    public DeliveryDto getDeliveryByOrderId(Long orderId, User currentUser) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Informations de livraison non trouvées pour la commande : " + orderId));
        validateDeliveryAccess(delivery, currentUser);
        return DeliveryDto.fromEntity(delivery);
    }

    public DeliveryDto getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Informations de livraison non trouvées pour cette commande : " + orderId));
        return DeliveryDto.fromEntity(delivery);
    }

    public DeliveryDto getDeliveryByTrackingNumber(String trackingNumber, User currentUser) {
        Delivery delivery = deliveryRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Numéro de suivi introuvable : " + trackingNumber));
        validateDeliveryAccess(delivery, currentUser);
        return DeliveryDto.fromEntity(delivery);
    }

    public DeliveryDto getDeliveryByTrackingNumber(String trackingNumber) {
        Delivery delivery = deliveryRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Numéro de suivi introuvable : " + trackingNumber));
        return DeliveryDto.fromEntity(delivery);
    }

    public DeliveryDto getDeliveryById(Long deliveryId, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Livraison non trouvée avec l'id : " + deliveryId));
        validateDeliveryAccess(delivery, currentUser);
        return DeliveryDto.fromEntity(delivery);
    }

    private void validateDeliveryAccess(Delivery delivery, User currentUser) {
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentification requise pour accéder aux informations de livraison.");
        }
        Order order = delivery.getOrder();
        if (order == null) {
            throw new org.springframework.security.access.AccessDeniedException("Commande introuvable pour cette livraison.");
        }

        boolean isBuyer = order.getBuyer() != null && order.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = order.getSeller() != null && order.getSeller().getId().equals(currentUser.getId());

        if (!isBuyer && !isSeller) {
            throw new org.springframework.security.access.AccessDeniedException("Accès refusé : cette livraison ne concerne aucune de vos commandes.");
        }
    }

    @Transactional
    public DeliveryDto updateDeliveryStatus(Long deliveryId, UpdateDeliveryStatusRequest request, User currentUser) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Livraison non trouvée avec l'id : " + deliveryId));

        Order order = delivery.getOrder();
        if (order == null || currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("Accès non autorisé.");
        }

        // SEC-04 : Seul le vendeur de la commande peut faire évoluer le statut de livraison
        boolean isSeller = order.getSeller() != null && order.getSeller().getId().equals(currentUser.getId());
        if (!isSeller) {
            throw new org.springframework.security.access.AccessDeniedException("Seul le vendeur de la commande peut mettre à jour le statut de livraison.");
        }

        // SEC-04 : Validation de la machine à états logistique (ordre strict des 5 statuts)
        DeliveryStateMachine.validateTransition(delivery.getStatus(), request.getStatus());

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
