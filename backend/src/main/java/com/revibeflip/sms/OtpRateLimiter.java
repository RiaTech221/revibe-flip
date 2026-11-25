package com.revibeflip.sms;

import com.revibeflip.exception.TooManyRequestsException;
import com.revibeflip.security.PersistentRateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limiteur de débit persistant pour les routes sensibles (OTP, connexion, inscription),
 * appliqué par numéro de téléphone/identifiant et par adresse IP réelle (SEC-08).
 */
@Component
public class OtpRateLimiter {

    private static final int MAX_OTP_SEND_PER_PHONE_PER_HOUR = 5;
    private static final int MAX_OTP_SEND_PER_IP_PER_HOUR = 15;
    private static final long OTP_COOLDOWN_SECONDS = 60;
    private static final long OTP_WINDOW_SECONDS = 3600;

    private static final int MAX_LOGIN_PER_IDENTIFIER_PER_MINUTE = 10;
    private static final int MAX_LOGIN_PER_IP_PER_MINUTE = 20;
    private static final int MAX_OTP_VERIFY_PER_PHONE_PER_MINUTE = 10;
    private static final long AUTH_WINDOW_SECONDS = 60;

    private final PersistentRateLimitService persistentRateLimitService;

    // Fallback en mémoire uniquement lorsque le bean est instancié sans contexte Spring (tests unitaires isolés)
    private final Map<String, Deque<Instant>> fallbackBuckets = new ConcurrentHashMap<>();
    private final Map<String, Instant> fallbackLastSend = new ConcurrentHashMap<>();

    public OtpRateLimiter() {
        this.persistentRateLimitService = null;
    }

    @Autowired
    public OtpRateLimiter(PersistentRateLimitService persistentRateLimitService) {
        this.persistentRateLimitService = persistentRateLimitService;
    }

    public void checkAndRecordSend(String phone, String clientIp) {
        if (phone != null && !phone.isBlank()) {
            String phoneKey = "otp:send:phone:" + phone.trim();
            checkCooldownAndQuota(
                    phoneKey,
                    MAX_OTP_SEND_PER_PHONE_PER_HOUR,
                    OTP_WINDOW_SECONDS,
                    OTP_COOLDOWN_SECONDS,
                    "Veuillez patienter 60 secondes avant de demander un nouveau code.",
                    "Trop de demandes de code pour ce numéro. Réessayez plus tard."
            );
        }

        if (clientIp != null && !clientIp.isBlank() && !"unknown".equals(clientIp)) {
            String ipKey = "otp:send:ip:" + clientIp.trim();
            checkCooldownAndQuota(
                    ipKey,
                    MAX_OTP_SEND_PER_IP_PER_HOUR,
                    OTP_WINDOW_SECONDS,
                    0L,
                    null,
                    "Trop de demandes depuis cette adresse IP. Réessayez plus tard."
            );
        }
    }

    public void checkLoginAttempt(String identifier, String clientIp) {
        if (identifier != null && !identifier.isBlank()) {
            String idKey = "auth:login:id:" + identifier.trim().toLowerCase();
            checkQuotaOnly(
                    idKey,
                    MAX_LOGIN_PER_IDENTIFIER_PER_MINUTE,
                    AUTH_WINDOW_SECONDS,
                    "Trop de tentatives de connexion pour cet identifiant. Veuillez patienter avant de réessayer."
            );
        }

        if (clientIp != null && !clientIp.isBlank() && !"unknown".equals(clientIp)) {
            String ipKey = "auth:login:ip:" + clientIp.trim();
            checkQuotaOnly(
                    ipKey,
                    MAX_LOGIN_PER_IP_PER_MINUTE,
                    AUTH_WINDOW_SECONDS,
                    "Trop de tentatives de connexion depuis cette adresse IP. Veuillez patienter."
            );
        }
    }

    public void checkOtpVerificationAttempt(String phone, String clientIp) {
        if (phone != null && !phone.isBlank()) {
            String phoneKey = "otp:verify:phone:" + phone.trim();
            checkQuotaOnly(
                    phoneKey,
                    MAX_OTP_VERIFY_PER_PHONE_PER_MINUTE,
                    AUTH_WINDOW_SECONDS,
                    "Trop de tentatives de vérification OTP pour ce numéro. Veuillez patienter."
            );
        }
        if (clientIp != null && !clientIp.isBlank() && !"unknown".equals(clientIp)) {
            String ipKey = "otp:verify:ip:" + clientIp.trim();
            checkQuotaOnly(
                    ipKey,
                    MAX_LOGIN_PER_IP_PER_MINUTE,
                    AUTH_WINDOW_SECONDS,
                    "Trop de tentatives de vérification depuis cette adresse IP. Veuillez patienter."
            );
        }
    }

    private void checkQuotaOnly(String key, int maxRequests, long windowSeconds, String quotaMessage) {
        if (persistentRateLimitService != null) {
            PersistentRateLimitService.RateLimitDecision decision =
                    persistentRateLimitService.checkAndIncrement(key, maxRequests, windowSeconds);
            if (!decision.allowed()) {
                throw new TooManyRequestsException(quotaMessage, decision.retryAfterSeconds());
            }
            return;
        }
        checkInMemory(key, maxRequests, windowSeconds, 0L, null, quotaMessage);
    }

    private void checkCooldownAndQuota(String key,
                                       int maxRequests,
                                       long windowSeconds,
                                       long cooldownSeconds,
                                       String cooldownMessage,
                                       String quotaMessage) {
        if (persistentRateLimitService != null) {
            persistentRateLimitService.checkCooldownAndQuota(
                    key, maxRequests, windowSeconds, cooldownSeconds, cooldownMessage, quotaMessage
            );
            return;
        }
        checkInMemory(key, maxRequests, windowSeconds, cooldownSeconds, cooldownMessage, quotaMessage);
    }

    private void checkInMemory(String key,
                               int maxRequests,
                               long windowSeconds,
                               long cooldownSeconds,
                               String cooldownMessage,
                               String quotaMessage) {
        Instant now = Instant.now();
        if (cooldownSeconds > 0) {
            Instant last = fallbackLastSend.get(key);
            if (last != null && now.isBefore(last.plusSeconds(cooldownSeconds))) {
                long retryAfter = Math.max(1L, Duration.between(now, last.plusSeconds(cooldownSeconds)).getSeconds());
                throw new TooManyRequestsException(cooldownMessage, retryAfter);
            }
        }
        Deque<Instant> deque = fallbackBuckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            Instant cutoff = now.minusSeconds(windowSeconds);
            while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                deque.pollFirst();
            }
            if (deque.size() >= maxRequests) {
                Instant oldest = deque.peekFirst();
                long retryAfter = oldest != null
                        ? Math.max(1L, Duration.between(now, oldest.plusSeconds(windowSeconds)).getSeconds())
                        : windowSeconds;
                throw new TooManyRequestsException(quotaMessage, retryAfter);
            }
            deque.addLast(now);
        }
        if (cooldownSeconds > 0) {
            fallbackLastSend.put(key, now);
        }
    }
}
