package com.revibeflip.entity;

import com.revibeflip.entity.enums.LedgerEntryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Écriture comptable immuable du grand livre des fonds.
 * Aucune modification ni suppression n'est autorisée après création.
 */
@Entity
@Table(name = "ledger_entries", indexes = {
        @Index(name = "idx_ledger_order_id", columnList = "order_id"),
        @Index(name = "idx_ledger_type", columnList = "entry_type"),
        @Index(name = "idx_ledger_created_at", columnList = "created_at")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, updatable = false)
    private Long orderId;

    @Column(name = "order_number", nullable = false, updatable = false, length = 50)
    private String orderNumber;

    @Column(name = "payment_reference", nullable = false, updatable = false, length = 120)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, updatable = false, length = 30)
    private LedgerEntryType entryType;

    @Column(nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false, length = 10)
    @Builder.Default
    private String currency = "XOF";

    @Column(name = "user_id", updatable = false)
    private Long userId;

    @Column(nullable = false, updatable = false, length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PreUpdate
    public void preventUpdate() {
        throw new UnsupportedOperationException("Les écritures du grand livre sont immuables et ne peuvent pas être modifiées.");
    }

    @PreRemove
    public void preventDelete() {
        throw new UnsupportedOperationException("Les écritures du grand livre sont immuables et ne peuvent pas être supprimées.");
    }
}
