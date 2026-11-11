package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération LoginRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "L'identifiant (téléphone ou email) est obligatoire")
    private String identifier; // phone or email

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}
