package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.LoginRequest;
import com.revibeflip.dto.RegisterRequest;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.entity.User;
import com.revibeflip.repository.RateLimitEntryRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.sms.OtpRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.FilterChain;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@DisplayName("SEC-08 : Tests d'intégration de limitation de débit fiable et persistante")
class Sec08RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RateLimitEntryRepository rateLimitEntryRepository;

    @Autowired
    private PersistentRateLimitService persistentRateLimitService;

    @Autowired
    private ClientIpResolver clientIpResolver;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanBuckets() {
        rateLimitEntryRepository.deleteAll();
    }

    @Test
    @DisplayName("IP réelle derrière proxy de confiance Render (True-Client-IP / CF-Connecting-IP) et anti-spoofing X-Forwarded-For")
    void resolvesTrustedProxyIpAndIgnoresSpoofedXForwardedFor() {
        MockHttpServletRequest renderReq = new MockHttpServletRequest("POST", "/api/auth/login");
        renderReq.setRemoteAddr("10.0.0.5");
        renderReq.addHeader("X-Forwarded-For", "203.0.113.99, 10.0.0.5");
        renderReq.addHeader("True-Client-IP", "198.51.100.77");

        assertEquals("198.51.100.77", clientIpResolver.resolve(renderReq));

        MockHttpServletRequest cfReq = new MockHttpServletRequest("POST", "/api/auth/register");
        cfReq.setRemoteAddr("10.0.0.5");
        cfReq.addHeader("X-Forwarded-For", "203.0.113.11");
        cfReq.addHeader("CF-Connecting-IP", "198.51.100.88");

        assertEquals("198.51.100.88", clientIpResolver.resolve(cfReq));
    }

    @Test
    @DisplayName("OTP : limitation par numéro de téléphone (cooldown 60s -> 429 + Retry-After) même si l'IP change")
    void otpRateLimitedByPhoneAcrossDifferentIpsWithRetryAfter() throws Exception {
        String phone = "+221779010203";
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setFirstName("Test");
        registerReq.setLastName("Sec08");
        registerReq.setPhone(phone);
        registerReq.setPassword("Passer123!");

        // 1er envoi OTP via inscription -> 200 OK
        mockMvc.perform(post("/api/auth/register")
                        .header("CF-Connecting-IP", "198.51.100.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // 2e demande d'OTP immédiate pour le MÊME numéro depuis une IP différente -> 429 + Retry-After
        mockMvc.perform(post("/api/auth/resend-otp")
                        .param("phone", phone)
                        .header("CF-Connecting-IP", "198.51.100.2"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.retryAfterSeconds", greaterThan(0)));
    }

    @Test
    @DisplayName("Connexion (/api/auth/login) : limitation par identifiant/téléphone -> 429 + Retry-After même si l'IP change")
    void loginRateLimitedByPhoneAcrossDifferentIps() throws Exception {
        String phone = "+221779040506";
        if (!userRepository.existsByPhone(phone)) {
            userRepository.save(User.builder()
                    .firstName("Login")
                    .lastName("Limit")
                    .phone(phone)
                    .password(passwordEncoder.encode("Passer123!"))
                    .role(Role.ROLE_USER)
                    .status(AccountStatus.ACTIVE)
                    .isVerified(true)
                    .isSuspended(false)
                    .build());
        }

        LoginRequest badLogin = new LoginRequest();
        badLogin.setIdentifier(phone);
        badLogin.setPassword("WrongPass!");

        // 10 tentatives depuis des IPs différentes -> autorisées par le quota identifiant (401 mauvais mdp)
        // Note: après 5 échecs, le compte est verrouillé 15 min (409/IllegalState) mais le compteur rate limit continue
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("CF-Connecting-IP", "198.51.100." + (10 + i))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badLogin)))
                    .andExpect(result -> assertNotEquals(429, result.getResponse().getStatus()));
        }

        // 11e tentative sur le même téléphone (nouvelle IP) -> bloquée 429 avec Retry-After
        mockMvc.perform(post("/api/auth/login")
                        .header("CF-Connecting-IP", "198.51.100.99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.data.retryAfterSeconds", greaterThan(0)));
    }

    @Test
    @DisplayName("Persistance multi-instances / redémarrage : les compteurs en base survivent à une nouvelle instance de filtre et de limiteur")
    void countersPersistAcrossNewFilterAndLimiterInstances() throws Exception {
        // Instance 1 : consomme les 20 requêtes /api/v1/auth/login autorisées pour l'IP 203.0.113.50
        RateLimitFilter instance1 = new RateLimitFilter(clientIpResolver, persistentRateLimitService);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.addHeader("True-Client-IP", "203.0.113.50");
            MockHttpServletResponse res = new MockHttpServletResponse();
            instance1.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        // Instance 2 (simule redémarrage ou 2e pod Render) : la 21e requête est immédiatement bloquée 429 + Retry-After
        RateLimitFilter instance2 = new RateLimitFilter(clientIpResolver, persistentRateLimitService);
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.addHeader("True-Client-IP", "203.0.113.50");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        instance2.doFilter(blockedReq, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
        assertNotNull(blockedRes.getHeader("Retry-After"));
        assertTrue(Long.parseLong(blockedRes.getHeader("Retry-After")) > 0);

        // Même vérification pour OtpRateLimiter sur deux instances distinctes
        OtpRateLimiter otpInstance1 = new OtpRateLimiter(persistentRateLimitService);
        OtpRateLimiter otpInstance2 = new OtpRateLimiter(persistentRateLimitService);
        otpInstance1.checkAndRecordSend("+221779991122", "203.0.113.60");
        assertThrows(com.revibeflip.exception.TooManyRequestsException.class,
                () -> otpInstance2.checkAndRecordSend("+221779991122", "203.0.113.61"));
    }
}
