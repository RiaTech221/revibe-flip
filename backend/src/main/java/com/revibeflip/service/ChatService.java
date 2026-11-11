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
import java.util.Optional;
import java.util.stream.Collectors;

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

        // Mark incoming messages as read
        messageRepository.markAsReadForUser(conversationId, currentUser.getId());

        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(MessageDto::fromEntity)
                .collect(Collectors.toList());
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

        // Rechercher si une conversation existe déjà pour cet article et cet acheteur/vendeur
        Conversation conversation = conversationRepository.findByProductAndUsers(
                product.getId(), buyer.getId(), product.getSeller().getId()
        ).orElseGet(() -> {
            List<Conversation> existingBetweenUsers = conversationRepository.findByUsers(buyer.getId(), product.getSeller().getId());
            if (!existingBetweenUsers.isEmpty()) {
                return existingBetweenUsers.get(0);
            }
            return Conversation.builder()
                    .product(product)
                    .buyer(buyer)
                    .seller(product.getSeller())
                    .build();
        });

        boolean isNew = (conversation.getId() == null);

        // Référencer tous les articles du panier s'il y en a plusieurs du même vendeur
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            List<Product> refList = productRepository.findAllById(request.getProductIds());
            conversation.setReferencedProducts(refList);
        } else if (conversation.getReferencedProducts() == null || conversation.getReferencedProducts().isEmpty()) {
            conversation.setReferencedProducts(new ArrayList<>(List.of(product)));
        }

        String messageContent = request.getInitialMessage();
        if (messageContent == null || messageContent.trim().isBlank()) {
            messageContent = "Bonjour ! Je suis intéressé(e) par votre article \"" + product.getTitle() + "\" et souhaite échanger avec vous.";
        }

        if (isNew) {
            conversation.setLastMessagePreview(messageContent);
            conversation.setLastMessageAt(LocalDateTime.now());
        }
        Conversation savedConversation = conversationRepository.save(conversation);

        // Créer le message initial UNIQUEMENT s'il s'agit d'une NOUVELLE conversation
        // Cela évite de répéter le message de salutation à chaque visite ou clic
        if (isNew) {
            Message message = Message.builder()
                    .conversation(savedConversation)
                    .sender(buyer)
                    .content(messageContent.trim())
                    .messageType(MessageType.TEXT)
                    .isRead(false)
                    .build();
            messageRepository.save(message);

            // Notifier le vendeur
            notificationService.createNotification(
                    product.getSeller(),
                    "Nouveau message de " + buyer.getFullName(),
                    messageContent,
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
