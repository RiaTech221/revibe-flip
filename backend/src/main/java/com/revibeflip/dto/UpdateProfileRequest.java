package com.revibeflip.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération UpdateProfileRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 60, message = "Le prénom ne peut dépasser 60 caractères.")
    private String firstName;

    @Size(max = 60, message = "Le nom ne peut dépasser 60 caractères.")
    private String lastName;

    @Email(message = "Format d'adresse email invalide.")
    @Size(max = 120, message = "L'adresse email ne peut dépasser 120 caractères.")
    private String email;

    @Size(max = 200, message = "L'adresse ne peut dépasser 200 caractères.")
    private String address;

    @Size(max = 100, message = "La ville ne peut dépasser 100 caractères.")
    private String city;

    @Size(max = 255, message = "L'URL de photo de profil ne peut dépasser 255 caractères.")
    private String profilePicture;
}
