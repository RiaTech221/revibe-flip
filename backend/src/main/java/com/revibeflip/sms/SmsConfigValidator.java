package com.revibeflip.sms;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Empêche le démarrage en production si le fournisseur SMS réel n'est pas configuré.
 */
@Component
@Profile("prod")
@RequiredArgsConstructor
public class SmsConfigValidator implements ApplicationRunner {

    private final SmsProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isConfigured()) {
            throw new IllegalStateException(
                    "Configuration SMS manquante en production : SMS_API_URL et SMS_API_KEY sont obligatoires."
            );
        }
    }
}
