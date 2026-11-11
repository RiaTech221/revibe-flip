package com.revibeflip.dto;

import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsPageDto {
    private Long id;
    private String slug;
    private String title;
    private String content;
    private PageStatus status;
    private Boolean showInFooter;
    private FooterColumn footerColumn;
    private Integer sortOrder;
    private Boolean isSystemPage;
    private String pdfUrl;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer currentVersion;
}
