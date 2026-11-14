package com.revibeflip.payment;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Validateur de configuration PayTech au démarrage en production.
 * Refuse de démarrer l'application si une variable PayTech obligatoire est absente.
 */
@Component
@Profile("prod")
@RequiredArgsConstructor
@Slf4j
public class PayTechConfigValidator {

    private final PayTechProperties properties;

    @PostConstruct
    public void validate() {
        if (!properties.isConfigured()) {
            throw new IllegalStateException(
                    "Configuration PayTech incomplète en production. " +
                    "Vérifiez PAYTECH_API_KEY, PAYTECH_API_SECRET, PAYTECH_ENV, PAYTECH_IPN_URL, PAYTECH_SUCCESS_URL et PAYTECH_CANCEL_URL."
            );
        }
        if (!"test".equalsIgnoreCase(properties.getEnv()) && !"prod".equalsIgnoreCase(properties.getEnv())) {
            throw new IllegalStateException("PAYTECH_ENV doit valoir 'test' ou 'prod'.");
        }
        log.info("Configuration PayTech validée (environnement: {}).", properties.getEnv());
    }
}
