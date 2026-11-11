package com.revibeflip.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entité JPA représentant un pays africain pris en charge avec sa devise et son préfixe téléphonique.
 */
@Entity
@Table(name = "countries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code; // SN, CI, ML, etc.

    @Column(nullable = false, length = 100)
    private String name; // Sénégal, Côte d'Ivoire, etc.

    @Column(nullable = false, length = 10)
    private String phoneCode; // +221, +225, etc.

    @Column(nullable = false, length = 10)
    private String currency; // XOF, etc.

    @Column(length = 10)
    private String flagEmoji; // 🇸🇳, etc.

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
