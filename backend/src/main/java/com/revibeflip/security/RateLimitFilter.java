package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtre de limitation de débit (Rate Limiting) par adresse IP et groupe d'endpoints sensibles.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        LimitRule rule = resolveRule(path);

        if (rule != null && !allow(extractClientIp(request) + ":" + rule.bucketName, rule.maxPerMinute)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Trop de requêtes. Veuillez patienter avant de réessayer.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private LimitRule resolveRule(String path) {
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
        if (path.startsWith("/api/chat") || path.startsWith("/api/offers")) {
            return new LimitRule("messaging", 60);
        }
        return null;
    }

    private boolean allow(String key, int maxPerMinute) {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(60);
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

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private record LimitRule(String bucketName, int maxPerMinute) {}
}
