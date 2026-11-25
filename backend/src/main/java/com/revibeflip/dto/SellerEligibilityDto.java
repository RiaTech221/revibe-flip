package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Résultat de vérification d'éligibilité d'un utilisateur à devenir vendeur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerEligibilityDto {
    private boolean eligible;
    private List<String> missingFields;
    private Map<String, String> invalidFields;
    private String message;
}
