package com.revibeflip.dto;

import com.revibeflip.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de paiement et séquestre.
 *
 * NOTE SUR LE SÉQUESTRE :
 * Simulation interne. Le blocage réel des fonds nécessite l’intégration du prestataire de paiement
 * (Wave/Orange Money/Free Money) et la validation du cadre juridique avant la production.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private Long id;
    private Long orderId;
    private String paymentMethod;
    private String paymentMethodName;
    private String transactionReference;
    private BigDecimal amount;
    private BigDecimal validationFee;
    private String status;
    private String escrowStatus;
    private String escrowStatusDescription;
    private String payerPhoneNumber;
    private LocalDateTime paymentDate;
    private LocalDateTime escrowReleasedDate;

    public static PaymentDto fromEntity(Payment payment) {
        if (payment == null) return null;
        return PaymentDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : null)
                .paymentMethodName(payment.getPaymentMethod() != null ? payment.getPaymentMethod().getDisplayName() : null)
                .transactionReference(payment.getTransactionReference())
                .amount(payment.getAmount())
                .validationFee(payment.getValidationFee())
                .status(payment.getStatus() != null ? payment.getStatus().name() : null)
                .escrowStatus(payment.getEscrowStatus() != null ? payment.getEscrowStatus().name() : null)
                .escrowStatusDescription(payment.getEscrowStatus() != null ? payment.getEscrowStatus().getDescription() : null)
                .payerPhoneNumber(payment.getPayerPhoneNumber())
                .paymentDate(payment.getPaymentDate())
                .escrowReleasedDate(payment.getEscrowReleasedDate())
                .build();
    }
}
