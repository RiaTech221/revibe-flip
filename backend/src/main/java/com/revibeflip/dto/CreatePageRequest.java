package com.revibeflip.dto;

import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO de requête pour l'opération CreatePageRequest.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePageRequest {

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(max = 200, message = "Le titre ne doit pas dépasser 200 caractères.")
    private String title;

    private String slug; // Optional, auto-generated if empty

    @NotBlank(message = "Le contenu est obligatoire.")
    private String content;

    private PageStatus status;

    private Boolean showInFooter;

    private FooterColumn footerColumn;

    private Integer sortOrder;

    private String pdfUrl;
}
