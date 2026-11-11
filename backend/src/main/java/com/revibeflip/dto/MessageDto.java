package com.revibeflip.dto;

import com.revibeflip.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String messageType;
    private String imageUrl;
    private ChatOfferDto offer;
    private Boolean isRead;
    private LocalDateTime sentAt;

    public static MessageDto fromEntity(Message message) {
        if (message == null) return null;
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getFullName() : null)
                .senderAvatar(message.getSender() != null ? message.getSender().getProfilePicture() : null)
                .content(message.getContent())
                .messageType(message.getMessageType() != null ? message.getMessageType().name() : "TEXT")
                .imageUrl(message.getImageUrl())
                .offer(message.getOffer() != null ? ChatOfferDto.fromEntity(message.getOffer()) : null)
                .isRead(message.getIsRead())
                .sentAt(message.getSentAt())
                .build();
    }
}
