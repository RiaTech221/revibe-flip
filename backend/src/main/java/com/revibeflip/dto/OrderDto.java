package com.revibeflip.dto;

import com.revibeflip.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
    private BigDecimal originalPrice;
    private BigDecimal agreedPrice;
    private Long chatOfferId;
    private LocalDateTime reservationExpiresAt;
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
    private String deliveryStatus;
    private String deliveryStatusLabel;
    private UserDto buyer;
    private UserDto seller;
    private DeliveryDto delivery;
    private PaymentDto payment;
    private List<OrderItemDto> items;
    private Integer itemCount;
    private LocalDateTime createdAt;

    public static OrderDto fromEntity(Order order) {
        if (order == null) return null;

        List<OrderItemDto> itemDtos = new ArrayList<>();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            itemDtos = order.getItems().stream()
                    .map(OrderItemDto::fromEntity)
                    .collect(Collectors.toList());
        } else if (order.getProduct() != null) {
            itemDtos.add(OrderItemDto.builder()
                    .id(1L)
                    .productId(order.getProduct().getId())
                    .title(order.getProduct().getTitle())
                    .price(order.getItemPrice())
                    .imageUrl(order.getProduct().getPrimaryImageUrl())
                    .build());
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .productId(order.getProduct() != null ? order.getProduct().getId() : null)
                .productTitle(order.getProduct() != null ? order.getProduct().getTitle() : null)
                .productImageUrl(order.getProduct() != null ? order.getProduct().getPrimaryImageUrl() : null)
                .itemPrice(order.getItemPrice())
                .originalPrice(order.getOriginalPrice())
                .agreedPrice(order.getAgreedPrice() != null ? order.getAgreedPrice() : order.getItemPrice())
                .chatOfferId(order.getChatOfferId())
                .reservationExpiresAt(order.getReservationExpiresAt())
                .validationFee(order.getValidationFee())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .platformCommission(order.getPlatformCommission())
                .sellerPayout(order.getSellerPayout())
                .deliveryMode(order.getDeliveryMode() != null ? order.getDeliveryMode().name() : null)
                .deliveryModeLabel(order.getDeliveryMode() != null ? order.getDeliveryMode().getLabel() : null)
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryCity(order.getDeliveryCity())
                .deliveryPhone(order.getDeliveryPhone())
                .deliveryNotes(order.getDeliveryNotes())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .deliveryStatus(order.getDeliveryStatus() != null ? order.getDeliveryStatus().name() : null)
                .deliveryStatusLabel(order.getDeliveryStatus() != null ? order.getDeliveryStatus().getLabel() : null)
                .buyer(UserDto.fromEntity(order.getBuyer()))
                .seller(UserDto.fromEntity(order.getSeller()))
                .items(itemDtos)
                .itemCount(itemDtos.size())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
