package com.revibeflip.dto;

import com.revibeflip.entity.Report;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour ReportDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDto {
    private Long id;
    private UserDto reporter;
    private UserDto reportedUser;
    private ProductDto reportedProduct;
    private String reason;
    private String reasonLabel;
    private String details;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;
        return ReportDto.builder()
                .id(report.getId())
                .reporter(UserDto.fromEntity(report.getReporter()))
                .reportedUser(UserDto.fromEntity(report.getReportedUser()))
                .reportedProduct(ProductDto.fromEntity(report.getReportedProduct()))
                .reason(report.getReason().name())
                .reasonLabel(report.getReason().getLabel())
                .details(report.getDetails())
                .status(report.getStatus().name())
                .adminNotes(report.getAdminNotes())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}
