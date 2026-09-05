package com.revibeflip.dto;

import com.revibeflip.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private String orderNumber;
    private Long productId;
    private String productTitle;
    private String productImageUrl;
    private BigDecimal itemPrice;
    private BigDecimal validationFee; // 1%
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private BigDecimal platformCommission; // 20%
    private BigDecimal sellerPayout;
    private String deliveryMode;
    private String deliveryModeLabel;
    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryPhone;
    private String deliveryNotes;
    private String status;
    private UserDto buyer;
    private UserDto seller;
    private DeliveryDto delivery;
    private PaymentDto payment;
    private LocalDateTime createdAt;

    public static OrderDto fromEntity(Order order) {
        if (order == null) return null;

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .productId(order.getProduct() != null ? order.getProduct().getId() : null)
                .productTitle(order.getProduct() != null ? order.getProduct().getTitle() : null)
                .productImageUrl(order.getProduct() != null ? order.getProduct().getPrimaryImageUrl() : null)
                .itemPrice(order.getItemPrice())
                .validationFee(order.getValidationFee())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .platformCommission(order.getPlatformCommission())
                .sellerPayout(order.getSellerPayout())
                .deliveryMode(order.getDeliveryMode().name())
                .deliveryModeLabel(order.getDeliveryMode().getLabel())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryCity(order.getDeliveryCity())
                .deliveryPhone(order.getDeliveryPhone())
                .deliveryNotes(order.getDeliveryNotes())
                .status(order.getStatus().name())
                .buyer(UserDto.fromEntity(order.getBuyer()))
                .seller(UserDto.fromEntity(order.getSeller()))
                .createdAt(order.getCreatedAt())
                .build();
    }
}
