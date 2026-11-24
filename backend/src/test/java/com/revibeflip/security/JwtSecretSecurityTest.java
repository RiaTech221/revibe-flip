package com.revibeflip.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests de sécurité pour la carte SEC-05 :
 * Gestion et validation des secrets de signature des jetons JWT.
 */
class JwtSecretSecurityTest {

    private static final String KNOWN_DEV_SECRET = "9a3f2c5d8e1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d";
    private static final String STRONG_PROD_SECRET = "4e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2f5a8b1c4d7e0a3b6c";
    private static final String ROTATED_PROD_SECRET = "8f1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d2a5f8e1b";

    private final UserDetails testUser = new User("+221770001122", "Pass123!", Collections.emptyList());

    @Test
    @DisplayName("1. Production : refus de démarrage si REVIBE_JWT_SECRET est absent ou vide")
    void testProductionRejectsMissingSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtUtil jwtUtil = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtil, "secret", "");

        assertThatThrownBy(jwtUtil::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("REVIBE_JWT_SECRET est obligatoire");
    }

    @Test
    @DisplayName("2. Production : refus de démarrage si REVIBE_JWT_SECRET fait moins de 32 octets (256 bits)")
    void testProductionRejectsShortSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtUtil jwtUtil = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtil, "secret", "cle_trop_courte_16o");

        assertThatThrownBy(jwtUtil::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("au moins 32 octets");
    }

    @Test
    @DisplayName("3. Production : refus de démarrage si le secret est la clé de développement connue dans Git")
    void testProductionRejectsKnownDevSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtUtil jwtUtil = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtil, "secret", KNOWN_DEV_SECRET);

        assertThatThrownBy(jwtUtil::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("clé de développement connue");
    }

    @Test
    @DisplayName("4. Production : démarrage réussi avec un secret fort distinct du développement")
    void testProductionAcceptsStrongUniqueSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtUtil jwtUtil = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtil, "secret", STRONG_PROD_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 900000L);

        jwtUtil.validateSecret();

        String token = jwtUtil.generateToken(testUser, 101L, "ROLE_USER", "Awa Diop");
        assertThat(token).isNotBlank();
        assertThat(jwtUtil.validateToken(token, testUser)).isTrue();
    }

    @Test
    @DisplayName("5. Développement : génération automatique d'une clé éphémère si aucun secret n'est fourni")
    void testDevGeneratesEphemeralSecretWhenMissing() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtUtil jwtUtil = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtil, "secret", "");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 900000L);

        jwtUtil.validateSecret();

        String generatedSecret = (String) ReflectionTestUtils.getField(jwtUtil, "secret");
        assertThat(generatedSecret).isNotBlank();
        assertThat(generatedSecret.length()).isGreaterThanOrEqualTo(64); // 32 bytes hex = 64 chars

        // La signature et la vérification fonctionnent parfaitement
        String token = jwtUtil.generateToken(testUser, 102L, "ROLE_USER", "Modou Fall");
        assertThat(jwtUtil.validateToken(token, testUser)).isTrue();
    }

    @Test
    @DisplayName("6. Rotation : un jeton signé avec l'ancien secret est immédiatement rejeté après rotation")
    void testTokenInvalidatedAfterSecretRotation() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        // Service avec la clé A
        JwtUtil jwtUtilKeyA = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtilKeyA, "secret", STRONG_PROD_SECRET);
        ReflectionTestUtils.setField(jwtUtilKeyA, "jwtExpirationMs", 900000L);
        jwtUtilKeyA.validateSecret();

        String tokenSignedWithKeyA = jwtUtilKeyA.generateToken(testUser, 103L, "ROLE_USER", "Fatou Ndiaye");
        assertThat(jwtUtilKeyA.validateToken(tokenSignedWithKeyA, testUser)).isTrue();

        // Rotation vers la clé B
        JwtUtil jwtUtilKeyB = new JwtUtil(env);
        ReflectionTestUtils.setField(jwtUtilKeyB, "secret", ROTATED_PROD_SECRET);
        ReflectionTestUtils.setField(jwtUtilKeyB, "jwtExpirationMs", 900000L);
        jwtUtilKeyB.validateSecret();

        // Le jeton généré avec la clé A doit être rejeté par le service ayant la clé B
        assertThatThrownBy(() -> jwtUtilKeyB.validateToken(tokenSignedWithKeyA, testUser))
                .isInstanceOf(JwtException.class);
    }
}
