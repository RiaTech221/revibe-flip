package com.revibeflip.entity;

import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.DeliveryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(nullable = false, unique = true, length = 60)
    private String trackingNumber; // Ex: TRK-DKR-89234

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(length = 100)
    private String carrierName; // Ex: "Express Moto Dakar", "Livraison Rapide Thiès"

    @Column(length = 30)
    private String carrierPhone;

    private LocalDateTime estimatedDelivery;

    private LocalDateTime pickedUpAt;

    private LocalDateTime deliveredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
