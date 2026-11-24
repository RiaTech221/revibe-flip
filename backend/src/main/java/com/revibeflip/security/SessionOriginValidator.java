package com.revibeflip.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validateur d'origine pour le rafraîchissement de session (SEC-14).
 * Protège l'endpoint /api/auth/refresh contre les attaques CSRF cross-origin et les abus de session.
 */
@Slf4j
@Component
public class SessionOriginValidator {

    private final Set<String> allowedOrigins;

    public SessionOriginValidator(
            @Value("${revibeflip.auth.allowed-origins:${revibeflip.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}}")
            String allowedOriginsConfig
    ) {
        this.allowedOrigins = Arrays.stream(allowedOriginsConfig.split(","))
                .map(this::normalizeOrigin)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Valide l'origine de la requête pour le rafraîchissement de session.
     * Si une origine ou un referer non autorisé est détecté, lève AccessDeniedException (HTTP 403).
     *
     * @param request Requête HTTP entrante
     * @throws AccessDeniedException si l'origine ou le referer n'est pas autorisé
     */
    public void validateOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");

        // 1. Contrôle strict de l'en-tête Origin (prioritaire)
        if (origin != null && !origin.isBlank()) {
            String normalizedOrigin = normalizeOrigin(origin);
            if ("null".equals(normalizedOrigin) || !isAllowed(normalizedOrigin)) {
                log.warn("Tentative de rafraîchissement avec en-tête Origin non autorisé : '{}' [URI: {}]", origin, request.getRequestURI());
                throw new AccessDeniedException("Origine non autorisée pour le rafraîchissement de session : " + origin);
            }
            return;
        }

        // 2. Si Origin est absent, contrôle de l'en-tête Referer (si fourni)
        if (referer != null && !referer.isBlank()) {
            String extractedOrigin = extractOriginFromReferer(referer);
            if (extractedOrigin == null || !isAllowed(extractedOrigin)) {
                log.warn("Tentative de rafraîchissement avec Referer non autorisé : '{}' [URI: {}]", referer, request.getRequestURI());
                throw new AccessDeniedException("Referer non autorisé pour le rafraîchissement de session : " + referer);
            }
        }
    }

    /**
     * Vérifie si une origine normalisée appartient à la liste blanche.
     */
    public boolean isAllowed(String normalizedOrigin) {
        if (normalizedOrigin == null || normalizedOrigin.isBlank() || "null".equals(normalizedOrigin)) {
            return false;
        }
        return allowedOrigins.contains(normalizedOrigin.toLowerCase(Locale.ROOT));
    }

    /**
     * Normalise une origine (suppression des espaces, du slash final et passage en minuscules).
     */
    public String normalizeOrigin(String origin) {
        if (origin == null) {
            return "";
        }
        String trimmed = origin.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.toLowerCase(Locale.ROOT);
    }

    /**
     * Extrait l'origine (scheme://host:port) depuis une URL de Referer.
     */
    public String extractOriginFromReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(referer.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();
            int port = uri.getPort();
            if (scheme == null || host == null) {
                return null;
            }
            if (port == -1 || (("http".equalsIgnoreCase(scheme) && port == 80) || ("https".equalsIgnoreCase(scheme) && port == 443))) {
                return (scheme + "://" + host).toLowerCase(Locale.ROOT);
            }
            return (scheme + "://" + host + ":" + port).toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            log.debug("Erreur lors de l'extraction de l'origine depuis le Referer '{}' : {}", referer, e.getMessage());
            return null;
        }
    }

    public Set<String> getAllowedOrigins() {
        return allowedOrigins;
    }
}
