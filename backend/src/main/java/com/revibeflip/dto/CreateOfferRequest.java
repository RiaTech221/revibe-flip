package com.revibeflip.dto;

import com.revibeflip.entity.enums.DeliveryMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOfferRequest {

    @NotNull(message = "L'identifiant de la conversation est obligatoire.")
    private Long conversationId;

    @NotNull(message = "L'identifiant de l'article est obligatoire.")
    private Long productId;

    @NotNull(message = "Le prix convenu est obligatoire.")
    @DecimalMin(value = "100.0", message = "Le prix convenu doit être d'au moins 100 FCFA.")
    private BigDecimal agreedPrice;

    @NotNull(message = "Le mode de livraison est obligatoire.")
    private DeliveryMode deliveryMode;

    private BigDecimal deliveryFee;

    private Integer validityHours;
}
