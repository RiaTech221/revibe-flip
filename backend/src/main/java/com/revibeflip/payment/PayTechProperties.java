package com.revibeflip.payment;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Propriétés de configuration officielles de l'agrégateur PayTech (injectées par variables d'environnement).
 */
@Component
@ConfigurationProperties(prefix = "revibeflip.paytech")
@Getter
@Setter
public class PayTechProperties {

    private String apiKey = "";
    private String apiSecret = "";
    private String env = "test";
    private String baseUrl = "https://paytech.sn/api";
    private String ipnUrl = "";
    private String successUrl = "";
    private String cancelUrl = "";
    private String transferCallbackUrl = "";
    private String allowedIps = "";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank()
                && env != null && !env.isBlank()
                && ipnUrl != null && !ipnUrl.isBlank()
                && successUrl != null && !successUrl.isBlank()
                && cancelUrl != null && !cancelUrl.isBlank();
    }

    public List<String> getAllowedIpList() {
        if (allowedIps == null || allowedIps.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(allowedIps.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
