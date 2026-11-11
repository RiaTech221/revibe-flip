package com.revibeflip.dto;

import com.revibeflip.entity.ChatOffer;
import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.OfferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour ChatOfferDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatOfferDto {

    private Long id;
    private Long conversationId;
    private Long sellerId;
    private String sellerName;
    private Long buyerId;
    private String buyerName;
    private Long productId;
    private String productTitle;
    private String productImageUrl;
    private String productCondition;
    private BigDecimal initialPrice;
    private BigDecimal agreedPrice;
    private DeliveryMode deliveryMode;
    private String deliveryModeLabel;
    private BigDecimal deliveryFee;
    private BigDecimal validationFee;
    private BigDecimal totalAmount;
    private Integer validityHours;
    private LocalDateTime expiresAt;
    private OfferStatus status;
    private Long orderId;
    private String orderNumber;
    private boolean isExpired;
    private Long secondsRemaining;
    private LocalDateTime createdAt;

    public static ChatOfferDto fromEntity(ChatOffer offer) {
        if (offer == null) return null;

        boolean expired = offer.isExpired();
        long remaining = 0L;
        if (!expired && offer.getExpiresAt() != null) {
            remaining = Math.max(0, Duration.between(LocalDateTime.now(), offer.getExpiresAt()).getSeconds());
        }

        return ChatOfferDto.builder()
                .id(offer.getId())
                .conversationId(offer.getConversation() != null ? offer.getConversation().getId() : null)
                .sellerId(offer.getSeller() != null ? offer.getSeller().getId() : null)
                .sellerName(offer.getSeller() != null ? offer.getSeller().getFullName() : null)
                .buyerId(offer.getBuyer() != null ? offer.getBuyer().getId() : null)
                .buyerName(offer.getBuyer() != null ? offer.getBuyer().getFullName() : null)
                .productId(offer.getProduct() != null ? offer.getProduct().getId() : null)
                .productTitle(offer.getProduct() != null ? offer.getProduct().getTitle() : null)
                .productImageUrl(offer.getProduct() != null ? offer.getProduct().getPrimaryImageUrl() : null)
                .productCondition(offer.getProduct() != null && offer.getProduct().getCondition() != null
                        ? offer.getProduct().getCondition().name() : null)
                .initialPrice(offer.getInitialPrice())
                .agreedPrice(offer.getAgreedPrice())
                .deliveryMode(offer.getDeliveryMode())
                .deliveryModeLabel(offer.getDeliveryMode() != null ? offer.getDeliveryMode().getLabel() : null)
                .deliveryFee(offer.getDeliveryFee())
                .validationFee(offer.getValidationFee())
                .totalAmount(offer.getTotalAmount())
                .validityHours(offer.getValidityHours())
                .expiresAt(offer.getExpiresAt())
                .status(offer.getStatus())
                .orderId(offer.getOrder() != null ? offer.getOrder().getId() : null)
                .orderNumber(offer.getOrder() != null ? offer.getOrder().getOrderNumber() : null)
                .isExpired(expired)
                .secondsRemaining(remaining)
                .createdAt(offer.getCreatedAt())
                .build();
    }
}
