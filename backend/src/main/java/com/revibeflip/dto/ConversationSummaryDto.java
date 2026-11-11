package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour ConversationSummaryDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryDto {
    private Long id;
    private Long productId;
    private String productTitle;
    private String productImage;
    private java.math.BigDecimal productPrice;

    private Long otherUserId;
    private String otherUserName;
    private String otherUserPhone;
    private String otherUserProfilePicture;

    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private boolean isOtherUserSeller;
}
