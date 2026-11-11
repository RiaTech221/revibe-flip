package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération AddressRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequest {

    @NotBlank(message = "L'intitulé de l'adresse est obligatoire (ex: Domicile, Bureau)")
    @Size(max = 60)
    private String title;

    @NotBlank(message = "Le nom du destinataire est obligatoire")
    @Size(max = 100)
    private String recipientName;

    @NotBlank(message = "Le téléphone de contact est obligatoire")
    @Size(max = 30)
    private String phone;

    @NotBlank(message = "La ville ou région est obligatoire (ex: Dakar)")
    @Size(max = 60)
    private String city;

    @NotBlank(message = "L'adresse détaillée ou le quartier est obligatoire")
    @Size(max = 255)
    private String addressLine;

    private Boolean isDefault;
}
