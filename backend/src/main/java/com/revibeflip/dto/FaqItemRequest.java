package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqItemRequest {

    @NotBlank(message = "La question est obligatoire.")
    @Size(max = 300, message = "La question ne doit pas dépasser 300 caractères.")
    private String question;

    @NotBlank(message = "La réponse est obligatoire.")
    private String answer;

    private String category;

    private Integer sortOrder;

    private Boolean isPublished;
}
