package com.revibeflip.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tableau de bord personnel d'un utilisateur connecté (US-06).
 * <ul>
 *   <li>Pour tout utilisateur : historique paginé des achats ({@code purchases}).</li>
 *   <li>Réservé exclusivement aux vendeurs ({@code isSeller = true}) : ventes ({@code sales}),
 *       annonces ({@code listings}), note moyenne sur 5 ({@code averageRating}), nombre d'avis
 *       ({@code reviewCount}) et évaluations reçues ({@code reviews}).</li>
 *   <li>Pour un simple acheteur ({@code isSeller = false}), tous les champs vendeur sont {@code null}
 *       et omis de la réponse JSON.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PersonalDashboardDto {

    @JsonProperty("isSeller")
    private boolean isSeller;

    // Historique des achats (visible par tout utilisateur)
    private long purchasesCount;
    private PageResponseDto<OrderDto> purchases;

    // Champs strictement réservés aux vendeurs (null / absents pour un simple acheteur)
    private Long salesCount;
    private PageResponseDto<OrderDto> sales;

    private Long listingsCount;
    private PageResponseDto<ProductDto> listings;

    private Double averageRating;
    private Long reviewCount;
    private PageResponseDto<ReviewDto> reviews;
}
