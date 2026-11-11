package com.revibeflip.dto;

import com.revibeflip.entity.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveReportRequest {
    @NotNull(message = "Le statut est obligatoire.")
    private ReportStatus status;

    private String action; // WARN, DEACTIVATE_LISTING, SUSPEND_USER, NONE

    private String adminNotes;
}
