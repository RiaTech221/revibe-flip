package com.revibeflip.dto;

import com.revibeflip.entity.enums.AdminPermission;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Requête de modification des informations et permissions d'un collaborateur (US-36).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCollaboratorPermissionsRequest {

    @Size(max = 60, message = "Le prénom ne peut pas dépasser 60 caractères.")
    private String firstName;

    @Size(max = 60, message = "Le nom ne peut pas dépasser 60 caractères.")
    private String lastName;

    @Email(message = "Format d'adresse e-mail invalide.")
    @Size(max = 120, message = "L'adresse e-mail ne peut pas dépasser 120 caractères.")
    private String email;

    @NotNull(message = "L'ensemble des permissions ne peut pas être nul.")
    private Set<AdminPermission> permissions;
}
