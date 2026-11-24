package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-14 : Tests de sécurité sur la vérification de l'origine lors du rafraîchissement de session.
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Vérifier l’en-tête d’origine sur l’endpoint de rafraîchissement (/api/auth/refresh).</li>
 *   <li>Définir la liste blanche des origines autorisées (ex: localhost:5173, localhost:3000).</li>
 *   <li>Contrôler les attributs du cookie (HttpOnly, SameSite=Strict, Secure, Path=/api/auth).</li>
 *   <li>Tester et rejeter toute demande depuis une origine ou un referer non autorisé (HTTP 403 Forbidden).</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SessionRefreshOriginSecurityTest {

    private static final String REFRESH_COOKIE_NAME = "revibeflip_refresh_token";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SessionOriginValidator sessionOriginValidator;

    private User testUser;
    private String rawRefreshToken;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);
        testUser = userRepository.save(User.builder()
                .phone("+22177" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("Origin" + salt)
                .lastName("Tester")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .isSuspended(false)
                .build());

        rawRefreshToken = refreshTokenService.createRefreshToken(testUser);
    }

    // =========================================================================
    // 1. TESTS UNITAIRES SUR SessionOriginValidator
    // =========================================================================
    @Nested
    @DisplayName("1. Tests unitaires de SessionOriginValidator")
    class ValidatorUnitTests {

        @Test
        @DisplayName("Origine autorisée dans la liste blanche est acceptée")
        void allowedOriginAccepted() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("Origin", "http://localhost:5173");

            sessionOriginValidator.validateOrigin(request);
            assertThat(sessionOriginValidator.isAllowed("http://localhost:5173")).isTrue();
        }

        @Test
        @DisplayName("Origine avec slash final est normalisée et acceptée")
        void originWithTrailingSlashNormalized() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("Origin", "http://localhost:5173/");

            sessionOriginValidator.validateOrigin(request);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "https://evil.com",
                "http://attacker.org:8080",
                "https://revibeflip.phishing.site",
                "null"
        })
        @DisplayName("Origine non autorisée lève une AccessDeniedException")
        void forbiddenOriginThrowsException(String forbiddenOrigin) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("Origin", forbiddenOrigin);

            assertThatThrownBy(() -> sessionOriginValidator.validateOrigin(request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Origine non autorisée");
        }

        @Test
        @DisplayName("Referer autorisé est extrait et accepté lorsque Origin est absent")
        void allowedRefererAccepted() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("Referer", "http://localhost:5173/auth/refresh?source=app");

            sessionOriginValidator.validateOrigin(request);
        }

        @Test
        @DisplayName("Referer non autorisé lève une AccessDeniedException")
        void forbiddenRefererThrowsException() {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("Referer", "https://malicious-site.com/fake-login");

            assertThatThrownBy(() -> sessionOriginValidator.validateOrigin(request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Referer non autorisé");
        }
    }

    // =========================================================================
    // 2. TESTS HTTP DE SÉCURITÉ SUR /api/auth/refresh
    // =========================================================================
    @Nested
    @DisplayName("2. Sécurité d'origine sur /api/auth/refresh")
    class RefreshOriginHttpTests {

        @Test
        @DisplayName("Requête avec Origin non autorisé (https://evil.com) retourne HTTP 403 Forbidden")
        void unauthorizedOriginReturnsForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .header("Origin", "https://evil.com")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Requête avec Origin=null (iframe sandboxée) retourne HTTP 403 Forbidden")
        void nullOriginReturnsForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .header("Origin", "null")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Requête avec Referer non autorisé retourne HTTP 403 Forbidden")
        void unauthorizedRefererReturnsForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .header("Referer", "https://phishing-revibe.com/attack")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Referer non autorisé")));
        }

        @Test
        @DisplayName("Requête avec Origin autorisé (http://localhost:5173) retourne HTTP 200 OK")
        void authorizedOriginReturnsOk() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .header("Origin", "http://localhost:5173")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.token").isNotEmpty());
        }

        @Test
        @DisplayName("Requête avec Referer autorisé retourne HTTP 200 OK")
        void authorizedRefererReturnsOk() throws Exception {
            mockMvc.perform(post("/api/auth/refresh")
                            .header("Referer", "http://localhost:5173/dashboard")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.token").isNotEmpty());
        }
    }

    // =========================================================================
    // 3. CONTRÔLE DES ATTRIBUTS DU COOKIE DE RAFRAÎCHISSEMENT
    // =========================================================================
    @Nested
    @DisplayName("3. Attributs de sécurité du cookie (HttpOnly, SameSite, Secure, Path)")
    class CookieAttributesSecurityTests {

        @Test
        @DisplayName("Le cookie retourné contient HttpOnly, SameSite=Strict et Path=/api/auth")
        void refreshCookieHasStrictSecurityAttributes() throws Exception {
            MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                            .header("Origin", "http://localhost:5173")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                    .andReturn();

            String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
            assertThat(setCookie).isNotNull();
            assertThat(setCookie).contains(REFRESH_COOKIE_NAME + "=");
            assertThat(setCookie).containsIgnoringCase("HttpOnly");
            assertThat(setCookie).containsIgnoringCase("SameSite=Strict");
            assertThat(setCookie).containsIgnoringCase("Path=/api/auth");
        }

        @Test
        @DisplayName("Le cookie en HTTPS ou derrière reverse proxy contient l'attribut Secure")
        void refreshCookieHasSecureAttributeUnderHttps() throws Exception {
            MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                            .header("Origin", "http://localhost:5173")
                            .header("X-Forwarded-Proto", "https")
                            .cookie(new Cookie(REFRESH_COOKIE_NAME, rawRefreshToken))
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                    .andReturn();

            String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
            assertThat(setCookie).isNotNull();
            assertThat(setCookie).containsIgnoringCase("Secure");
            assertThat(setCookie).containsIgnoringCase("HttpOnly");
            assertThat(setCookie).containsIgnoringCase("SameSite=Strict");
        }
    }
}
