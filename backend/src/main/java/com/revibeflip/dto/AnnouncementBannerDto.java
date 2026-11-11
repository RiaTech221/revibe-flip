package com.revibeflip.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour AnnouncementBannerDto dans l'écosystème ReVibe FliP.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementBannerDto {
    private Boolean enabled;
    private String message;
    private String link;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isCurrentlyActive;
}
