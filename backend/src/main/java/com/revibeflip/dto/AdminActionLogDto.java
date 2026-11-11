package com.revibeflip.dto;

import com.revibeflip.entity.AdminActionLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour AdminActionLogDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActionLogDto {
    private Long id;
    private String adminName;
    private String adminPhone;
    private String actionType;
    private String targetType;
    private String targetId;
    private String details;
    private LocalDateTime createdAt;

    public static AdminActionLogDto fromEntity(AdminActionLog log) {
        if (log == null) return null;
        return AdminActionLogDto.builder()
                .id(log.getId())
                .adminName(log.getAdmin() != null ? log.getAdmin().getFullName() : "Admin")
                .adminPhone(log.getAdmin() != null ? log.getAdmin().getPhone() : "")
                .actionType(log.getActionType())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
