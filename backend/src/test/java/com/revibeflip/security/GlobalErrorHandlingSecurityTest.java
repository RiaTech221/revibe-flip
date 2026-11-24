package com.revibeflip.security;

import com.revibeflip.config.GlobalExceptionHandler;
import com.revibeflip.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-06 : Tests de sécurité sur la gestion des erreurs serveur génériques.
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Erreur 500 : réponse contient un message générique et un trackingId (UUID), sans stacktrace ni SQL ni nom de classe.</li>
 *   <li>Erreurs SQL / DataAccess : masquées avec trackingId et sans fuite de schéma/requête.</li>
 *   <li>Erreurs 403 : message clair sans divulgation technique.</li>
 *   <li>Erreurs 404 : message clair sans divulgation technique.</li>
 *   <li>Erreurs 400 : validation propre par champ sans trace d'exécution.</li>
 * </ul>
 */
class GlobalErrorHandlingSecurityTest {

    private static final String UUID_REGEX = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
    private static final Pattern UUID_PATTERN = Pattern.compile(UUID_REGEX);

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestExceptionController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("Erreurs 500 et SQL (Masquage technique & Tracking ID)")
    class InternalServerErrors {

        @Test
        @DisplayName("500 : Une RuntimeException inattendue renvoie un message générique et un trackingId UUID sans fuite")
        void testGenericExceptionReturnsGenericMessageAndTrackingId() throws Exception {
            String response = mockMvc.perform(get("/api/test-errors/runtime-exception"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.trackingId").value(matchesPattern(UUID_REGEX)))
                    .andExpect(jsonPath("$.message").value("Une erreur interne est survenue."))
                    .andReturn().getResponse().getContentAsString();

            assertThat(response)
                    .doesNotContain("NullPointerException")
                    .doesNotContain("CriticalDatabaseFailure")
                    .doesNotContain("java.lang")
                    .doesNotContain("at com.revibeflip");
        }

        @Test
        @DisplayName("500 : Une erreur d'accès aux données (SQL) ne doit jamais faire fuiter de requête SQL ni table")
        void testDataAccessExceptionHidesSqlDetails() throws Exception {
            String response = mockMvc.perform(get("/api/test-errors/sql-exception"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.trackingId").value(matchesPattern(UUID_REGEX)))
                    .andExpect(jsonPath("$.message").value("Une erreur interne est survenue."))
                    .andReturn().getResponse().getContentAsString();

            assertThat(response)
                    .doesNotContain("SELECT")
                    .doesNotContain("password_hash")
                    .doesNotContain("secret_table")
                    .doesNotContain("SQLSyntaxErrorException");
        }

        @Test
        @DisplayName("409 : Une violation de contrainte d'intégrité SQL masque les noms de clés étrangères et tables")
        void testDataIntegrityViolationHidesForeignKeyAndTable() throws Exception {
            String response = mockMvc.perform(get("/api/test-errors/integrity-violation"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.trackingId").value(matchesPattern(UUID_REGEX)))
                    .andExpect(jsonPath("$.message").value("Une incohérence ou un conflit de données est survenu."))
                    .andReturn().getResponse().getContentAsString();

            assertThat(response)
                    .doesNotContain("fk_order_buyer_id")
                    .doesNotContain("orders")
                    .doesNotContain("foreign key constraint");
        }
    }

    @Nested
    @DisplayName("Erreurs 403, 404, 401 et 400 (Messages clairs sans trace technique)")
    class ClientErrors {

        @Test
        @DisplayName("403 : Accès refusé renvoie un message clair sans détail d'infrastructure")
        void testAccessDeniedReturnsCleanMessage() throws Exception {
            mockMvc.perform(get("/api/test-errors/access-denied"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Accès refusé."))
                    .andExpect(jsonPath("$.data").doesNotExist());
        }

        @Test
        @DisplayName("404 : Ressource non trouvée renvoie un message clair")
        void testEntityNotFoundReturnsCleanMessage() throws Exception {
            mockMvc.perform(get("/api/test-errors/not-found"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Ressource non trouvée."));
        }

        @Test
        @DisplayName("401 : BadCredentials renvoie un message clair")
        void testBadCredentialsReturnsCleanMessage() throws Exception {
            mockMvc.perform(get("/api/test-errors/bad-credentials"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Identifiants invalides."));
        }

        @Test
        @DisplayName("400 : Erreur de validation Bean Validation renvoie uniquement les erreurs de champs")
        void testValidationExceptionReturnsFieldErrorsOnly() throws Exception {
            String invalidJson = "{\"title\":\"\"}";

            mockMvc.perform(post("/api/test-errors/validation")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Erreur de validation des champs."))
                    .andExpect(jsonPath("$.data.title").isNotEmpty());
        }

        @Test
        @DisplayName("400 : IllegalArgumentException renvoie le message d'erreur sans stacktrace")
        void testIllegalArgumentReturnsMessageWithoutStacktrace() throws Exception {
            String response = mockMvc.perform(get("/api/test-errors/illegal-argument"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Paramètre de tri invalide : foo"))
                    .andReturn().getResponse().getContentAsString();

            assertThat(response)
                    .doesNotContain("IllegalArgumentException")
                    .doesNotContain("at com.revibeflip");
        }
    }

    /**
     * Contrôleur de test déclenchant divers types d'exceptions.
     */
    @RestController
    @RequestMapping("/api/test-errors")
    static class TestExceptionController {

        @GetMapping("/runtime-exception")
        public void throwRuntimeException() {
            throw new NullPointerException("CriticalDatabaseFailure: connection lost to cluster-prod-01");
        }

        @GetMapping("/sql-exception")
        public void throwSqlException() {
            throw new CustomDataAccessException("SQLSyntaxErrorException: SELECT secret_table.password_hash FROM secret_table;");
        }

        @GetMapping("/integrity-violation")
        public void throwIntegrityViolation() {
            throw new DataIntegrityViolationException("Cannot add or update a child row: a foreign key constraint fails (`revibe`.`orders`, CONSTRAINT `fk_order_buyer_id`)");
        }

        @GetMapping("/access-denied")
        public void throwAccessDenied() {
            throw new AccessDeniedException("Accès refusé.");
        }

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new EntityNotFoundException("Ressource non trouvée.");
        }

        @GetMapping("/bad-credentials")
        public void throwBadCredentials() {
            throw new BadCredentialsException("Identifiants invalides.");
        }

        @PostMapping("/validation")
        public ApiResponse<Void> validateDto(@Valid @RequestBody TestInputDto dto) {
            return ApiResponse.ok(null);
        }

        @GetMapping("/illegal-argument")
        public void throwIllegalArgument() {
            throw new IllegalArgumentException("Paramètre de tri invalide : foo");
        }
    }

    static class CustomDataAccessException extends DataAccessException {
        public CustomDataAccessException(String msg) {
            super(msg);
        }
    }

    static class TestInputDto {
        @NotBlank(message = "Le titre est obligatoire.")
        private String title;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }
    }
}
