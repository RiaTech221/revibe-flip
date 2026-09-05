package com.revibeflip.dto;

import com.revibeflip.entity.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
    private Long id;
    private Long productId;
    private String productTitle;
    private String productImageUrl;
    private String productPrice;
    private UserDto buyer;
    private UserDto seller;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private Long unreadCount;
    private LocalDateTime createdAt;

    public static ConversationDto fromEntity(Conversation c, Long currentUserId, Long unread) {
        if (c == null) return null;
        return ConversationDto.builder()
                .id(c.getId())
                .productId(c.getProduct() != null ? c.getProduct().getId() : null)
                .productTitle(c.getProduct() != null ? c.getProduct().getTitle() : null)
                .productImageUrl(c.getProduct() != null ? c.getProduct().getPrimaryImageUrl() : null)
                .productPrice(c.getProduct() != null ? c.getProduct().getPrice() + " " + (c.getProduct().getCountry() != null ? c.getProduct().getCountry().getCurrency() : "XOF") : null)
                .buyer(UserDto.fromEntity(c.getBuyer()))
                .seller(UserDto.fromEntity(c.getSeller()))
                .lastMessagePreview(c.getLastMessagePreview())
                .lastMessageAt(c.getLastMessageAt())
                .unreadCount(unread)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
