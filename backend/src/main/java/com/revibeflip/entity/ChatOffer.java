package com.revibeflip.entity;

import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.OfferStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité JPA représentant une offre de prix directe formulée dans une discussion.
 */
@Entity
@Table(name = "chat_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Prix affiché initial du produit
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal initialPrice;

    // Prix convenu après discussion (doit être <= initialPrice)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal agreedPrice;

    // Mode de livraison convenu (HOME_DELIVERY ou DIRECT_HANDOVER)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryMode deliveryMode;

    // Frais de livraison (ex: 2000 FCFA à domicile, 0 en main propre)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    // Frais de protection acheteur (1% calculé sur agreedPrice)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal validationFee;

    // Total à payer = agreedPrice + deliveryFee + validationFee
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    // Durée de validité en heures (défaut 24h)
    @Column(nullable = false)
    @Builder.Default
    private Integer validityHours = 24;

    // Date et heure d'expiration
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OfferStatus status = OfferStatus.OFFER_SENT;

    // Commande créée lorsque l'offre est acceptée
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return (status == OfferStatus.OFFER_SENT || status == OfferStatus.OFFER_EXPIRED) 
                && LocalDateTime.now().isAfter(expiresAt);
    }
}
