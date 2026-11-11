package com.revibeflip.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour MediaAssetDto dans l'écosystème ReVibe FliP.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaAssetDto {
    private Long id;
    private String filename;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String url;
    private String altText;
    private String uploadedByName;
    private LocalDateTime createdAt;
}
