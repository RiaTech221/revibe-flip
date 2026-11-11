package com.revibeflip.service;

import com.revibeflip.dto.ChatOfferDto;
import com.revibeflip.dto.CreateOfferRequest;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatOfferService {

    private final ChatOfferRepository chatOfferRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Random random = new Random();

    @Transactional
    public ChatOfferDto createOffer(User seller, CreateOfferRequest request) {
        if (Boolean.TRUE.equals(seller.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Impossible d'envoyer une offre.");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable."));

        if (!conversation.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Seul le vendeur propriétaire de l'annonce peut émettre une offre de prix.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Article introuvable."));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Vous n'êtes pas le vendeur propriétaire de cet article.");
        }

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("Cet article n'est plus disponible à la vente (statut actuel: " + product.getStatus() + ").");
        }

        // RÈGLE MÉTIER ABSOLUE : Le prix convenu doit être inférieur ou égal au prix affiché
        if (request.getAgreedPrice().compareTo(product.getPrice()) > 0) {
            throw new IllegalArgumentException("Le prix convenu (" + request.getAgreedPrice() 
                    + " FCFA) ne peut pas être supérieur au prix affiché de l'article (" + product.getPrice() + " FCFA).");
        }

        // Vérifier si une offre est déjà en cours dans cette conversation
        Optional<ChatOffer> activeOpt = chatOfferRepository.findFirstByConversationIdAndStatusOrderByCreatedAtDesc(
                conversation.getId(), OfferStatus.OFFER_SENT
        );
        if (activeOpt.isPresent()) {
            ChatOffer existing = activeOpt.get();
            if (!existing.isExpired()) {
                // Annuler l'ancienne offre en cours pour la remplacer par la nouvelle négociation
                existing.setStatus(OfferStatus.OFFER_CANCELLED);
                chatOfferRepository.save(existing);
            }
        }

        PlatformSetting platformSetting = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> PlatformSetting.builder().build());

        // Calcul des frais de protection acheteur (1% par défaut lu depuis les paramètres)
        BigDecimal validationRate = platformSetting.getValidationFeeRate() != null 
                ? platformSetting.getValidationFeeRate() : BigDecimal.valueOf(1.0);
        BigDecimal validationFee = request.getAgreedPrice()
                .multiply(validationRate)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        // Frais de livraison (calculés selon le mode ou spécifiés par le vendeur)
        BigDecimal deliveryFee = request.getDeliveryFee();
        if (deliveryFee == null) {
            deliveryFee = request.getDeliveryMode() == DeliveryMode.HOME_DELIVERY 
                    ? BigDecimal.valueOf(2000) : BigDecimal.ZERO;
        }

        BigDecimal totalAmount = request.getAgreedPrice().add(validationFee).add(deliveryFee);

        int validityHours = request.getValidityHours() != null && request.getValidityHours() > 0 
                ? request.getValidityHours() : (platformSetting.getOfferValidityHours() != null ? platformSetting.getOfferValidityHours() : 24);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(validityHours);

        ChatOffer offer = ChatOffer.builder()
                .conversation(conversation)
                .seller(seller)
                .buyer(conversation.getBuyer())
                .product(product)
                .initialPrice(product.getPrice())
                .agreedPrice(request.getAgreedPrice())
                .deliveryMode(request.getDeliveryMode())
                .deliveryFee(deliveryFee)
                .validationFee(validationFee)
                .totalAmount(totalAmount)
                .validityHours(validityHours)
                .expiresAt(expiresAt)
                .status(OfferStatus.OFFER_SENT)
                .build();

        ChatOffer savedOffer = chatOfferRepository.save(offer);

        // Message spécial type OFFER dans le chat
        Message offerMessage = Message.builder()
                .conversation(conversation)
                .sender(seller)
                .content("Offre spéciale proposée par le vendeur : " + request.getAgreedPrice() + " FCFA (" + request.getDeliveryMode().getLabel() + ")")
                .messageType(MessageType.OFFER)
                .offer(savedOffer)
                .isRead(false)
                .build();
        messageRepository.save(offerMessage);

        conversation.setLastMessagePreview("Offre envoyée : " + request.getAgreedPrice() + " FCFA");
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ChatOfferDto dto = ChatOfferDto.fromEntity(savedOffer);

        // Diffusion WebSocket temps réel
        broadcastOfferUpdate(conversation.getId(), dto);

        // Notification à l'acheteur
        notificationService.createNotification(
                conversation.getBuyer(),
                "Nouvelle offre reçue !",
                seller.getFullName() + " vous propose l'article \"" + product.getTitle() + "\" à " + request.getAgreedPrice() + " FCFA.",
                NotificationType.NEW_OFFER,
                "/messages/" + conversation.getId()
        );

        return dto;
    }

    @Transactional
    public ChatOfferDto acceptOffer(User buyer, Long offerId) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. Impossible d'accepter une offre.");
        }

        ChatOffer offer = chatOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));

        if (!offer.getBuyer().getId().equals(buyer.getId())) {
            throw new AccessDeniedException("Seul l'acheteur destinataire de l'offre peut l'accepter.");
        }

        if (offer.getStatus() == OfferStatus.OFFER_ACCEPTED) {
            throw new IllegalStateException("Cette offre a déjà été acceptée.");
        }

        if (offer.getStatus() != OfferStatus.OFFER_SENT) {
            throw new IllegalStateException("Cette offre n'est plus active (statut: " + offer.getStatus() + ").");
        }

        if (offer.isExpired()) {
            offer.setStatus(OfferStatus.OFFER_EXPIRED);
            chatOfferRepository.save(offer);
            throw new IllegalStateException("Cette offre a expiré.");
        }

        Product product = offer.getProduct();
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("L'article n'est plus disponible (déjà vendu ou réservé).");
        }

        // Verrou transactionnel : réserver l'article pour cet acheteur
        product.setStatus(ProductStatus.RESERVED);
        productRepository.save(product);

        PlatformSetting platformSetting = platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> PlatformSetting.builder().build());

        BigDecimal commissionRate = platformSetting.getCommissionRate() != null 
                ? platformSetting.getCommissionRate() : BigDecimal.valueOf(20.0);
        BigDecimal platformCommission = offer.getAgreedPrice()
                .multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal sellerPayout = offer.getAgreedPrice().subtract(platformCommission);

        int reservationHours = platformSetting.getReservationDurationHours() != null 
                ? platformSetting.getReservationDurationHours() : 24;
        LocalDateTime reservationExpiresAt = LocalDateTime.now().plusHours(reservationHours);

        String orderNumber = "RF-" + LocalDate.now().getYear() + "-" + (10000 + random.nextInt(90000));

        // Créer la commande avec le statut AWAITING_PAYMENT et le PRIX CONVENU
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .buyer(buyer)
                .seller(offer.getSeller())
                .product(product)
                .originalPrice(offer.getInitialPrice())
                .itemPrice(offer.getAgreedPrice())
                .agreedPrice(offer.getAgreedPrice())
                .validationFee(offer.getValidationFee())
                .deliveryFee(offer.getDeliveryFee())
                .totalAmount(offer.getTotalAmount())
                .platformCommission(platformCommission)
                .sellerPayout(sellerPayout)
                .deliveryMode(offer.getDeliveryMode())
                .deliveryAddress(offer.getDeliveryMode() == DeliveryMode.HOME_DELIVERY ? buyer.getAddress() : "Remise en main propre")
                .deliveryCity(buyer.getCity() != null ? buyer.getCity() : "Dakar")
                .deliveryPhone(buyer.getPhone())
                .deliveryNotes("Commande issue de l'offre acceptée dans le chat #" + offer.getId())
                .status(OrderStatus.AWAITING_PAYMENT)
                .deliveryStatus(DeliveryStatus.PENDING)
                .chatOfferId(offer.getId())
                .reservationExpiresAt(reservationExpiresAt)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Créer l'élément de commande lié
        OrderItem orderItem = OrderItem.builder()
                .order(savedOrder)
                .product(product)
                .price(offer.getAgreedPrice())
                .build();
        orderItemRepository.save(orderItem);
        savedOrder.getItems().add(orderItem);

        // Créer la fiche de livraison associée
        String trackingNumber = "TRK-DKR-" + String.format("%05d", 10000 + random.nextInt(90000));
        Delivery delivery = Delivery.builder()
                .order(savedOrder)
                .trackingNumber(trackingNumber)
                .mode(offer.getDeliveryMode())
                .status(DeliveryStatus.PENDING)
                .carrierName(DeliveryMode.HOME_DELIVERY.equals(offer.getDeliveryMode()) ? "Express Moto Dakar" : "Remise en main propre")
                .estimatedDelivery(LocalDateTime.now().plusDays(1))
                .build();
        deliveryRepository.save(delivery);

        offer.setStatus(OfferStatus.OFFER_ACCEPTED);
        offer.setOrder(savedOrder);
        ChatOffer savedOffer = chatOfferRepository.save(offer);

        // Message système dans la discussion
        Message acceptedMessage = Message.builder()
                .conversation(offer.getConversation())
                .sender(buyer)
                .content("L'offre de " + offer.getAgreedPrice() + " FCFA a été acceptée ! La commande " + orderNumber + " est créée en attente de paiement.")
                .messageType(MessageType.SYSTEM)
                .offer(savedOffer)
                .isRead(false)
                .build();
        messageRepository.save(acceptedMessage);

        offer.getConversation().setLastMessagePreview("Offre acceptée (" + offer.getAgreedPrice() + " FCFA)");
        offer.getConversation().setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(offer.getConversation());

        ChatOfferDto dto = ChatOfferDto.fromEntity(savedOffer);
        broadcastOfferUpdate(offer.getConversation().getId(), dto);

        // Notification au vendeur
        notificationService.createNotification(
                offer.getSeller(),
                "Offre acceptée !",
                buyer.getFullName() + " a accepté votre offre de " + offer.getAgreedPrice() + " FCFA pour \"" + product.getTitle() + "\". En attente du paiement séquestre.",
                NotificationType.OFFER_ACCEPTED,
                "/messages/" + offer.getConversation().getId()
        );

        return dto;
    }

    @Transactional
    public ChatOfferDto declineOffer(User buyer, Long offerId) {
        ChatOffer offer = chatOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));

        if (!offer.getBuyer().getId().equals(buyer.getId())) {
            throw new AccessDeniedException("Seul l'acheteur destinataire de l'offre peut la refuser.");
        }

        if (offer.getStatus() != OfferStatus.OFFER_SENT) {
            throw new IllegalStateException("Cette offre ne peut plus être refusée (statut: " + offer.getStatus() + ").");
        }

        offer.setStatus(OfferStatus.OFFER_DECLINED);
        ChatOffer saved = chatOfferRepository.save(offer);

        Message declinedMessage = Message.builder()
                .conversation(offer.getConversation())
                .sender(buyer)
                .content("L'offre de " + offer.getAgreedPrice() + " FCFA a été déclinée par l'acheteur.")
                .messageType(MessageType.SYSTEM)
                .offer(saved)
                .isRead(false)
                .build();
        messageRepository.save(declinedMessage);

        ChatOfferDto dto = ChatOfferDto.fromEntity(saved);
        broadcastOfferUpdate(offer.getConversation().getId(), dto);

        notificationService.createNotification(
                offer.getSeller(),
                "Offre refusée",
                buyer.getFullName() + " a refusé votre offre de " + offer.getAgreedPrice() + " FCFA pour \"" + offer.getProduct().getTitle() + "\". Vous pouvez poursuivre la discussion.",
                NotificationType.OFFER_DECLINED,
                "/messages/" + offer.getConversation().getId()
        );

        return dto;
    }

    @Transactional
    public ChatOfferDto cancelOffer(User seller, Long offerId) {
        ChatOffer offer = chatOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));

        if (!offer.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("Seul le vendeur ayant émis l'offre peut l'annuler.");
        }

        if (offer.getStatus() != OfferStatus.OFFER_SENT) {
            throw new IllegalStateException("Cette offre ne peut plus être annulée car elle n'est plus en attente (statut: " + offer.getStatus() + ").");
        }

        offer.setStatus(OfferStatus.OFFER_CANCELLED);
        ChatOffer saved = chatOfferRepository.save(offer);

        Message cancelMessage = Message.builder()
                .conversation(offer.getConversation())
                .sender(seller)
                .content("L'offre de " + offer.getAgreedPrice() + " FCFA a été annulée par le vendeur.")
                .messageType(MessageType.SYSTEM)
                .offer(saved)
                .isRead(false)
                .build();
        messageRepository.save(cancelMessage);

        ChatOfferDto dto = ChatOfferDto.fromEntity(saved);
        broadcastOfferUpdate(offer.getConversation().getId(), dto);

        return dto;
    }

    public List<ChatOfferDto> getConversationOffers(Long conversationId, User user) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable."));

        boolean isParticipant = conversation.getBuyer().getId().equals(user.getId()) 
                || conversation.getSeller().getId().equals(user.getId()) 
                || "ROLE_ADMIN".equals(user.getRole().name());

        if (!isParticipant) {
            throw new AccessDeniedException("Accès refusé aux offres de cette conversation.");
        }

        return chatOfferRepository.findByConversationIdOrderByCreatedAtDesc(conversationId)
                .stream()
                .map(ChatOfferDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ChatOfferDto> getSellerActiveOffers(User seller) {
        return chatOfferRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(seller.getId(), OfferStatus.OFFER_SENT)
                .stream()
                .map(ChatOfferDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ChatOfferDto> getSellerAllOffers(User seller) {
        return chatOfferRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId())
                .stream()
                .map(ChatOfferDto::fromEntity)
                .collect(Collectors.toList());
    }

    private void broadcastOfferUpdate(Long conversationId, ChatOfferDto dto) {
        try {
            // Un seul nom de canal normalisé pour acheteur et vendeur
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        } catch (Exception e) {
            log.debug("Erreur broadcast WebSocket offre: {}", e.getMessage());
        }
    }

    // Cron exécuté toutes les minutes pour expirer les offres et réservations
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processExpirations() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Expirer les offres envoyées dont le délai est dépassé
        List<ChatOffer> expiredOffers = chatOfferRepository.findByStatusAndExpiresAtBefore(OfferStatus.OFFER_SENT, now);
        for (ChatOffer o : expiredOffers) {
            o.setStatus(OfferStatus.OFFER_EXPIRED);
            chatOfferRepository.save(o);

            broadcastOfferUpdate(o.getConversation().getId(), ChatOfferDto.fromEntity(o));
            log.info("Offre #{} expirée automatiquement.", o.getId());
        }

        // 2. Alertes 2h avant expiration des offres
        LocalDateTime inTwoHours = now.plusHours(2);
        List<ChatOffer> expiringSoon = chatOfferRepository.findOffersExpiringSoon(now, inTwoHours);
        for (ChatOffer o : expiringSoon) {
            notificationService.createNotification(
                    o.getBuyer(),
                    "Offre bientôt expirée !",
                    "L'offre de " + o.getAgreedPrice() + " FCFA pour \"" + o.getProduct().getTitle() + "\" expire dans moins de 2 heures.",
                    NotificationType.OFFER_EXPIRING,
                    "/messages/" + o.getConversation().getId()
            );
        }

        // 3. Expirer les commandes AWAITING_PAYMENT dont la réservation est dépassée
        List<Order> expiredOrders = orderRepository.findByStatusAndReservationExpiresAtBefore(OrderStatus.AWAITING_PAYMENT, now);
        for (Order order : expiredOrders) {
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);

            // Libérer l'article pour qu'il redevienne disponible
            if (order.getProduct() != null) {
                order.getProduct().setStatus(ProductStatus.ACTIVE);
                productRepository.save(order.getProduct());
            }
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        item.getProduct().setStatus(ProductStatus.ACTIVE);
                        productRepository.save(item.getProduct());
                    }
                }
            }

            // Notifier les deux parties
            notificationService.createNotification(
                    order.getBuyer(),
                    "Réservation expirée",
                    "Le délai de paiement pour la commande " + order.getOrderNumber() + " est dépassé. L'article est remis en vente.",
                    NotificationType.ORDER_EXPIRED,
                    "/profile?tab=purchases"
            );
            notificationService.createNotification(
                    order.getSeller(),
                    "Réservation expirée",
                    "L'acheteur n'a pas finalisé le paiement pour la commande " + order.getOrderNumber() + ". Votre article \"" + (order.getProduct() != null ? order.getProduct().getTitle() : "") + "\" est automatiquement remis en vente.",
                    NotificationType.ORDER_EXPIRED,
                    "/seller"
            );
            log.info("Commande #{} ({}) expirée : article libéré et remis en vente.", order.getId(), order.getOrderNumber());
        }
    }
}
