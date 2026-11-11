package com.revibeflip.dto;

import com.revibeflip.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération ProcessPaymentRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentRequest {

    @NotNull(message = "L'ID de commande est obligatoire")
    private Long orderId;

    @NotNull(message = "Le moyen de paiement est obligatoire (WAVE, ORANGE_MONEY, FREE_MONEY)")
    private PaymentMethod paymentMethod;

    @NotBlank(message = "Le numéro de téléphone payeur est obligatoire")
    private String phoneNumber; // e.g. 771234567
}
