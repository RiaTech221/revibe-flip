package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateReportRequest;
import com.revibeflip.dto.ReportDto;
import com.revibeflip.entity.User;
import com.revibeflip.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrôleur REST pour le signalement d'annonces ou d'utilisateurs suspects auprès de la modération.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Signalements & Litiges", description = "Signalement d'articles frauduleux ou profils suspects")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @Operation(summary = "Signaler un article ou un profil utilisateur")
    public ResponseEntity<ApiResponse<ReportDto>> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal User reporter
    ) {
        ReportDto report = reportService.createReport(request, reporter);
        return ResponseEntity.ok(ApiResponse.ok(report, "Votre signalement a été transmis à l'équipe de modération."));
    }
}
