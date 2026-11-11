package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageRequest {

    @NotBlank(message = "Le nom complet est obligatoire.")
    @Size(max = 120, message = "Le nom ne doit pas dépasser 120 caractères.")
    private String fullName;

    @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères.")
    private String email;

    @Size(max = 40, message = "Le téléphone ne doit pas dépasser 40 caractères.")
    private String phone;

    @NotBlank(message = "Le sujet est obligatoire.")
    @Size(max = 200, message = "Le sujet ne doit pas dépasser 200 caractères.")
    private String subject;

    @NotBlank(message = "Le message est obligatoire.")
    @Size(min = 10, max = 5000, message = "Le message doit contenir entre 10 et 5000 caractères.")
    private String message;
}
