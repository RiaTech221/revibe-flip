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

    @Size(max = 60)
    private String firstName;

    @Size(max = 60)
    private String lastName;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Size(max = 30)
    private String phone; // e.g. +221771234567

    private String email;

    private String password;

    private String confirmPassword;

    private String countryCode; // e.g. "SN", defaults to SN if not specified
}
