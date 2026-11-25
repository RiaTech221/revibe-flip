package com.revibeflip.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Résolveur centralisé de l'adresse IP réelle du client derrière un proxy de confiance (Render / Cloudflare).
 * <p>
 * Priorise les en-têtes positionnés par le proxy de confiance configuré et s'appuie sur
 * {@code request.getRemoteAddr()} (résolu par {@code server.forward-headers-strategy=framework} en prod),
 * afin d'empêcher le spoofing trivial via un en-tête {@code X-Forwarded-For} forgé par le client.
 * </p>
 */
@Component
public class ClientIpResolver {

    private static final Pattern VALID_IP_PATTERN = Pattern.compile("^[0-9a-fA-F:.]{3,45}$");

    private final List<String> trustedHeaders;

    public ClientIpResolver() {
        this.trustedHeaders = List.of("CF-Connecting-IP", "True-Client-IP", "X-Real-IP");
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ClientIpResolver(
            @Value("${revibeflip.security.trusted-proxy-headers:CF-Connecting-IP,True-Client-IP,X-Real-IP}") String headersConfig) {
        if (headersConfig == null || headersConfig.isBlank()) {
            this.trustedHeaders = List.of();
        } else {
            this.trustedHeaders = Arrays.stream(headersConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        for (String header : trustedHeaders) {
            String candidate = sanitizeIp(request.getHeader(header));
            if (candidate != null) {
                return candidate;
            }
        }
        String remoteAddr = sanitizeIp(request.getRemoteAddr());
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private String sanitizeIp(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || !VALID_IP_PATTERN.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }
}
