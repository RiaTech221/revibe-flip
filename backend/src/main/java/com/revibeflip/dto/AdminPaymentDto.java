package com.revibeflip.dto;

import com.revibeflip.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de transaction financière pour la console administrateur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentDto {
    private Long id;
    private String transactionReference;
    private Long orderId;
    private String orderNumber;
    private String productTitle;
    private String buyerName;
    private String buyerPhone;
    private String sellerName;
    private String sellerPhone;

    // Split des montants (Module 7)
    private BigDecimal itemPrice;
    private BigDecimal validationFee; // 1%
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private BigDecimal platformCommission; // 20%
    private BigDecimal sellerPayout; // 80%

    private String paymentMethod;
    private String paymentMethodName;
    private String status;
    private String escrowStatus;
    private String escrowStatusDescription;
    private String payerPhoneNumber;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;

    public static AdminPaymentDto fromEntity(Payment payment) {
        if (payment == null) return null;
        var order = payment.getOrder();
        return AdminPaymentDto.builder()
                .id(payment.getId())
                .transactionReference(payment.getTransactionReference())
                .orderId(order != null ? order.getId() : null)
                .orderNumber(order != null ? order.getOrderNumber() : "N/A")
                .productTitle(order != null && order.getProduct() != null ? order.getProduct().getTitle() : "N/A")
                .buyerName(order != null && order.getBuyer() != null ? order.getBuyer().getFullName() : "N/A")
                .buyerPhone(order != null && order.getBuyer() != null ? order.getBuyer().getPhone() : "N/A")
                .sellerName(order != null && order.getSeller() != null ? order.getSeller().getFullName() : "N/A")
                .sellerPhone(order != null && order.getSeller() != null ? order.getSeller().getPhone() : "N/A")
                .itemPrice(order != null ? order.getItemPrice() : BigDecimal.ZERO)
                .validationFee(payment.getValidationFee() != null ? payment.getValidationFee() : (order != null ? order.getValidationFee() : BigDecimal.ZERO))
                .deliveryFee(order != null ? order.getDeliveryFee() : BigDecimal.ZERO)
                .totalAmount(payment.getAmount() != null ? payment.getAmount() : (order != null ? order.getTotalAmount() : BigDecimal.ZERO))
                .platformCommission(order != null ? order.getPlatformCommission() : BigDecimal.ZERO)
                .sellerPayout(order != null ? order.getSellerPayout() : BigDecimal.ZERO)
                .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "WAVE")
                .paymentMethodName(payment.getPaymentMethod() != null ? payment.getPaymentMethod().getDisplayName() : "Wave")
                .status(payment.getStatus() != null ? payment.getStatus().name() : "PAID")
                .escrowStatus(payment.getEscrowStatus() != null ? payment.getEscrowStatus().name() : "LOCKED")
                .escrowStatusDescription(payment.getEscrowStatus() != null ? payment.getEscrowStatus().getDescription() : "")
                .payerPhoneNumber(payment.getPayerPhoneNumber())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
