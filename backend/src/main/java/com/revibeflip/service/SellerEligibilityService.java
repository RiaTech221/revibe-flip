package com.revibeflip.service;

import com.revibeflip.dto.SellerEligibilityDto;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.exception.SellerEligibilityException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Service de vérification des informations complètes et valides d'un utilisateur
 * pour l'autoriser à devenir vendeur sur la plateforme.
 */
@Service
public class SellerEligibilityService {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}][\\p{L}\\s'\\-]{1,59}$");
    private static final Pattern E164_PHONE_PATTERN = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final Pattern SENEGAL_PHONE_PATTERN = Pattern.compile("^\\+2217[05678]\\d{7}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    public SellerEligibilityDto checkEligibility(User user) {
        List<String> missingFields = new ArrayList<>();
        Map<String, String> invalidFields = new LinkedHashMap<>();

        if (user == null) {
            missingFields.add("utilisateur");
            return SellerEligibilityDto.builder()
                    .eligible(false)
                    .missingFields(missingFields)
                    .invalidFields(invalidFields)
                    .message("Utilisateur non authentifié.")
                    .build();
        }

        // 1. Cohérence du statut de compte
        if (Boolean.TRUE.equals(user.getIsSuspended()) || user.getStatus() == AccountStatus.SUSPENDED) {
            invalidFields.put("account", "Votre compte est actuellement suspendu.");
        } else if (!Boolean.TRUE.equals(user.getIsVerified()) || user.getStatus() == AccountStatus.PENDING_OTP) {
            invalidFields.put("verification", "Votre numéro de téléphone doit être vérifié par code OTP avant de vendre.");
        }

        // 2. Champs obligatoires & validation de format
        validateNameField("firstName", "prénom", user.getFirstName(), missingFields, invalidFields);
        validateNameField("lastName", "nom", user.getLastName(), missingFields, invalidFields);
        validatePhone(user.getPhone(), missingFields, invalidFields);
        validateOptionalEmail(user.getEmail(), invalidFields);
        validateMinLength("city", "ville", user.getCity(), 2, missingFields, invalidFields);
        validateMinLength("address", "adresse", user.getAddress(), 5, missingFields, invalidFields);

        boolean eligible = missingFields.isEmpty() && invalidFields.isEmpty();
        String message = buildMessage(eligible, missingFields, invalidFields);

        return SellerEligibilityDto.builder()
                .eligible(eligible)
                .missingFields(missingFields)
                .invalidFields(invalidFields)
                .message(message)
                .build();
    }

    public void assertEligibleToSell(User user) {
        SellerEligibilityDto result = checkEligibility(user);
        if (!result.isEligible()) {
            throw new SellerEligibilityException(result);
        }
    }

    private void validateNameField(
            String key,
            String label,
            String value,
            List<String> missingFields,
            Map<String, String> invalidFields
    ) {
        if (value == null || value.isBlank()) {
            missingFields.add(label);
            return;
        }
        String trimmed = value.trim();
        if (!NAME_PATTERN.matcher(trimmed).matches()) {
            invalidFields.put(key, "Le " + label + " doit contenir entre 2 et 60 lettres valides.");
        }
    }

    private void validatePhone(
            String phone,
            List<String> missingFields,
            Map<String, String> invalidFields
    ) {
        if (phone == null || phone.isBlank()) {
            missingFields.add("téléphone");
            return;
        }
        String trimmed = phone.trim();
        if (!E164_PHONE_PATTERN.matcher(trimmed).matches()) {
            invalidFields.put("phone", "Le numéro de téléphone doit être au format international (+221XXXXXXXXX).");
            return;
        }
        if (trimmed.startsWith("+221") && !SENEGAL_PHONE_PATTERN.matcher(trimmed).matches()) {
            invalidFields.put("phone", "Le numéro sénégalais doit être au format +221 7X XXX XX XX.");
        }
    }

    private void validateOptionalEmail(String email, Map<String, String> invalidFields) {
        if (email != null && !email.isBlank() && !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            invalidFields.put("email", "Le format de l'adresse e-mail est invalide.");
        }
    }

    private void validateMinLength(
            String key,
            String label,
            String value,
            int minLen,
            List<String> missingFields,
            Map<String, String> invalidFields
    ) {
        if (value == null || value.isBlank()) {
            missingFields.add(label);
            return;
        }
        if (value.trim().length() < minLen) {
            invalidFields.put(key, "Le champ " + label + " doit contenir au moins " + minLen + " caractères.");
        }
    }

    private String buildMessage(boolean eligible, List<String> missingFields, Map<String, String> invalidFields) {
        if (eligible) {
            return "Profil complet et valide : vous êtes autorisé(e) à vendre sur ReVibe FliP.";
        }
        List<String> parts = new ArrayList<>();
        if (!missingFields.isEmpty()) {
            parts.add("Champs manquants : " + String.join(", ", missingFields));
        }
        if (!invalidFields.isEmpty()) {
            parts.add("Informations invalides : " + String.join(" ", invalidFields.values()));
        }
        return "Pour devenir vendeur, veuillez compléter et corriger votre profil. " + String.join(" | ", parts);
    }
}
