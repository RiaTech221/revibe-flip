package com.revibeflip.entity;

import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.DeliveryStatus;
import com.revibeflip.entity.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité JPA représentant une commande d'article avec séquestre, frais de validation et commission.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String orderNumber; // e.g. RF-2026-98432

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<OrderItem> items = new java.util.ArrayList<>();

    // Price breakdown according to specifications:
    // Product Price
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal itemPrice;

    // Prix initial affiché de l'article (avant négociation)
    @Column(precision = 12, scale = 2)
    private BigDecimal originalPrice;

    // Prix convenu accepté lors de l'offre dans le chat
    @Column(precision = 12, scale = 2)
    private BigDecimal agreedPrice;

    // Identifiant de l'offre de chat liée
    private Long chatOfferId;

    // Date/heure limite de réservation avant expiration de la commande
    private LocalDateTime reservationExpiresAt;

    // 1% Transaction Validation / Escrow Fee (paid by buyer)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal validationFee;

    // Delivery Fee (based on delivery mode: Home Delivery vs Handover)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    // Total paid by Buyer = itemPrice + validationFee + deliveryFee
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    // Platform Commission (20% on sale, deducted from seller payout)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal platformCommission;

    // Net amount to be released to Seller once receipt confirmed = itemPrice - platformCommission
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal sellerPayout;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryMode deliveryMode;

    @Column(length = 200)
    private String deliveryAddress;

    @Column(length = 100)
    private String deliveryCity;

    @Column(length = 30)
    private String deliveryPhone;

    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

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
