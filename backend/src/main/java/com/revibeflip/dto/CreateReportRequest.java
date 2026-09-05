package com.revibeflip.dto;

import com.revibeflip.entity.enums.ReportReason;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {

    private Long reportedUserId;

    private Long reportedProductId;

    @NotNull(message = "Le motif du signalement est obligatoire")
    private ReportReason reason;

    private String details;
}
