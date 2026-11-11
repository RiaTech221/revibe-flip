package com.revibeflip.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_action_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(nullable = false, length = 50)
    private String actionType; // USER_SUSPEND, USER_REACTIVATE, ROLE_CHANGE, PRODUCT_STATUS_UPDATE, PRODUCT_DELETE, CATEGORY_CREATE, CATEGORY_UPDATE, CATEGORY_DELETE, REPORT_RESOLVED, SETTINGS_UPDATE

    @Column(nullable = false, length = 50)
    private String targetType; // USER, PRODUCT, CATEGORY, REPORT, ORDER, PLATFORM_SETTING

    @Column(length = 50)
    private String targetId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
