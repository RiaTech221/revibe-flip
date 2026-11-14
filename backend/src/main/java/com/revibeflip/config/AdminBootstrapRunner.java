package com.revibeflip.config;

import com.revibeflip.entity.Country;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CountryRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Bootstrap sécurisé du premier compte administrateur via variables d'environnement.
 * <p>
 * Ne s'exécute que si aucun administrateur n'existe en base. Impose un mot de passe fort
 * et marque le compte pour changement de mot de passe obligatoire à la première connexion.
 * </p>
 */
@Component
@Order(5)
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Pattern STRONG_PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{12,}$"
    );

    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${revibeflip.bootstrap.admin.phone:}")
    private String adminPhone;

    @Value("${revibeflip.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${revibeflip.bootstrap.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.countByRole(Role.ROLE_ADMIN) > 0) {
            return;
        }

        if (adminPhone == null || adminPhone.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Aucun administrateur en base. Définissez REVIBE_BOOTSTRAP_ADMIN_PHONE et REVIBE_BOOTSTRAP_ADMIN_PASSWORD pour créer le premier administrateur.");
            return;
        }

        if (!STRONG_PASSWORD_PATTERN.matcher(adminPassword).matches()) {
            throw new IllegalStateException(
                    "REVIBE_BOOTSTRAP_ADMIN_PASSWORD ne respecte pas la politique de sécurité " +
                    "(minimum 12 caractères, majuscule, minuscule, chiffre et caractère spécial)."
            );
        }

        String cleanPhone = adminPhone.replaceAll("[\\s\\-\\(\\)]", "");
        String cleanEmail = (adminEmail != null && !adminEmail.isBlank()) ? adminEmail.trim().toLowerCase() : null;
        Country senegal = countryRepository.findByCode("SN").orElse(null);

        User admin = User.builder()
                .firstName("Administrateur")
                .lastName("Principal")
                .phone(cleanPhone)
                .email(cleanEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ROLE_ADMIN)
                .country(senegal)
                .isVerified(true)
                .isSuspended(false)
                .mustChangePassword(true)
                .city("Dakar")
                .trustScore(100.0)
                .rating(5.0)
                .reviewCount(0)
                .build();

        userRepository.save(admin);
        log.info("Premier compte administrateur créé via bootstrap sécurisé (changement de mot de passe requis à la première connexion).");
    }
}
