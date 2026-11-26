package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.LoginRequest;
import com.revibeflip.dto.SetPasswordRequest;
import com.revibeflip.entity.RefreshToken;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.RefreshTokenRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-16 : Tests de sécurité sur la fiabilisation de la révocation des sessions.
 *
 * Vérifie :
 * - Persistance de la révocation complète lors de la réutilisation d'un refresh token déjà tourné (pas de rollback)
 * - Persistance de la révocation pour jeton expiré et compte suspendu
 * - Révocation de toutes les sessions existantes lors d'un changement de mot de passe (/api/auth/set-password)
 * - Vérification de l'origine (Origin / Referer) sur /api/auth/logout et révocation effective
 * - Non-exposition du refreshToken dans le corps JSON pour le web (uniquement cookie HttpOnly),
 *   et maintien pour le client mobile explicite (X-Client-Type: mobile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SessionRevocationSecurityTest {

    private static final String REFRESH_COOKIE_NAME = "revibeflip_refresh_token";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private User testUser;
    private String accessToken;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);
        String phone = "+22177" + (1000000 + (int) (Math.random() * 8999999));
        testUser = userRepository.save(User.builder()
                .phone(phone)
                .email("sec16-" + salt + "@revibeflip.sn")
                .firstName("Session")
                .lastName("Tester")
                .password(passwordEncoder.encode("InitialPass123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .mustChangePassword(false)
                .build());

        accessToken = jwtUtil.generateToken(testUser, testUser.getId(), testUser.getRole().name(), testUser.getFullName());
    }

    // =========================================================================
    // 1. RÉUTILISATION D'UN REFRESH TOKEN : RÉVOCATION PERSISTÉE (PAS DE ROLLBACK)
    // =========================================================================

    @Test
    @DisplayName("1.1 Réutilisation d'un refresh token déjà tourné révoque définitivement toute la famille utilisateur")
    void reuseOfRotatedRefreshToken_persistsFamilyRevocation() throws Exception {
        // 1. Crée T1 et effectue une rotation légitime -> obtient T2 (T1 devient révoqué)
        String tokenT1 = refreshTokenService.createRefreshToken(testUser);
        RefreshTokenService.RotationResult rotated = refreshTokenService.rotateRefreshToken(tokenT1);
        String tokenT2 = rotated.rawRefreshToken();

        // Crée également une autre session parallèle T3 sur un autre appareil
        String tokenT3 = refreshTokenService.createRefreshToken(testUser);

        // 2. Rejeu suspect de T1 via HTTP /api/auth/refresh -> doit être refusé (400)
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, tokenT1)))
                .andExpect(status().isBadRequest());

        // 3. Vérifie en base que T2 et T3 ont bien été révoqués (aucun rollback Spring !)
        RefreshToken entityT2 = refreshTokenRepository.findByTokenHash(sha256(tokenT2)).orElseThrow();
        RefreshToken entityT3 = refreshTokenRepository.findByTokenHash(sha256(tokenT3)).orElseThrow();
        assertThat(entityT2.getRevoked()).isTrue();
        assertThat(entityT3.getRevoked()).isTrue();

        // 4. T2 n'est plus utilisable pour rafraîchir la session
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, tokenT2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("1.2 Tentative de rafraîchissement d'un jeton expiré persiste revoked=true en base")
    void expiredRefreshToken_persistsRevokedFlag() throws Exception {
        String rawExpired = "expired-token-" + UUID.randomUUID();
        String hash = sha256(rawExpired);
        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(hash)
                .user(testUser)
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .revoked(false)
                .build());

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, rawExpired)))
                .andExpect(status().isBadRequest());

        RefreshToken reloaded = refreshTokenRepository.findByTokenHash(hash).orElseThrow();
        assertThat(reloaded.getRevoked()).isTrue();
    }

    @Test
    @DisplayName("1.3 Tentative de rafraîchissement pour un compte suspendu révoque tous ses jetons en base")
    void suspendedUserRefresh_persistsRevocationOfAllTokens() throws Exception {
        String tokenT1 = refreshTokenService.createRefreshToken(testUser);
        String tokenT2 = refreshTokenService.createRefreshToken(testUser);

        testUser.setIsSuspended(true);
        userRepository.save(testUser);

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, tokenT1)))
                .andExpect(status().isConflict());

        assertThat(refreshTokenRepository.findByTokenHash(sha256(tokenT1)).orElseThrow().getRevoked()).isTrue();
        assertThat(refreshTokenRepository.findByTokenHash(sha256(tokenT2)).orElseThrow().getRevoked()).isTrue();
    }

    // =========================================================================
    // 2. CHANGEMENT DE MOT DE PASSE : RÉVOCATION DES SESSIONS EXISTANTES
    // =========================================================================

    @Test
    @DisplayName("2.1 POST /api/auth/set-password révoque toutes les sessions existantes et efface le cookie refresh")
    void setPassword_revokesAllExistingSessionsAndClearsCookie() throws Exception {
        String session1 = refreshTokenService.createRefreshToken(testUser);
        String session2 = refreshTokenService.createRefreshToken(testUser);

        SetPasswordRequest req = new SetPasswordRequest();
        req.setCurrentPassword("InitialPass123!");
        req.setPassword("NewStrongPass456!");

        mockMvc.perform(post("/api/auth/set-password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString(REFRESH_COOKIE_NAME + "=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        // Les deux anciens refresh tokens sont révoqués en base
        assertThat(refreshTokenRepository.findByTokenHash(sha256(session1)).orElseThrow().getRevoked()).isTrue();
        assertThat(refreshTokenRepository.findByTokenHash(sha256(session2)).orElseThrow().getRevoked()).isTrue();

        // Impossible de rafraîchir avec une ancienne session
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, session1)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 3. DÉCONNEXION : RÉVOCATION + CONTRÔLE D'ORIGINE
    // =========================================================================

    @Test
    @DisplayName("3.1 POST /api/auth/logout refuse une origine non autorisée (403) sans révoquer les sessions")
    void logout_forbiddenOrigin_returns403AndPreservesSession() throws Exception {
        String sessionToken = refreshTokenService.createRefreshToken(testUser);

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .header("Origin", "https://evil.example.com")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, sessionToken)))
                .andExpect(status().isForbidden());

        // La session n'a pas été révoquée par la requête CSRF rejetée
        assertThat(refreshTokenRepository.findByTokenHash(sha256(sessionToken)).orElseThrow().getRevoked()).isFalse();
    }

    @Test
    @DisplayName("3.2 POST /api/auth/logout avec origine autorisée révoque toutes les sessions et efface le cookie")
    void logout_allowedOrigin_revokesAllSessionsAndClearsCookie() throws Exception {
        String session1 = refreshTokenService.createRefreshToken(testUser);
        String session2 = refreshTokenService.createRefreshToken(testUser);

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, session1)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        assertThat(refreshTokenRepository.findByTokenHash(sha256(session1)).orElseThrow().getRevoked()).isTrue();
        assertThat(refreshTokenRepository.findByTokenHash(sha256(session2)).orElseThrow().getRevoked()).isTrue();

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, session2)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 4. NON-EXPOSITION DU REFRESH TOKEN DANS LE JSON POUR LE WEB
    // =========================================================================

    @Test
    @DisplayName("4.1 Login et Refresh Web n'exposent pas refreshToken dans le corps JSON (cookie HttpOnly uniquement)")
    void webLoginAndRefresh_doNotExposeRefreshTokenInJsonBody() throws Exception {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier(testUser.getPhone());
        loginReq.setPassword("InitialPass123!");

        MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString(REFRESH_COOKIE_NAME + "=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andReturn();

        String rawCookieToken = extractCookieValue(loginRes.getResponse().getHeaders(HttpHeaders.SET_COOKIE));
        assertThat(rawCookieToken).isNotBlank();

        // Le refresh web ne renvoie pas non plus refreshToken dans le JSON
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Origin", "http://localhost:5173")
                        .cookie(new Cookie(REFRESH_COOKIE_NAME, rawCookieToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString(REFRESH_COOKIE_NAME + "=")));
    }

    @Test
    @DisplayName("4.2 Login Mobile (X-Client-Type: mobile) reçoit toujours refreshToken dans le JSON")
    void mobileLogin_receivesRefreshTokenInJsonBody() throws Exception {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setIdentifier(testUser.getPhone());
        loginReq.setPassword("InitialPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Client-Type", "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
    }

    private String extractCookieValue(List<String> setCookieHeaders) {
        for (String header : setCookieHeaders) {
            if (header.startsWith(REFRESH_COOKIE_NAME + "=")) {
                String valuePart = header.substring((REFRESH_COOKIE_NAME + "=").length());
                int semicolon = valuePart.indexOf(';');
                return semicolon >= 0 ? valuePart.substring(0, semicolon) : valuePart;
            }
        }
        return null;
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
