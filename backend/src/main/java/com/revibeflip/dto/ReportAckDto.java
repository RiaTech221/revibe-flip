package com.revibeflip.dto;

import com.revibeflip.entity.Report;

import java.time.LocalDateTime;

/**
 * SEC-01 — Accusé de réception minimal renvoyé par POST /api/reports.
 *
 * <p>Ne contient aucune donnée de l'utilisateur signalé ni du reporter.
 * L'interface d'administration continue d'utiliser {@link ReportDto} complet
 * via GET /api/admin/reports et PUT /api/admin/reports/{id}/resolve.
 */
public record ReportAckDto(
        Long id,
        String status,
        LocalDateTime createdAt
) {
    public static ReportAckDto fromEntity(Report report) {
        if (report == null) return null;
        return new ReportAckDto(
                report.getId(),
                report.getStatus() != null ? report.getStatus().name() : null,
                report.getCreatedAt()
        );
    }
}
