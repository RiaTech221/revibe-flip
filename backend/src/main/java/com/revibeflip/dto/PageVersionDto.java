package com.revibeflip.dto;

import com.revibeflip.entity.enums.PageStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageVersionDto {
    private Long id;
    private Long pageId;
    private Integer versionNumber;
    private String title;
    private String content;
    private String pdfUrl;
    private PageStatus status;
    private String changeSummary;
    private String createdByName;
    private LocalDateTime createdAt;
}
