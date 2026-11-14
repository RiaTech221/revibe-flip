package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Filtre de limitation de débit (Rate Limiting) et de protection anti-bot basique
 * par adresse IP réelle et groupe d'endpoints sensibles.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_BUCKETS = 10_000;
    private static final Pattern VALID_IP_PATTERN = Pattern.compile("^[0-9a-fA-F:.]{3,45}$");
    private static final Set<String> BLOCKED_BOT_SIGNATURES = Set.of(
            "sqlmap", "nikto", "nessus", "masscan", "zgrab",
            "gobuster", "dirbuster", "wfuzz", "nuclei", "acunetix", "havij"
    );

    private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

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
        if (path != null && (path.startsWith("/api/auth/") || path.startsWith("/api/payments/"))) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            response.setHeader("Pragma", "no-cache");
        }

        LimitRule rule = resolveRule(path, request.getMethod());
        if (rule != null && !allow(extractClientIp(request) + ":" + rule.bucketName, rule.maxPerMinute)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Trop de requêtes. Veuillez patienter avant de réessayer.\"}");
            return;
        }

        filterChain.doFilter(request, response);
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
        if (path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/reset-password")
                || path.startsWith("/api/auth/resend-otp")
                || path.startsWith("/api/auth/verify-otp")) {
            return new LimitRule("auth", 20);
        }
        if (path.startsWith("/api/payments/ipn") || path.startsWith("/api/payments/transfer-ipn")) {
            return new LimitRule("ipn", 60);
        }
        if (path.startsWith("/api/contact")) {
            return new LimitRule("contact", 10);
        }
        if (path.startsWith("/api/uploads")) {
            return new LimitRule("uploads", 15);
        }
        if (HttpMethod.POST.matches(method)
                && (path.equals("/api/products") || path.equals("/api/seller/products"))) {
            return new LimitRule("listings", 15);
        }
        if (HttpMethod.POST.matches(method) && path.startsWith("/api/reports")) {
            return new LimitRule("reports", 10);
        }
        if (path.startsWith("/api/chat") || path.startsWith("/api/offers")) {
            return new LimitRule("messaging", 60);
        }
        return null;
    }

    private boolean allow(String key, int maxPerMinute) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(60);
        if (buckets.size() >= MAX_BUCKETS && !buckets.containsKey(key)) {
            pruneExpiredBuckets(cutoff);
        }
        Deque<Instant> deque = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                deque.pollFirst();
            }
            if (deque.size() >= maxPerMinute) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }

    private void pruneExpiredBuckets(Instant cutoff) {
        buckets.entrySet().removeIf(entry -> {
            Deque<Instant> deque = entry.getValue();
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst().isBefore(cutoff)) {
                    deque.pollFirst();
                }
                return deque.isEmpty();
            }
        });
        if (buckets.size() >= MAX_BUCKETS) {
            buckets.clear();
        }
    }

    String extractClientIp(HttpServletRequest request) {
        // Priorité aux en-têtes positionnés par le proxy de confiance (Cloudflare / Nginx),
        // afin d'éviter le spoofing trivial via un en-tête X-Forwarded-For forgé par le client.
        String cfIp = sanitizeIp(request.getHeader("CF-Connecting-IP"));
        if (cfIp != null) {
            return cfIp;
        }
        String realIp = sanitizeIp(request.getHeader("X-Real-IP"));
        if (realIp != null) {
            return realIp;
        }
        String remoteAddr = sanitizeIp(request.getRemoteAddr());
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private String sanitizeIp(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || !VALID_IP_PATTERN.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }

    private record LimitRule(String bucketName, int maxPerMinute) {}
}
