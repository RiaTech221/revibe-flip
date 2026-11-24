package com.revibeflip.payment;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Validateur de configuration PayTech au démarrage en production.
 *
 * <p>Règle : Refuse de démarrer l'application si une variable PayTech obligatoire est absente,
 * notamment la liste blanche d'IP autorisées (PAYTECH_ALLOWED_IPS).
 * <p>Pourquoi : Les webhooks IPN de paiement et de virement doivent impérativement être restreints
 * aux serveurs légitimes de l'agrégateur en production pour empêcher l'injection de fausses notifications.
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
        // SEC-02 : En production, restreindre les IP émettrices des webhooks est obligatoire pour éviter le contournement silencieux
        if (properties.getAllowedIpList().isEmpty()) {
            throw new IllegalStateException("PAYTECH_ALLOWED_IPS doit être configuré en production pour restreindre les webhooks IPN PayTech.");
        }
        log.info("Configuration PayTech validée (environnement: {}).", properties.getEnv());
    }
}
