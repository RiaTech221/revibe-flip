package com.revibeflip.service.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookResult {
    private boolean successful;
    private String transactionReference;
    private BigDecimal amount;
    private String providerStatus;
    private String rawPayload;
    private String failureReason;
}
