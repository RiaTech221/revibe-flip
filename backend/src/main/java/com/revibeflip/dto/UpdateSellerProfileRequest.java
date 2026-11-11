package com.revibeflip.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération UpdateSellerProfileRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSellerProfileRequest {
    @Size(max = 50, message = "Le prénom ne peut dépasser 50 caractères")
    private String firstName;

    @Size(max = 50, message = "Le nom ne peut dépasser 50 caractères")
    private String lastName;

    private String email;
    private String city;
    private String address;
    private String profilePicture;
    private String bio;
}
