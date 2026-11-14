package com.revibeflip.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.enums.PaymentMethod;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

/**
 * Implémentation officielle de l'API PayTech (https://doc.paytech.sn).
 * Aucun fallback vers un flux fictif : sans configuration valide, toute opération échoue explicitement.
 */
@Service
@Slf4j
public class PayTechGateway implements PaymentGateway {

    private final PayTechProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PayTechGateway(PayTechProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) {
            throw new IllegalStateException(
                    "La passerelle de paiement PayTech n'est pas configurée. Veuillez renseigner les variables d'environnement PayTech."
            );
        }
    }

    @Override
    public PaymentInitiationResult initiatePayment(PaymentInitiationRequest request) {
        ensureConfigured();

        Map<String, Object> body = new HashMap<>();
        body.put("item_name", request.itemName());
        body.put("item_price", request.amount().longValue());
        body.put("currency", request.currency());
        body.put("ref_command", request.orderNumber());
        body.put("command_name", request.commandName());
        body.put("env", properties.getEnv());
        body.put("ipn_url", properties.getIpnUrl());
        body.put("success_url", properties.getSuccessUrl());
        body.put("cancel_url", properties.getCancelUrl());
        if (request.paymentMethod() != null) {
            body.put("target_payment", mapTargetPayment(request.paymentMethod()));
        }
        if (request.customField() != null && !request.customField().isBlank()) {
            body.put("custom_field", request.customField());
        }

        String rawResponse = restClient.post()
                .uri("/payment/request-payment")
                .header("API_KEY", properties.getApiKey())
                .header("API_SECRET", properties.getApiSecret())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            int success = root.path("success").asInt(0);
            if (success != 1) {
                String message = root.path("errors").isMissingNode()
                        ? root.path("message").asText("Échec d'initialisation PayTech.")
                        : root.path("errors").toString();
                throw new IllegalStateException("PayTech a refusé la demande de paiement : " + message);
            }
            String token = root.path("token").asText("");
            String redirectUrl = root.path("redirect_url").asText("");
            if (redirectUrl.isBlank()) {
                throw new IllegalStateException("PayTech n'a pas retourné d'URL de redirection.");
            }
            return new PaymentInitiationResult(true, token, redirectUrl, rawResponse);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Réponse PayTech invalide lors de l'initiation du paiement.", e);
        }
    }

    @Override
    public PaymentStatusResult getPaymentStatus(String token) {
        ensureConfigured();
        if (token == null || token.isBlank()) {
            return new PaymentStatusResult(false, "UNKNOWN", null, null, null, null);
        }

        String rawResponse = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/payment/get-status")
                        .queryParam("token_payment", token)
                        .build())
                .header("API_KEY", properties.getApiKey())
                .header("API_SECRET", properties.getApiSecret())
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            int success = root.path("success").asInt(0);
            if (success != 1) {
                return new PaymentStatusResult(false, "NOT_FOUND", null, null, null, rawResponse);
            }
            JsonNode paymentNode = root.has("payment") ? root.get("payment") : root;
            String status = paymentNode.path("status").asText("UNKNOWN");
            String method = paymentNode.path("payment_method").asText(null);
            BigDecimal amount = paymentNode.hasNonNull("final_item_price")
                    ? new BigDecimal(paymentNode.get("final_item_price").asText())
                    : (paymentNode.hasNonNull("item_price") ? new BigDecimal(paymentNode.get("item_price").asText()) : null);
            String currency = paymentNode.path("currency").asText("XOF");
            return new PaymentStatusResult(true, status, method, amount, currency, rawResponse);
        } catch (Exception e) {
            log.warn("Erreur de parsing get-status PayTech pour token {}: {}", maskToken(token), e.getMessage());
            return new PaymentStatusResult(false, "ERROR", null, null, null, rawResponse);
        }
    }

    @Override
    public boolean verifyIpnSignature(String apiKeySha256, String apiSecretSha256) {
        if (!properties.isConfigured() || apiKeySha256 == null || apiSecretSha256 == null) {
            return false;
        }
        byte[] expectedKeyHash = sha256Hex(properties.getApiKey()).getBytes(StandardCharsets.UTF_8);
        byte[] receivedKeyHash = apiKeySha256.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);
        byte[] expectedSecretHash = sha256Hex(properties.getApiSecret()).getBytes(StandardCharsets.UTF_8);
        byte[] receivedSecretHash = apiSecretSha256.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);

        boolean keyMatch = MessageDigest.isEqual(expectedKeyHash, receivedKeyHash);
        boolean secretMatch = MessageDigest.isEqual(expectedSecretHash, receivedSecretHash);
        return keyMatch && secretMatch;
    }

    @Override
    public TransferResult initiateTransfer(TransferRequest request) {
        ensureConfigured();

        Map<String, Object> body = new HashMap<>();
        body.put("amount", request.amount().longValue());
        body.put("destination_number", request.destinationPhone());
        body.put("service", request.serviceName());
        body.put("external_id", request.externalId());
        if (properties.getTransferCallbackUrl() != null && !properties.getTransferCallbackUrl().isBlank()) {
            body.put("callback_url", properties.getTransferCallbackUrl());
        }

        try {
            String rawResponse = restClient.post()
                    .uri("/transfer/transferFund")
                    .header("API_KEY", properties.getApiKey())
                    .header("API_SECRET", properties.getApiSecret())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawResponse);
            int success = root.path("success").asInt(0);
            String ref = root.path("transfer_id").asText(request.externalId());
            String status = success == 1 ? "PROCESSING" : "FAILED";
            return new TransferResult(success == 1, ref, status, rawResponse);
        } catch (Exception e) {
            log.warn("Transfert PayTech indisponible ou refusé pour {}: {}", request.externalId(), e.getMessage());
            return new TransferResult(false, request.externalId(), "FAILED", e.getMessage());
        }
    }

    @Override
    public boolean isRefundApiSupported() {
        // La documentation officielle PayTech (doc.paytech.sn) ne documente pas d'endpoint REST public de remboursement automatique.
        return false;
    }

    private String mapTargetPayment(PaymentMethod method) {
        return switch (method) {
            case WAVE -> "Wave";
            case ORANGE_MONEY -> "Orange Money";
            case FREE_MONEY -> "Free Money";
        };
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    private String maskToken(String token) {
        if (token.length() <= 6) return "***";
        return token.substring(0, 3) + "***" + token.substring(token.length() - 3);
    }
}
