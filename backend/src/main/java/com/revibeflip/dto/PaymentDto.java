package com.revibeflip.dto;

import com.revibeflip.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
                .paymentMethod(payment.getPaymentMethod().name())
                .paymentMethodName(payment.getPaymentMethod().getDisplayName())
                .transactionReference(payment.getTransactionReference())
                .amount(payment.getAmount())
                .validationFee(payment.getValidationFee())
                .status(payment.getStatus().name())
                .escrowStatus(payment.getEscrowStatus().name())
                .escrowStatusDescription(payment.getEscrowStatus().getDescription())
                .payerPhoneNumber(payment.getPayerPhoneNumber())
                .paymentDate(payment.getPaymentDate())
                .escrowReleasedDate(payment.getEscrowReleasedDate())
                .build();
    }
}
