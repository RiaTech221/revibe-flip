package com.revibeflip.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "faq_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String question;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String category = "Général"; // Commandes, Paiement & Séquestre, Livraison, Litiges, Compte

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublished = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
