package com.revibeflip.dto;

import com.revibeflip.entity.enums.ContactMessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO de requête pour l'opération UpdateContactMessageStatusRequest.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateContactMessageStatusRequest {

    @NotNull(message = "Le statut est obligatoire.")
    private ContactMessageStatus status;

    private String adminNotes;
}
