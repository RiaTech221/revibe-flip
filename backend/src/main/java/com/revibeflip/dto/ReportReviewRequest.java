package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewRequest {
    @NotBlank(message = "Veuillez préciser le motif de signalement de l'avis")
    private String reason;

    private String details;
}
