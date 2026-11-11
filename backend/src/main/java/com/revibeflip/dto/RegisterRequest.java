package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération RegisterRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 60)
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 60)
    private String lastName;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Size(max = 30)
    private String phone; // e.g. +221771234567

    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;

    private String confirmPassword;

    private String countryCode; // e.g. "SN", defaults to SN if not specified
}
