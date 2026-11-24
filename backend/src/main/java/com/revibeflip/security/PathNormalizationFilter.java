package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * SEC-13 : Filtre de normalisation des chemins d'URL avant l'application des règles de sécurité.
 *
 * <p>Fonctions clés de sécurité :</p>
 * <ul>
 *   <li>Décodage sécurisé des caractères encodés (%-encoding et multi-encodage).</li>
 *   <li>Détection et rejet des caractères nuls (%00) et des tentatives de traversée interdites.</li>
 *   <li>Suppression des paramètres de matrice (point-virgule).</li>
 *   <li>Réduction des doubles slashes et élimination des trailing slashes superflus.</li>
 *   <li>Canonisation de la casse pour les chemins d'administration protégés (/api/admin/**).</li>
 *   <li>Harmonisation des chemins versionnés (/api/v1/admin/** vers /api/admin/**).</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class PathNormalizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String rawUri = request.getRequestURI();
        if (rawUri == null || rawUri.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Rejet des octets nuls (%00)
        if (rawUri.contains("%00") || rawUri.contains("\0")) {
            log.warn("Tentative d'injection d'octet nul détectée sur l'URI : {}", rawUri);
            rejectRequest(response, "Chemin d'URL invalide.");
            return;
        }

        String normalizedPath;
        try {
            normalizedPath = normalizePath(rawUri);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de décodage ou normalisation sur l'URI '{}' : {}", rawUri, e.getMessage());
            rejectRequest(response, "Format d'URL invalide.");
            return;
        }

        // Vérification de sécurité post-normalisation : tentative d'évasion de la racine
        if (!normalizedPath.startsWith("/")) {
            log.warn("Chemin normalisé illégal (non absolu) : {}", normalizedPath);
            rejectRequest(response, "Chemin d'accès non autorisé.");
            return;
        }

        String contextPath = request.getContextPath() != null ? request.getContextPath() : "";
        String normalizedUri = contextPath.isEmpty() ? normalizedPath : contextPath + normalizedPath;
        String normalizedServletPath = normalizedPath;

        HttpServletRequest wrappedRequest = new NormalizedPathRequestWrapper(request, normalizedUri, normalizedServletPath);
        filterChain.doFilter(wrappedRequest, response);
    }

    /**
     * Canonise le chemin brut d'une requête HTTP.
     */
    public String normalizePath(String rawPath) {
        String path = rawPath.trim();

        // Conversion des backslashes en slashes standards
        path = path.replace('\\', '/');

        // Suppression des paramètres de matrice (;param=valeur)
        path = path.replaceAll(";[^/]*", "");

        // Décodage récursif des séquences %XX (jusqu'à 2 passes pour neutraliser le double encodage)
        for (int i = 0; i < 2 && path.contains("%"); i++) {
            try {
                String decoded = URLDecoder.decode(path, StandardCharsets.UTF_8);
                if (decoded.equals(path)) {
                    break;
                }
                path = decoded;
            } catch (Exception e) {
                throw new IllegalArgumentException("Séquence d'encodage invalide", e);
            }
        }

        // Suppression résiduelle des paramètres de matrice après décodage
        path = path.replaceAll(";[^/]*", "");

        // Réduction des slashes consécutifs (ex: //api///admin -> /api/admin)
        path = path.replaceAll("/{2,}", "/");

        // Normalisation des segments relatifs (. et ..)
        try {
            path = URI.create(path.startsWith("/") ? path : "/" + path).normalize().getPath();
        } catch (Exception e) {
            throw new IllegalArgumentException("Impossible de normaliser les segments d'URI", e);
        }

        // Suppression du trailing slash superflu (ex: /api/admin/users/ -> /api/admin/users)
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }

        // Harmonisation des préfixes d'administration protégés (insensibilité à la casse)
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.startsWith("/api/v1/admin")) {
            // /api/v1/admin/... -> /api/admin/...
            path = "/api/admin" + path.substring("/api/v1/admin".length());
            lower = path.toLowerCase(Locale.ROOT);
        } else if (lower.startsWith("/admin")) {
            // /admin/... -> /api/admin/...
            path = "/api/admin" + path.substring("/admin".length());
            lower = path.toLowerCase(Locale.ROOT);
        }

        if (lower.startsWith("/api/admin")) {
            // Canonisation en minuscules pour tout le segment /api/admin/...
            path = "/api/admin" + path.substring("/api/admin".length()).toLowerCase(Locale.ROOT);
        }

        return path;
    }

    private void rejectRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format("{\"success\":false,\"message\":\"%s\"}", message));
    }
}
