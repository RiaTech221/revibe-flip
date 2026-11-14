package com.revibeflip.payment;

import com.revibeflip.entity.enums.PaymentMethod;

import java.math.BigDecimal;

/**
 * Interface d'abstraction de la passerelle de paiement.
 * Tout appel au prestataire externe doit passer exclusivement par cette interface.
 */
public interface PaymentGateway {

    record PaymentInitiationRequest(
            String orderNumber,
            String itemName,
            String commandName,
            BigDecimal amount,
            String currency,
            PaymentMethod paymentMethod,
            String customField
    ) {}

    record PaymentInitiationResult(
            boolean success,
            String token,
            String redirectUrl,
            String rawPayload
    ) {}

    record PaymentStatusResult(
            boolean found,
            String status,
            String paymentMethod,
            BigDecimal amount,
            String currency,
            String rawPayload
    ) {}

    record TransferRequest(
            BigDecimal amount,
            String destinationPhone,
            String serviceName,
            String externalId
    ) {}

    record TransferResult(
            boolean accepted,
            String transferReference,
            String status,
            String rawPayload
    ) {}

    PaymentInitiationResult initiatePayment(PaymentInitiationRequest request);

    PaymentStatusResult getPaymentStatus(String token);

    boolean verifyIpnSignature(String apiKeySha256, String apiSecretSha256);

    TransferResult initiateTransfer(TransferRequest request);

    boolean isRefundApiSupported();
}
