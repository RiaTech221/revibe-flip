package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Requête de création ou mise à jour du mot de passe après validation OTP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetPasswordRequest {

    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères.")
    private String password;

    private String currentPassword;
}
