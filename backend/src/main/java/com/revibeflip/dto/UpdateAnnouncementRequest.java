package com.revibeflip.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAnnouncementRequest {
    private Boolean enabled;
    private String message;
    private String link;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
