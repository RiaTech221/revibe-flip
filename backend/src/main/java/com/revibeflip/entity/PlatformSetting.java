package com.revibeflip.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionRate = BigDecimal.valueOf(20.0); // 20% commission plateforme

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal validationFeeRate = BigDecimal.valueOf(1.0); // 1% frais de validation séquestre

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String platformName = "ReVibe FliP";

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String supportEmail = "contact@revibeflip.com";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String supportPhone = "+221770000000";

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "FCFA";

    @Column(nullable = false)
    @Builder.Default
    private Integer offerValidityHours = 24; // Durée de validité d'une offre en heures

    @Column(nullable = false)
    @Builder.Default
    private Integer reservationDurationHours = 24; // Durée de réservation avant paiement en heures

    @Column(nullable = false)
    @Builder.Default
    private Boolean demoMode = false; // Mode démonstration sans prélèvement réel

    // --- Footer & Support Content ---
    @Column(length = 255)
    @Builder.Default
    private String footerCatchphrase = "La marketplace sénégalaise de seconde main dédiée aux vêtements et articles du quotidien.";

    @Column(length = 255)
    @Builder.Default
    private String footerCopyright = "© {year} ReVibe FliP. Tous droits réservés.";

    @Column(length = 150)
    @Builder.Default
    private String supportAddress = "Dakar, Sénégal";

    @Column(length = 100)
    @Builder.Default
    private String supportHours = "Lun - Sam : 08h00 - 20h00";

    // --- Réseaux Sociaux (URLs configurables par l'admin) ---
    @Column(length = 255)
    @Builder.Default
    private String socialInstagram = "https://instagram.com/revibeflip";

    @Column(length = 255)
    @Builder.Default
    private String socialFacebook = "https://facebook.com/revibeflip";

    @Column(length = 255)
    @Builder.Default
    private String socialTiktok = "https://tiktok.com/@revibeflip";

    @Column(length = 255)
    @Builder.Default
    private String socialWhatsapp = "https://wa.me/221770000000";

    @Column(length = 255)
    private String socialX;

    @Column(length = 255)
    private String socialYoutube;

    @Column(length = 255)
    private String socialLinkedin;

    // --- Bandeau d'annonce temporaire en haut du site ---
    @Column(nullable = false)
    @Builder.Default
    private Boolean announcementEnabled = false;

    @Column(length = 255)
    @Builder.Default
    private String announcementMessage = "🎉 Bienvenue sur ReVibe FliP : Achetez & vendez vos articles de seconde main en toute sécurité à Dakar !";

    @Column(length = 255)
    private String announcementLink;

    private LocalDateTime announcementStartDate;

    private LocalDateTime announcementEndDate;

    // --- Textes vitrine d'accueil éditables ---
    @Column(length = 200)
    @Builder.Default
    private String heroTitle = "Donnez une seconde vie à votre style à Dakar";

    @Column(length = 300)
    @Builder.Default
    private String heroSubtitle = "Achetez et vendez des vêtements et accessoires authentiques de seconde main en toute sécurité grâce au paiement sous séquestre.";

    @Column(length = 100)
    @Builder.Default
    private String heroCtaText = "Explorer le catalogue";

    @Column(length = 200)
    @Builder.Default
    private String heroCtaLink = "/catalog";

    @Column(length = 500)
    private String heroImageUrl;

    @Column(length = 500)
    private String logoLightBgUrl;

    @Column(length = 500)
    private String logoDarkBgUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
