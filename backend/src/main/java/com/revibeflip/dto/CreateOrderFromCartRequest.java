package com.revibeflip.dto;

import com.revibeflip.entity.enums.DeliveryMode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération CreateOrderFromCartRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderFromCartRequest {
    @NotNull(message = "Le mode de livraison est obligatoire")
    private DeliveryMode deliveryMode;

    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryPhone;
    private String deliveryNotes;
}
