package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Réponse d'initialisation d'un paiement PayTech contenant uniquement l'URL de redirection et les références utiles.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitiationResponse {
    private Long orderId;
    private String orderNumber;
    private String reference;
    private String token;
    private String redirectUrl;
    private BigDecimal amount;
    private String currency;
}
