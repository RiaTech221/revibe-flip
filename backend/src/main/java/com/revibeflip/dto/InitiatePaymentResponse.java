package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentResponse {

    private String transactionReference;
    private String paymentMethod;
    private BigDecimal amount;
    private String status; // INITIATED, PENDING, SUCCESS

    /**
     * URL de redirection web ou URL du portail Paydunya/Wave Checkout
     */
    private String checkoutUrl;

    /**
     * Deep Link direct vers l'application Wave (wave://...) ou Orange Money
     */
    private String deepLinkUrl;

    /**
     * URL du QR Code scannable avec le smartphone
     */
    private String qrCodeUrl;

    /**
     * Message informatif à l'attention de l'utilisateur
     */
    private String instructionMessage;

    /**
     * Vrai si la passerelle réelle a généré une session de paiement
     */
    private boolean isLiveGateway;
}
