package com.revibeflip.service;

import com.revibeflip.dto.ChatOfferDto;
import com.revibeflip.dto.ConversationDto;
import com.revibeflip.dto.MessageDto;
import com.revibeflip.dto.SendMessageRequest;
import com.revibeflip.dto.StartConversationRequest;
import com.revibeflip.entity.ChatOffer;
import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.Message;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.MessageType;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.OfferStatus;
import com.revibeflip.repository.ChatOfferRepository;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.MessageRepository;
import com.revibeflip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service métier de messagerie instantanée en temps réel et archivage des conversations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final ChatOfferRepository chatOfferRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public List<ConversationDto> getUserConversations(Long userId) {
        return conversationRepository.findByUser(userId).stream()
                .map(c -> {
                    long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), userId);
                    ConversationDto dto = ConversationDto.fromEntity(c, userId, unread);
                    chatOfferRepository.findFirstByConversationIdAndStatusOrderByCreatedAtDesc(c.getId(), OfferStatus.OFFER_SENT)
                            .or(() -> chatOfferRepository.findFirstByConversationIdAndStatusOrderByCreatedAtDesc(c.getId(), OfferStatus.OFFER_ACCEPTED))
                            .ifPresent(o -> dto.setActiveOffer(ChatOfferDto.fromEntity(o)));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<MessageDto> getConversationMessages(Long conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation non trouvée."));

        boolean isBuyer = conversation.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = conversation.getSeller().getId().equals(currentUser.getId());

        if (!isBuyer && !isSeller && !"ROLE_ADMIN".equals(currentUser.getRole().name())) {
            throw new org.springframework.security.access.AccessDeniedException("Accès refusé à cette conversation.");
        }

        // Mark incoming messages as read & notify sender in real time
        int markedCount = messageRepository.markAsReadForUser(conversationId, currentUser.getId());
        if (markedCount > 0) {
            broadcastReadReceipt(conversationId, currentUser.getId());
        }

        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(MessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public int markConversationAsRead(Long conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation non trouvée."));

        boolean isBuyer = conversation.getBuyer().getId().equals(currentUser.getId());
        boolean isSeller = conversation.getSeller().getId().equals(currentUser.getId());

        if (!isBuyer && !isSeller && !"ROLE_ADMIN".equals(currentUser.getRole().name())) {
            throw new org.springframework.security.access.AccessDeniedException("Accès refusé à cette conversation.");
        }

        int markedCount = messageRepository.markAsReadForUser(conversationId, currentUser.getId());
        if (markedCount > 0) {
            broadcastReadReceipt(conversationId, currentUser.getId());
        }
        return markedCount;
    }

    public long getTotalUnreadCount(Long userId) {
        return messageRepository.countTotalUnreadForUser(userId);
    }

    private void broadcastReadReceipt(Long conversationId, Long readerId) {
        try {
            messagingTemplate.convertAndSend(
                    "/topic/conversations/" + conversationId + "/read",
                    Map.of("conversationId", conversationId, "readerId", readerId)
            );
        } catch (Exception e) {
            log.debug("Erreur envoi accusé de lecture WebSocket: {}", e.getMessage());
        }
    }

    @Transactional
    public ConversationDto startConversation(StartConversationRequest request, User buyer) {
        if (Boolean.TRUE.equals(buyer.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. La messagerie est désactivée.");
        }

        Long primaryProductId = request.getProductId();
        if (primaryProductId == null && request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            primaryProductId = request.getProductIds().get(0);
        }

        if (primaryProductId == null) {
            throw new IllegalArgumentException("Un article doit être spécifié pour démarrer la conversation.");
        }

        Product product = productRepository.findById(primaryProductId)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas démarrer une conversation sur votre propre article.");
        }

        // US-14 : Un seul fil par vendeur, avec reprise de l'historique existant
        List<Conversation> existingBetweenUsers = conversationRepository.findByUsers(buyer.getId(), product.getSeller().getId());
        Conversation conversation = !existingBetweenUsers.isEmpty()
                ? existingBetweenUsers.get(0)
                : Conversation.builder()
                        .product(product)
                        .buyer(buyer)
                        .seller(product.getSeller())
                        .build();

        boolean isNew = (conversation.getId() == null);
        conversation.setProduct(product);

        // Référencer tous les articles du panier ou ajouter le produit consulté s'il n'y est pas encore
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            List<Product> refList = productRepository.findAllById(request.getProductIds());
            conversation.setReferencedProducts(refList);
        } else {
            if (conversation.getReferencedProducts() == null) {
                conversation.setReferencedProducts(new ArrayList<>());
            }
            Long targetId = product.getId();
            boolean alreadyReferenced = conversation.getReferencedProducts().stream()
                    .anyMatch(p -> p.getId() != null && p.getId().equals(targetId));
            if (!alreadyReferenced) {
                conversation.getReferencedProducts().add(product);
            }
        }

        String messageContent = request.getInitialMessage();
        if (messageContent == null || messageContent.trim().isBlank()) {
            messageContent = "Je suis intéressé";
        } else {
            messageContent = messageContent.trim();
        }

        boolean shouldInsertProductMessage = isNew || messageRepository
                .findTopByConversationIdOrderBySentAtDescIdDesc(conversation.getId())
                .map(lastMsg -> lastMsg.getProductId() == null || !lastMsg.getProductId().equals(product.getId()))
                .orElse(true);

        if (shouldInsertProductMessage) {
            conversation.setLastMessagePreview(messageContent);
            conversation.setLastMessageAt(LocalDateTime.now());
        }
        Conversation savedConversation = conversationRepository.save(conversation);

        // Insérer automatiquement la carte produit (photo, nom) et le message « Je suis intéressé »
        if (shouldInsertProductMessage) {
            String productImage = product.getPrimaryImageUrl();
            Message message = Message.builder()
                    .conversation(savedConversation)
                    .sender(buyer)
                    .content(messageContent)
                    .messageType(MessageType.TEXT)
                    .imageUrl(productImage)
                    .productId(product.getId())
                    .productTitle(product.getTitle())
                    .productImageUrl(productImage)
                    .isRead(false)
                    .build();
            messageRepository.save(message);

            // Notifier le vendeur
            notificationService.createNotification(
                    product.getSeller(),
                    "Nouveau message de " + buyer.getFullName(),
                    product.getTitle() + " — " + messageContent,
                    NotificationType.NEW_MESSAGE,
                    "/messages/" + savedConversation.getId()
            );
        }

        ConversationDto dto = ConversationDto.fromEntity(savedConversation, buyer.getId(), 0L);
        chatOfferRepository.findFirstByConversationIdAndStatusOrderByCreatedAtDesc(savedConversation.getId(), OfferStatus.OFFER_SENT)
                .ifPresent(o -> dto.setActiveOffer(ChatOfferDto.fromEntity(o)));
        return dto;
    }

    @Transactional
    public MessageDto sendMessage(SendMessageRequest request, User sender) {
        if (Boolean.TRUE.equals(sender.getIsSuspended())) {
            throw new IllegalStateException("Votre compte est actuellement suspendu. La messagerie est désactivée.");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation non trouvée."));

        boolean isBuyer = conversation.getBuyer().getId().equals(sender.getId());
        boolean isSeller = conversation.getSeller().getId().equals(sender.getId());

        if (!isBuyer && !isSeller) {
            throw new org.springframework.security.access.AccessDeniedException("Non autorisé à envoyer un message ici.");
        }

        String textContent = request.getContent() != null ? request.getContent().trim() : "";
        String imageUrl = request.getImageUrl() != null ? request.getImageUrl().trim() : null;

        MessageType type = MessageType.TEXT;
        if (imageUrl != null && !imageUrl.isBlank()) {
            type = MessageType.IMAGE;
            if (textContent.isBlank()) {
                textContent = "[Photo de détail]";
            }
        }

        if (textContent.isBlank() && imageUrl == null) {
            throw new IllegalArgumentException("Le message ne peut pas être vide.");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(textContent)
                .messageType(type)
                .imageUrl(imageUrl)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // Mettre à jour l'aperçu de la conversation
        conversation.setLastMessagePreview(textContent);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageDto dto = MessageDto.fromEntity(saved);

        // Diffusion WebSocket temps réel sur le canal unifié
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversation.getId(), dto);
        } catch (Exception e) {
            log.debug("Erreur envoi message WebSocket: {}", e.getMessage());
        }

        // Notifier le destinataire
        User recipient = isBuyer ? conversation.getSeller() : conversation.getBuyer();
        notificationService.createNotification(
                recipient,
                "Message de " + sender.getFullName(),
                textContent,
                NotificationType.NEW_MESSAGE,
                "/messages/" + conversation.getId()
        );

        return dto;
    }
}
