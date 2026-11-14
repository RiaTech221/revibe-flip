package com.revibeflip.entity;

import com.revibeflip.entity.enums.EscrowStatus;
import com.revibeflip.entity.enums.PaymentMethod;
import com.revibeflip.entity.enums.PaymentStatus;
import com.revibeflip.entity.enums.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité Payment représentant la transaction financière.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Column(nullable = false, unique = true, length = 100)
    private String transactionReference;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount; // Total amount paid

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal validationFee; // 1% validation fee portion

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.INITIATED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EscrowStatus escrowStatus = EscrowStatus.LOCKED;

    @Column(length = 30)
    private String payerPhoneNumber;

    private LocalDateTime paymentDate;

    private LocalDateTime escrowReleasedDate;

    @Column(columnDefinition = "TEXT")
    private String gatewayResponsePayload;

    @Column(length = 120)
    private String paytechToken;

    @Column(precision = 12, scale = 2)
    private BigDecimal gatewayFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PayoutStatus payoutStatus = PayoutStatus.NONE;

    @Column(length = 120)
    private String payoutReference;

    @Column(length = 30)
    private String payoutRecipientPhone;

    private LocalDateTime payoutDate;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
