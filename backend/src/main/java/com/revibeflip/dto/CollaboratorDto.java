package com.revibeflip.dto;

import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AdminPermission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;

/**
 * DTO représentant un collaborateur du Back-Office avec ses permissions modulaires (US-36).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaboratorDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private Boolean isSuspended;
    private Boolean isVerified;
    private Set<AdminPermission> permissions;
    private String initialPassword; // Renseigné uniquement lors de la création pour transmission
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CollaboratorDto fromEntity(User user) {
        if (user == null) return null;
        return CollaboratorDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isSuspended(Boolean.TRUE.equals(user.getIsSuspended()))
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .permissions(user.getAdminPermissions() != null ? user.getAdminPermissions() : Collections.emptySet())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
