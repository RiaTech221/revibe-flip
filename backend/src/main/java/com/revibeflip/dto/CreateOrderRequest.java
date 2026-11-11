package com.revibeflip.dto;

import com.revibeflip.entity.enums.DeliveryMode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO de requête pour l'opération CreateOrderRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    // Pour achat direct d'un seul article
    private Long productId;

    // Pour achat de plusieurs articles (depuis le panier)
    private List<Long> productIds;

    @NotNull(message = "Le mode de livraison est obligatoire")
    private DeliveryMode deliveryMode;

    private String deliveryAddress;

    private String deliveryCity;

    private String deliveryPhone;

    private String deliveryNotes;
}
