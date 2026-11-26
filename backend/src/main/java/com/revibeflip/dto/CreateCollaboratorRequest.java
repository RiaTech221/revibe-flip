package com.revibeflip.dto;

import com.revibeflip.entity.enums.AdminPermission;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Requête de création d'un compte collaborateur par l'administrateur (US-36).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCollaboratorRequest {

    @NotBlank(message = "Le prénom est obligatoire.")
    @Size(max = 60, message = "Le prénom ne peut pas dépasser 60 caractères.")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire.")
    @Size(max = 60, message = "Le nom ne peut pas dépasser 60 caractères.")
    private String lastName;

    @NotBlank(message = "Le numéro de téléphone est obligatoire.")
    @Pattern(regexp = "^\\+?[1-9][0-9\\s.-]{6,19}$", message = "Format de téléphone invalide (ex: +221771234567).")
    private String phone;

    public String getCleanPhone() {
        if (phone == null) return null;
        String cleaned = phone.replaceAll("[\\s.-]", "");
        if (!cleaned.startsWith("+")) {
            if (cleaned.length() == 9) {
                cleaned = "+221" + cleaned;
            } else {
                cleaned = "+" + cleaned;
            }
        }
        return cleaned;
    }

    @Email(message = "Format d'adresse e-mail invalide.")
    @Size(max = 120, message = "L'adresse e-mail ne peut pas dépasser 120 caractères.")
    private String email;

    @Size(min = 6, max = 100, message = "Le mot de passe doit contenir au moins 6 caractères.")
    private String password;

    @NotEmpty(message = "Au moins une permission doit être attribuée au collaborateur.")
    private Set<AdminPermission> permissions;
}
