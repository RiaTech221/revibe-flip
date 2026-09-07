package com.revibeflip.service.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Implémentation réelle du service SMS supportant Twilio avec bascule automatique
 * en mode simulation console si aucune clé API n'est configurée.
 */
@Service
@Slf4j
public class TwilioSmsServiceImpl implements SmsService {

    @Value("${revibeflip.sms.provider:mock}")
    private String provider;

    @Value("${revibeflip.sms.twilio.account-sid:}")
    private String accountSid;

    @Value("${revibeflip.sms.twilio.auth-token:}")
    private String authToken;

    @Value("${revibeflip.sms.twilio.from-number:}")
    private String fromNumber;

    private final RestClient restClient;

    public TwilioSmsServiceImpl() {
        this.restClient = RestClient.builder().build();
    }

    @Override
    public boolean sendOtp(String phoneNumber, String otpCode) {
        String formattedPhone = formatInternationalPhone(phoneNumber);
        String message = "Votre code de confirmation ReVibe FliP est : " + otpCode + ". Ne le partagez avec personne. Valable 15 minutes.";
        return sendSms(formattedPhone, message);
    }

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        String recipient = formatInternationalPhone(phoneNumber);

        // Si Twilio est configuré avec des clés non vides
        if ("twilio".equalsIgnoreCase(provider) && isTwilioConfigured()) {
            return sendViaTwilio(recipient, message);
        }

        // Mode Dev / Sandbox (Secours en attendant les clés API réelles)
        log.info("=================================================================");
        log.info("[SMS SIMULATION] Vers : {}", recipient);
        log.info("[SMS SIMULATION] Message : {}", message);
        log.info("[SMS SIMULATION] Fournisseur configuré: '{}'. (Pour envoyer de vrais SMS, définissez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et revibeflip.sms.provider=twilio)", provider);
        log.info("=================================================================");
        return true;
    }

    private boolean sendViaTwilio(String recipient, String message) {
        try {
            log.info("Envoi d'un véritable SMS Twilio vers {}...", recipient);

            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            String credentials = accountSid + ":" + authToken;
            String basicAuth = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("To", recipient);
            formData.add("From", fromNumber);
            formData.add("Body", message);

            String response = restClient.post()
                    .uri(url)
                    .header("Authorization", basicAuth)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            log.info("SMS Twilio envoyé avec succès à {}. Réponse: {}", recipient, response);
            return true;
        } catch (Exception e) {
            log.error("Échec lors de l'envoi du SMS Twilio à {}: {}", recipient, e.getMessage(), e);
            return false;
        }
    }

    private boolean isTwilioConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && fromNumber != null && !fromNumber.isBlank();
    }

    /**
     * S'assure que le numéro comporte l'indicatif international requis par les opérateurs (+221 pour Sénégal par défaut).
     */
    private String formatInternationalPhone(String phone) {
        if (phone == null) return "";
        String cleaned = phone.replaceAll("[\\s\\-\\(\\)]", "");
        if (cleaned.startsWith("+")) {
            return cleaned;
        }
        if (cleaned.startsWith("00")) {
            return "+" + cleaned.substring(2);
        }
        // Numéro local sénégalais typique (ex: 771234567, 78..., 70..., 76...)
        if (cleaned.length() == 9 && (cleaned.startsWith("7") || cleaned.startsWith("3"))) {
            return "+221" + cleaned;
        }
        return "+" + cleaned;
    }
}
