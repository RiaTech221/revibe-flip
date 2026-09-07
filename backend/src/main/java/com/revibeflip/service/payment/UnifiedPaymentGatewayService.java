package com.revibeflip.service.payment;

import com.revibeflip.dto.InitiatePaymentResponse;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.enums.PaymentMethod;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Service de passerelle de paiement intégrant les flux réels Wave / Paydunya (Orange Money & Wave)
 * avec bascule automatique et liens de paiement.
 */
@Service
@Slf4j
public class UnifiedPaymentGatewayService implements PaymentGatewayService {

    @Value("${revibeflip.payment.provider:sandbox}")
    private String paymentProvider; // 'paydunya', 'wave', ou 'sandbox'

    @Value("${revibeflip.payment.paydunya.master-key:}")
    private String paydunyaMasterKey;

    @Value("${revibeflip.payment.paydunya.private-key:}")
    private String paydunyaPrivateKey;

    @Value("${revibeflip.payment.paydunya.token:}")
    private String paydunyaToken;

    @Value("${revibeflip.payment.wave.api-key:}")
    private String waveApiKey;

    @Value("${revibeflip.payment.webhook-base-url:http://localhost:8080}")
    private String webhookBaseUrl;

    @Value("${revibeflip.payment.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    private final RestClient restClient;

    public UnifiedPaymentGatewayService() {
        this.restClient = RestClient.builder().build();
    }

    @Override
    public InitiatePaymentResponse initiateCheckout(Order order, PaymentMethod paymentMethod, String payerPhone, String txRef) {
        log.info("Initiation du paiement via fournisseur '{}' pour la commande {} (Réf: {})", paymentProvider, order.getOrderNumber(), txRef);

        // 1. Si Paydunya est configuré (Idéal pour Wave + Orange Money + Free Money en 1 seule intégration)
        if ("paydunya".equalsIgnoreCase(paymentProvider) && isPaydunyaConfigured()) {
            return initiatePaydunyaCheckout(order, paymentMethod, payerPhone, txRef);
        }

        // 2. Si Wave Business API directe est configurée
        if ("wave".equalsIgnoreCase(paymentProvider) && isWaveConfigured() && paymentMethod == PaymentMethod.WAVE) {
            return initiateWaveCheckout(order, payerPhone, txRef);
        }

        // 3. Mode Sandbox / Environnement de développement (Génération de liens et QR codes de démonstration prêts à l'emploi)
        log.info("Utilisation du mode de simulation/sandbox de paiement pour {}...", paymentMethod);
        String checkoutUrl = frontendBaseUrl + "/orders/" + order.getId() + "?simulate_pay=" + txRef;
        String deepLink = paymentMethod == PaymentMethod.WAVE
                ? "https://wave.com/pay?amount=" + order.getTotalAmount() + "&ref=" + txRef
                : "https://orangemoney.orange.sn/pay?ref=" + txRef;

        String qrCode = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + txRef;

        return InitiatePaymentResponse.builder()
                .transactionReference(txRef)
                .paymentMethod(paymentMethod.name())
                .amount(order.getTotalAmount())
                .status("INITIATED")
                .checkoutUrl(checkoutUrl)
                .deepLinkUrl(deepLink)
                .qrCodeUrl(qrCode)
                .instructionMessage("Veuillez valider le paiement de " + order.getTotalAmount() + " FCFA sur votre compte " + paymentMethod.getDisplayName())
                .isLiveGateway(false)
                .build();
    }

    private InitiatePaymentResponse initiatePaydunyaCheckout(Order order, PaymentMethod paymentMethod, String payerPhone, String txRef) {
        try {
            log.info("Appel de l'API Paydunya Checkout pour {} FCFA...", order.getTotalAmount());
            String endpoint = "https://app.paydunya.com/api/v1/checkout-invoice/create";

            Map<String, Object> invoice = new HashMap<>();
            invoice.put("total_amount", order.getTotalAmount().doubleValue());
            invoice.put("description", "Achat ReVibe FliP - " + order.getProduct().getTitle());

            Map<String, Object> store = new HashMap<>();
            store.put("name", "ReVibe FliP Marketplace");
            store.put("website_url", frontendBaseUrl);

            Map<String, Object> actions = new HashMap<>();
            actions.put("cancel_url", frontendBaseUrl + "/orders/" + order.getId());
            actions.put("return_url", frontendBaseUrl + "/orders/" + order.getId());
            actions.put("callback_url", webhookBaseUrl + "/api/payments/webhook/paydunya");

            Map<String, Object> customData = new HashMap<>();
            customData.put("tx_ref", txRef);
            customData.put("order_id", order.getId());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("invoice", invoice);
            requestBody.put("store", store);
            requestBody.put("actions", actions);
            requestBody.put("custom_data", customData);

            Map response = restClient.post()
                    .uri(endpoint)
                    .header("PAYDUNYA-MASTER-KEY", paydunyaMasterKey)
                    .header("PAYDUNYA-PRIVATE-KEY", paydunyaPrivateKey)
                    .header("PAYDUNYA-TOKEN", paydunyaToken)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && "00".equals(response.get("response_code"))) {
                String responseText = (String) response.get("response_text");
                return InitiatePaymentResponse.builder()
                        .transactionReference(txRef)
                        .paymentMethod(paymentMethod.name())
                        .amount(order.getTotalAmount())
                        .status("INITIATED")
                        .checkoutUrl(responseText)
                        .deepLinkUrl(responseText)
                        .instructionMessage("Redirection vers la passerelle sécurisée Paydunya (" + paymentMethod.getDisplayName() + ")...")
                        .isLiveGateway(true)
                        .build();
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'appel Paydunya: {}", e.getMessage(), e);
        }

        // Fallback en cas d'erreur de clé Paydunya
        return InitiatePaymentResponse.builder()
                .transactionReference(txRef)
                .paymentMethod(paymentMethod.name())
                .amount(order.getTotalAmount())
                .status("INITIATED")
                .instructionMessage("Erreur de connexion avec la passerelle Paydunya. Veuillez réessayer ou contacter le support.")
                .isLiveGateway(false)
                .build();
    }

    private InitiatePaymentResponse initiateWaveCheckout(Order order, String payerPhone, String txRef) {
        try {
            log.info("Appel direct de l'API Wave Checkout pour {} FCFA...", order.getTotalAmount());
            String endpoint = "https://api.wave.com/v1/checkout/sessions";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("amount", order.getTotalAmount().toString());
            requestBody.put("currency", "XOF");
            requestBody.put("client_reference", txRef);
            requestBody.put("error_url", frontendBaseUrl + "/orders/" + order.getId() + "?error=payment_failed");
            requestBody.put("success_url", frontendBaseUrl + "/orders/" + order.getId() + "?status=success");

            Map response = restClient.post()
                    .uri(endpoint)
                    .header("Authorization", "Bearer " + waveApiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("wave_launch_url")) {
                String waveUrl = (String) response.get("wave_launch_url");
                return InitiatePaymentResponse.builder()
                        .transactionReference(txRef)
                        .paymentMethod(PaymentMethod.WAVE.name())
                        .amount(order.getTotalAmount())
                        .status("INITIATED")
                        .checkoutUrl(waveUrl)
                        .deepLinkUrl(waveUrl)
                        .instructionMessage("Ouvrez l'application Wave pour finaliser votre achat en 1 clic.")
                        .isLiveGateway(true)
                        .build();
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'appel Wave API: {}", e.getMessage(), e);
        }

        return InitiatePaymentResponse.builder()
                .transactionReference(txRef)
                .paymentMethod(PaymentMethod.WAVE.name())
                .amount(order.getTotalAmount())
                .status("INITIATED")
                .instructionMessage("Mode test Wave.")
                .isLiveGateway(false)
                .build();
    }

    @Override
    public PaymentWebhookResult processWebhook(Map<String, Object> payload, Map<String, String> headers) {
        log.info("Traitement du webhook de paiement entrant : payload={}", payload);

        // 1. Détection format Paydunya
        if (payload.containsKey("data")) {
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            String status = (String) data.get("status");
            Map<String, Object> invoice = (Map<String, Object>) data.get("invoice");
            Map<String, Object> customData = (Map<String, Object>) data.get("custom_data");

            String txRef = customData != null ? (String) customData.get("tx_ref") : null;
            Double amount = invoice != null && invoice.get("total_amount") != null
                    ? Double.valueOf(invoice.get("total_amount").toString())
                    : 0.0;

            boolean success = "completed".equalsIgnoreCase(status);
            return PaymentWebhookResult.builder()
                    .successful(success)
                    .transactionReference(txRef)
                    .amount(BigDecimal.valueOf(amount))
                    .providerStatus(status)
                    .rawPayload(payload.toString())
                    .build();
        }

        // 2. Détection format Wave Webhook
        if (payload.containsKey("type") && payload.containsKey("data")) {
            String eventType = (String) payload.get("type");
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            String txRef = (String) data.get("client_reference");
            String checkoutStatus = (String) data.get("checkout_status");

            boolean success = "checkout.session.completed".equalsIgnoreCase(eventType)
                    || "complete".equalsIgnoreCase(checkoutStatus);

            return PaymentWebhookResult.builder()
                    .successful(success)
                    .transactionReference(txRef)
                    .providerStatus(checkoutStatus != null ? checkoutStatus : eventType)
                    .rawPayload(payload.toString())
                    .build();
        }

        // 3. Webhook générique ou simulation directe
        String txRef = (String) payload.get("transactionReference");
        if (txRef == null) txRef = (String) payload.get("tx_ref");

        return PaymentWebhookResult.builder()
                .successful(true)
                .transactionReference(txRef)
                .providerStatus("SUCCESS")
                .rawPayload(payload.toString())
                .build();
    }

    private boolean isPaydunyaConfigured() {
        return paydunyaMasterKey != null && !paydunyaMasterKey.isBlank()
                && paydunyaPrivateKey != null && !paydunyaPrivateKey.isBlank();
    }

    private boolean isWaveConfigured() {
        return waveApiKey != null && !waveApiKey.isBlank();
    }
}
