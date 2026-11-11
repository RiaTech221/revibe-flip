package com.revibeflip.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour FaqItemDto dans l'écosystème ReVibe FliP.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqItemDto {
    private Long id;
    private String question;
    private String answer;
    private String category;
    private Integer sortOrder;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
