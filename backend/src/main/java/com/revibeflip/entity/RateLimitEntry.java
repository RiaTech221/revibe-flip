package com.revibeflip.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entrée persistante de limitation de débit (SEC-08) partagée entre instances.
 */
@Entity
@Table(name = "rate_limit_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bucket_key", nullable = false, unique = true, length = 180)
    private String bucketKey;

    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private Integer requestCount = 0;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
