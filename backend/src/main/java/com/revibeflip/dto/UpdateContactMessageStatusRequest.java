package com.revibeflip.dto;

import com.revibeflip.entity.enums.ContactMessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

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
