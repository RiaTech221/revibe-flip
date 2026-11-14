package com.revibeflip.sms;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration du fournisseur SMS (injectée via variables d'environnement).
 */
@Component
@ConfigurationProperties(prefix = "revibeflip.sms")
@Getter
@Setter
public class SmsProperties {

    private String provider = "";
    private String apiUrl = "";
    private String apiKey = "";
    private String senderId = "ReVibeFliP";

    public boolean isConfigured() {
        return apiUrl != null && !apiUrl.isBlank()
                && apiKey != null && !apiKey.isBlank();
    }
}
