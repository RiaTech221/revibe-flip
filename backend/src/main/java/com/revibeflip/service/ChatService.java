package com.revibeflip.service;

import com.revibeflip.dto.ConversationDto;
import com.revibeflip.dto.MessageDto;
import com.revibeflip.dto.SendMessageRequest;
import com.revibeflip.dto.StartConversationRequest;
import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.Message;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.MessageRepository;
import com.revibeflip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public List<ConversationDto> getUserConversations(Long userId) {
        return conversationRepository.findByUser(userId).stream()
                .map(c -> {
                    long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), userId);
                    return ConversationDto.fromEntity(c, userId, unread);
                })
                .collect(Collectors.toList());
    }

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
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas démarrer une conversation sur votre propre article.");
        }

        Conversation conversation = conversationRepository.findByProductAndUsers(
                product.getId(), buyer.getId(), product.getSeller().getId()
        ).orElseGet(() -> Conversation.builder()
                .product(product)
                .buyer(buyer)
                .seller(product.getSeller())
                .build());

        conversation.setLastMessagePreview(request.getInitialMessage());
        conversation.setLastMessageAt(LocalDateTime.now());
        Conversation savedConversation = conversationRepository.save(conversation);

        // Create initial message
        Message message = Message.builder()
                .conversation(savedConversation)
                .sender(buyer)
                .content(request.getInitialMessage())
                .isRead(false)
                .build();
        messageRepository.save(message);

        // Notify Seller
        notificationService.createNotification(
                product.getSeller(),
                "Nouveau message de " + buyer.getFullName(),
                request.getInitialMessage(),
                NotificationType.NEW_MESSAGE,
                "/messages/" + savedConversation.getId()
        );

        return ConversationDto.fromEntity(savedConversation, buyer.getId(), 0L);
    }

    @Transactional
    public MessageDto sendMessage(SendMessageRequest request, User sender) {
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation non trouvée."));

        boolean isBuyer = conversation.getBuyer().getId().equals(sender.getId());
        boolean isSeller = conversation.getSeller().getId().equals(sender.getId());

        if (!isBuyer && !isSeller) {
            throw new org.springframework.security.access.AccessDeniedException("Non autorisé à envoyer un message ici.");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // Update conversation summary
        conversation.setLastMessagePreview(request.getContent().trim());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageDto dto = MessageDto.fromEntity(saved);

        // Real-time broadcast to conversation topic via STOMP
        try {
            messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId(), dto);
        } catch (Exception e) {
            log.debug("Erreur envoi message WebSocket: {}", e.getMessage());
        }

        // Notify recipient
        User recipient = isBuyer ? conversation.getSeller() : conversation.getBuyer();
        notificationService.createNotification(
                recipient,
                "Message de " + sender.getFullName(),
                request.getContent().trim(),
                NotificationType.NEW_MESSAGE,
                "/messages/" + conversation.getId()
        );

        return dto;
    }
}
