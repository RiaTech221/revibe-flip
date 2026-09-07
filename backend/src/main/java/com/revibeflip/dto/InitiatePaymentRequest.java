package com.revibeflip.dto;

import com.revibeflip.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {

    @NotNull(message = "L'ID de commande est obligatoire")
    private Long orderId;

    @NotNull(message = "Le moyen de paiement est obligatoire")
    private PaymentMethod paymentMethod;

    private String phoneNumber;
}
