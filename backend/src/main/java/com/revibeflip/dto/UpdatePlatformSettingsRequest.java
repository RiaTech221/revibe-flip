package com.revibeflip.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de requête pour l'opération UpdatePlatformSettingsRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlatformSettingsRequest {
    @NotNull(message = "Le taux de commission est obligatoire.")
    @DecimalMin(value = "0.0", message = "La commission ne peut être négative.")
    @DecimalMax(value = "50.0", message = "La commission ne peut dépasser 50%.")
    private BigDecimal commissionRate;

    @NotNull(message = "Le taux de frais de validation est obligatoire.")
    @DecimalMin(value = "0.0", message = "Les frais ne peuvent être négatifs.")
    @DecimalMax(value = "10.0", message = "Les frais ne peuvent dépasser 10%.")
    private BigDecimal validationFeeRate;

    @NotBlank(message = "Le nom de la plateforme est obligatoire.")
    private String platformName;

    @NotBlank(message = "L'email support est obligatoire.")
    private String supportEmail;

    @NotBlank(message = "Le téléphone support est obligatoire.")
    private String supportPhone;

    @NotBlank(message = "La devise est obligatoire.")
    private String currency;

    private Integer offerValidityHours;

    private Integer reservationDurationHours;

    private Boolean demoMode;
}
