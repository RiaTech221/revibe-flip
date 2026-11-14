package com.revibeflip.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service de vérification anti-bot Cloudflare Turnstile côté serveur.
 * <p>
 * Actif uniquement lorsque {@code revibeflip.turnstile.enabled=true} et qu'une
 * clé secrète ({@code REVIBE_TURNSTILE_SECRET_KEY}) est configurée.
 * </p>
 */
@Service
public class TurnstileService {

    private static final Logger log = LoggerFactory.getLogger(TurnstileService.class);
    private static final String SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final boolean enabled;
    private final String secretKey;
    private final RestTemplate restTemplate;

    public TurnstileService(
            @Value("${revibeflip.turnstile.enabled:false}") boolean enabled,
            @Value("${revibeflip.turnstile.secret-key:}") String secretKey) {
        this.enabled = enabled;
        this.secretKey = secretKey != null ? secretKey.trim() : "";
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isEnabled() {
        return enabled && !secretKey.isEmpty();
    }

    @SuppressWarnings("unchecked")
    public boolean verifyToken(String token, String remoteIp) {
        if (!isEnabled()) {
            return true;
        }
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token.trim());
            if (remoteIp != null && !remoteIp.isBlank() && !"unknown".equals(remoteIp)) {
                body.add("remoteip", remoteIp);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(SITEVERIFY_URL, request, Map.class);
            Map<String, Object> payload = response.getBody();
            return payload != null && Boolean.TRUE.equals(payload.get("success"));
        } catch (Exception ex) {
            log.warn("Échec de vérification Cloudflare Turnstile : {}", ex.getMessage());
            return false;
        }
    }
}
