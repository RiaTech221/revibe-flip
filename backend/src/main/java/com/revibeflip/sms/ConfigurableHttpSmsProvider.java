package com.revibeflip.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Implémentation HTTP générique de SmsProvider (compatible Intech SMS / passerelles REST Bearer).
 * Refuse l'envoi en production si la configuration est absente. Ne journalise jamais le contenu du message/OTP.
 */
@Component
@Slf4j
public class ConfigurableHttpSmsProvider implements SmsProvider {

    private final SmsProperties properties;
    private final Environment environment;
    private final RestTemplate restTemplate;

    public ConfigurableHttpSmsProvider(SmsProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        if (!isConfigured()) {
            boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
            if (isProd) {
                throw new IllegalStateException("Le fournisseur SMS n'est pas configuré en production.");
            }
            log.warn("SMS non envoyé (fournisseur SMS non configuré hors production) pour {}", maskPhone(phoneNumber));
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiKey().trim());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("to", phoneNumber);
        body.put("sender", properties.getSenderId());
        body.put("message", message);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    properties.getApiUrl().trim(),
                    new HttpEntity<>(body, headers),
                    String.class
            );
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Échec envoi SMS (HTTP {}) pour {}", response.getStatusCode().value(), maskPhone(phoneNumber));
                throw new IllegalStateException("Impossible d'envoyer le SMS de vérification.");
            }
            log.info("SMS de vérification envoyé à {}", maskPhone(phoneNumber));
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Erreur technique lors de l'envoi SMS à {}: {}", maskPhone(phoneNumber), ex.getMessage());
            throw new IllegalStateException("Service SMS momentanément indisponible.");
        }
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "***";
        }
        return "***" + phone.substring(phone.length() - 4);
    }
}
