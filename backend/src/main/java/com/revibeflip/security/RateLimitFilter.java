package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtre de limitation de débit (Rate Limiting) et de protection anti-bot
 * par adresse IP réelle (derrière proxy de confiance) et groupe d'endpoints sensibles.
 * <p>
 * Délègue le stockage des compteurs à {@link PersistentRateLimitService} en environnement Spring
 * pour garantir la persistance entre redémarrages et le partage multi-instances.
 * </p>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_BUCKETS = 10_000;
    private static final long WINDOW_SECONDS = 60L;
    private static final Set<String> BLOCKED_BOT_SIGNATURES = Set.of(
            "sqlmap", "nikto", "nessus", "masscan", "zgrab",
            "gobuster", "dirbuster", "wfuzz", "nuclei", "acunetix", "havij"
    );

    private final ClientIpResolver clientIpResolver;
    private final PersistentRateLimitService persistentRateLimitService;
    private final Map<String, Deque<Instant>> fallbackBuckets = new ConcurrentHashMap<>();

    public RateLimitFilter() {
        this(new ClientIpResolver(), null);
    }

    @Autowired
    public RateLimitFilter(ClientIpResolver clientIpResolver,
                           PersistentRateLimitService persistentRateLimitService) {
        this.clientIpResolver = clientIpResolver != null ? clientIpResolver : new ClientIpResolver();
        this.persistentRateLimitService = persistentRateLimitService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userAgent = request.getHeader("User-Agent");
        if (isMaliciousBot(userAgent)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Requête bloquée par la protection anti-bot.\"}");
            return;
        }

        String path = request.getRequestURI();
        if (path != null && (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/") || path.startsWith("/api/payments/"))) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            response.setHeader("Pragma", "no-cache");
        }

        LimitRule rule = resolveRule(path, request.getMethod());
        if (rule != null) {
            String key = "filter:" + rule.bucketName + ":ip:" + extractClientIp(request);
            PersistentRateLimitService.RateLimitDecision decision = checkBucket(key, rule.maxPerMinute);
            if (!decision.allowed()) {
                long retryAfter = Math.max(1L, decision.retryAfterSeconds());
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Trop de requêtes. Veuillez patienter "
                                + retryAfter + " seconde(s) avant de réessayer.\",\"data\":{\"retryAfterSeconds\":"
                                + retryAfter + "}}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private PersistentRateLimitService.RateLimitDecision checkBucket(String key, int maxPerMinute) {
        if (persistentRateLimitService != null) {
            return persistentRateLimitService.checkAndIncrement(key, maxPerMinute, WINDOW_SECONDS);
        }
        return allowInMemory(key, maxPerMinute);
    }

    private boolean isMaliciousBot(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return false;
        }
        String lower = userAgent.toLowerCase(Locale.ROOT);
        for (String sig : BLOCKED_BOT_SIGNATURES) {
            if (lower.contains(sig)) {
                return true;
            }
        }
        return false;
    }

    private LimitRule resolveRule(String path, String method) {
        if (path == null) return null;
        String normalized = path.startsWith("/api/v1/") ? "/api/" + path.substring("/api/v1/".length()) : path;

        if (normalized.startsWith("/api/auth/login")
                || normalized.startsWith("/api/auth/register")
                || normalized.startsWith("/api/auth/forgot-password")
                || normalized.startsWith("/api/auth/reset-password")
                || normalized.startsWith("/api/auth/resend-otp")
                || normalized.startsWith("/api/auth/verify-otp")
                || normalized.startsWith("/api/auth/skip-otp")) {
            return new LimitRule("auth", 20);
        }
        if (normalized.startsWith("/api/payments/ipn") || normalized.startsWith("/api/payments/transfer-ipn")) {
            return new LimitRule("ipn", 60);
        }
        if (normalized.startsWith("/api/contact")) {
            return new LimitRule("contact", 10);
        }
        if (normalized.startsWith("/api/uploads")) {
            return new LimitRule("uploads", 15);
        }
        if (HttpMethod.POST.matches(method)
                && (normalized.equals("/api/products") || normalized.equals("/api/seller/products"))) {
            return new LimitRule("listings", 15);
        }
        if (HttpMethod.POST.matches(method) && normalized.startsWith("/api/reports")) {
            return new LimitRule("reports", 10);
        }
        if (normalized.startsWith("/api/chat") || normalized.startsWith("/api/offers")) {
            return new LimitRule("messaging", 60);
        }
        return null;
    }

    private PersistentRateLimitService.RateLimitDecision allowInMemory(String key, int maxPerMinute) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);
        if (fallbackBuckets.size() >= MAX_BUCKETS && !fallbackBuckets.containsKey(key)) {
            pruneExpiredBuckets(cutoff);
        }
        Deque<Instant> deque = fallbackBuckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                deque.pollFirst();
            }
            if (deque.size() >= maxPerMinute) {
                Instant oldest = deque.peekFirst();
                long retryAfter = oldest != null
                        ? Math.max(1L, Duration.between(now, oldest.plusSeconds(WINDOW_SECONDS)).getSeconds())
                        : WINDOW_SECONDS;
                return new PersistentRateLimitService.RateLimitDecision(false, retryAfter);
            }
            deque.addLast(now);
            return new PersistentRateLimitService.RateLimitDecision(true, 0L);
        }
    }

    private void pruneExpiredBuckets(Instant cutoff) {
        fallbackBuckets.entrySet().removeIf(entry -> {
            Deque<Instant> deque = entry.getValue();
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                    deque.pollFirst();
                }
                return deque.isEmpty();
            }
        });
        if (fallbackBuckets.size() >= MAX_BUCKETS) {
            fallbackBuckets.clear();
        }
    }

    String extractClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    private record LimitRule(String bucketName, int maxPerMinute) {}
}
