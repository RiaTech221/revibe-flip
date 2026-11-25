package com.revibeflip.security;

import com.revibeflip.entity.RateLimitEntry;
import com.revibeflip.exception.TooManyRequestsException;
import com.revibeflip.repository.RateLimitEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Service persistant et partagé de limitation de débit (SEC-08).
 * <p>
 * Persiste les compteurs dans la table {@code rate_limit_entries} via {@code REQUIRES_NEW}
 * afin que :
 * <ul>
 *   <li>les compteurs survivent aux redémarrages et soient partagés entre plusieurs instances ;</li>
 *   <li>les tentatives échouées (ex. mauvais mot de passe) ne soient pas annulées par un rollback métier.</li>
 * </ul>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersistentRateLimitService {

    public record RateLimitDecision(boolean allowed, long retryAfterSeconds) {}

    private final RateLimitEntryRepository repository;
    private final PlatformTransactionManager transactionManager;

    public RateLimitDecision checkAndIncrement(String rawKey, int maxRequests, long windowSeconds) {
        String bucketKey = normalizeKey(rawKey);
        return executeInNewTransaction(() -> doCheckAndIncrement(bucketKey, maxRequests, windowSeconds));
    }

    public void checkCooldownAndQuota(String rawKey,
                                      int maxRequests,
                                      long windowSeconds,
                                      long cooldownSeconds,
                                      String cooldownMessage,
                                      String quotaMessage) {
        String bucketKey = normalizeKey(rawKey);
        executeInNewTransaction(() -> {
            doCheckCooldownAndQuota(bucketKey, maxRequests, windowSeconds, cooldownSeconds, cooldownMessage, quotaMessage);
            return null;
        });
    }

    private <T> T executeInNewTransaction(java.util.function.Supplier<T> action) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            return template.execute(status -> action.get());
        } catch (DataIntegrityViolationException race) {
            // En cas de création concurrente simultanée de la même clé, on réessaie sur l'entrée existante.
            return template.execute(status -> action.get());
        }
    }

    private RateLimitDecision doCheckAndIncrement(String bucketKey, int maxRequests, long windowSeconds) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitEntry entry = repository.findLockedByBucketKey(bucketKey).orElse(null);

        if (entry == null) {
            repository.saveAndFlush(RateLimitEntry.builder()
                    .bucketKey(bucketKey)
                    .requestCount(1)
                    .windowStart(now)
                    .lastSentAt(now)
                    .updatedAt(now)
                    .build());
            return new RateLimitDecision(true, 0L);
        }

        if (entry.getBlockedUntil() != null && now.isBefore(entry.getBlockedUntil())) {
            long retryAfter = Math.max(1L, Duration.between(now, entry.getBlockedUntil()).getSeconds());
            return new RateLimitDecision(false, retryAfter);
        }

        LocalDateTime windowEnd = entry.getWindowStart().plusSeconds(windowSeconds);
        if (!now.isBefore(windowEnd)) {
            entry.setWindowStart(now);
            entry.setRequestCount(1);
            entry.setBlockedUntil(null);
            entry.setLastSentAt(now);
            entry.setUpdatedAt(now);
            repository.save(entry);
            return new RateLimitDecision(true, 0L);
        }

        if (entry.getRequestCount() >= maxRequests) {
            long retryAfter = Math.max(1L, Duration.between(now, windowEnd).getSeconds());
            entry.setBlockedUntil(windowEnd);
            entry.setUpdatedAt(now);
            repository.save(entry);
            return new RateLimitDecision(false, retryAfter);
        }

        entry.setRequestCount(entry.getRequestCount() + 1);
        entry.setLastSentAt(now);
        entry.setUpdatedAt(now);
        repository.save(entry);
        return new RateLimitDecision(true, 0L);
    }

    private void doCheckCooldownAndQuota(String bucketKey,
                                         int maxRequests,
                                         long windowSeconds,
                                         long cooldownSeconds,
                                         String cooldownMessage,
                                         String quotaMessage) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitEntry entry = repository.findLockedByBucketKey(bucketKey).orElse(null);

        if (entry == null) {
            repository.saveAndFlush(RateLimitEntry.builder()
                    .bucketKey(bucketKey)
                    .requestCount(1)
                    .windowStart(now)
                    .lastSentAt(now)
                    .updatedAt(now)
                    .build());
            return;
        }

        if (cooldownSeconds > 0 && entry.getLastSentAt() != null) {
            LocalDateTime cooldownEnd = entry.getLastSentAt().plusSeconds(cooldownSeconds);
            if (now.isBefore(cooldownEnd)) {
                long retryAfter = Math.max(1L, Duration.between(now, cooldownEnd).getSeconds());
                throw new TooManyRequestsException(cooldownMessage, retryAfter);
            }
        }

        LocalDateTime windowEnd = entry.getWindowStart().plusSeconds(windowSeconds);
        if (!now.isBefore(windowEnd)) {
            entry.setWindowStart(now);
            entry.setRequestCount(1);
            entry.setBlockedUntil(null);
            entry.setLastSentAt(now);
            entry.setUpdatedAt(now);
            repository.save(entry);
            return;
        }

        if (entry.getRequestCount() >= maxRequests) {
            long retryAfter = Math.max(1L, Duration.between(now, windowEnd).getSeconds());
            entry.setBlockedUntil(windowEnd);
            entry.setUpdatedAt(now);
            repository.save(entry);
            throw new TooManyRequestsException(quotaMessage, retryAfter);
        }

        entry.setRequestCount(entry.getRequestCount() + 1);
        entry.setLastSentAt(now);
        entry.setUpdatedAt(now);
        repository.save(entry);
    }

    @Scheduled(fixedDelay = 3_600_000L)
    @Transactional
    public void purgeExpiredEntries() {
        int deleted = repository.deleteOlderThan(LocalDateTime.now().minusHours(24));
        if (deleted > 0) {
            log.debug("Nettoyage rate_limit_entries : {} entrée(s) expirée(s) supprimée(s).", deleted);
        }
    }

    private String normalizeKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            return "unknown";
        }
        return rawKey.length() <= 180 ? rawKey : rawKey.substring(0, 180);
    }
}
