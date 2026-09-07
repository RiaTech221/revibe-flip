package com.revibeflip.service.payment;

import com.revibeflip.dto.InitiatePaymentResponse;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.enums.PaymentMethod;

import java.util.Map;

/**
 * Interface pour les passerelles de paiement réelles (Paydunya, Wave Direct, etc.)
 */
public interface PaymentGatewayService {

    /**
     * Crée une session de paiement auprès de l'agrégateur et renvoie l'URL / QR code.
     */
    InitiatePaymentResponse initiateCheckout(Order order, PaymentMethod paymentMethod, String payerPhone, String txRef);

    /**
     * Traite la notification instantanée de paiement (Webhook IPN) reçue de la passerelle.
     *
     * @param payload Données JSON ou formulaires envoyées par la passerelle
     * @param headers En-têtes HTTP (contenant souvent les signatures de sécurité)
     * @return Référence de transaction confirmée
     */
    PaymentWebhookResult processWebhook(Map<String, Object> payload, Map<String, String> headers);
}
