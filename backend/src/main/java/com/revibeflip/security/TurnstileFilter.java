package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Filtre anti-bot vérifiant l'en-tête {@code X-Turnstile-Token} sur les formulaires
 * publics critiques lorsque Cloudflare Turnstile est activé en production.
 */
@Component
@RequiredArgsConstructor
public class TurnstileFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_POST_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/resend-otp",
            "/api/contact"
    );

    private final TurnstileService turnstileService;
    private final RateLimitFilter rateLimitFilter;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (turnstileService.isEnabled()
                && HttpMethod.POST.matches(request.getMethod())
                && PROTECTED_POST_PATHS.contains(request.getRequestURI())) {
            String token = request.getHeader("X-Turnstile-Token");
            String clientIp = rateLimitFilter.extractClientIp(request);
            if (!turnstileService.verifyToken(token, clientIp)) {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\":false,\"message\":\"Vérification anti-bot requise ou invalide.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
