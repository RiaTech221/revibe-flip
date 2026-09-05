package com.revibeflip.dto;

import com.revibeflip.entity.Delivery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDto {
    private Long id;
    private Long orderId;
    private String trackingNumber;
    private String mode;
    private String modeLabel;
    private String status;
    private String statusLabel;
    private String carrierName;
    private String carrierPhone;
    private LocalDateTime estimatedDelivery;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private String notes;

    public static DeliveryDto fromEntity(Delivery delivery) {
        if (delivery == null) return null;
        return DeliveryDto.builder()
                .id(delivery.getId())
                .orderId(delivery.getOrder() != null ? delivery.getOrder().getId() : null)
                .trackingNumber(delivery.getTrackingNumber())
                .mode(delivery.getMode().name())
                .modeLabel(delivery.getMode().getLabel())
                .status(delivery.getStatus().name())
                .statusLabel(delivery.getStatus().getLabel())
                .carrierName(delivery.getCarrierName())
                .carrierPhone(delivery.getCarrierPhone())
                .estimatedDelivery(delivery.getEstimatedDelivery())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .notes(delivery.getNotes())
                .build();
    }
}
