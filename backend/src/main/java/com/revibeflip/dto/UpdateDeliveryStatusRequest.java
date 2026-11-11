package com.revibeflip.dto;

import com.revibeflip.entity.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération UpdateDeliveryStatusRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDeliveryStatusRequest {

    @NotNull(message = "Le statut est obligatoire")
    private DeliveryStatus status;

    private String carrierName;
    private String carrierPhone;
    private String notes;
}
