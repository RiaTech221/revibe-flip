package com.revibeflip.dto;

import com.revibeflip.entity.enums.DeliveryMode;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de requête pour l'opération CreateOfferRequest.
 */
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
    @DecimalMax(value = "100000000.0", message = "Le prix convenu dépasse le plafond autorisé.")
    private BigDecimal agreedPrice;

    @NotNull(message = "Le mode de livraison est obligatoire.")
    private DeliveryMode deliveryMode;

    @DecimalMin(value = "0.0", message = "Les frais de livraison ne peuvent pas être négatifs.")
    @DecimalMax(value = "1000000.0", message = "Les frais de livraison dépassent le plafond autorisé.")
    private BigDecimal deliveryFee;

    @Min(value = 1, message = "La durée de validité doit être d'au moins 1 heure.")
    @Max(value = 168, message = "La durée de validité ne peut pas dépasser 168 heures (7 jours).")
    private Integer validityHours;
}
