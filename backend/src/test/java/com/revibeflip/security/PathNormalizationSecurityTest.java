package com.revibeflip.security;

import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-13 : Tests de sécurité sur la normalisation des chemins protégés.
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Quand une requête vise un chemin protégé avec une variante (slash final, double slash, casse différente, caractères encodés, etc.),
 *       alors les mêmes règles d'accès s'appliquent que pour le chemin normal.</li>
 *   <li>Un utilisateur sans droit (ROLE_USER) reçoit HTTP 403 sur toutes ces variantes.</li>
 *   <li>Les requêtes anonymes reçoivent HTTP 401 ou 403.</li>
 *   <li>L'administrateur légitime (ROLE_ADMIN) accède avec succès (HTTP 200).</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PathNormalizationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);

        User standardUser = userRepository.save(User.builder()
                .phone(com.revibeflip.support.TestPhoneGenerator.nextPhone("+22177"))
                .firstName("User" + salt)
                .lastName("Normal")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .isSuspended(false)
                .build());
        userToken = jwtUtil.generateToken(standardUser, standardUser.getId(), standardUser.getRole().name(), standardUser.getFullName());

        User adminUser = userRepository.save(User.builder()
                .phone(com.revibeflip.support.TestPhoneGenerator.nextPhone("+22178"))
                .firstName("Admin" + salt)
                .lastName("Security")
                .password(passwordEncoder.encode("AdminSecret123!"))
                .role(Role.ROLE_ADMIN)
                .isVerified(true)
                .isSuspended(false)
                .build());
        adminToken = jwtUtil.generateToken(adminUser, adminUser.getId(), adminUser.getRole().name(), adminUser.getFullName());
    }

    @Nested
    @DisplayName("1. Rejet HTTP 403 pour un utilisateur sans droit (ROLE_USER)")
    class UnauthorizedUserForbiddenTests {

        @Test
        @DisplayName("Chemin normal /api/admin/users -> 403 Forbidden")
        void testNormalAdminPathForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(status().isForbidden());
        }

        @ParameterizedTest(name = "Variante de casse : {0}")
        @ValueSource(strings = {
                "/api/ADMIN/users",
                "/api/Admin/users",
                "/API/admin/users",
                "/API/ADMIN/USERS",
                "/api/admin/USERS",
                "/api/ADMIN/dashboard",
                "/api/Admin/dashboard"
        })
        @DisplayName("Variantes de casse (majuscules/minuscules) -> 403 Forbidden")
        void testCaseSensitivityVariantsForbidden(String path) throws Exception {
            mockMvc.perform(get(path)
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(status().isForbidden());
        }

        @ParameterizedTest(name = "Variante de slashes : {0}")
        @ValueSource(strings = {
                "/api/admin/users/",
                "/api/admin/dashboard/",
                "/api//admin/users",
                "//api/admin/users",
                "/api/admin//users",
                "/api///admin///users"
        })
        @DisplayName("Variantes de slashes (trailing slash, double slash) -> 403 Forbidden")
        void testSlashVariantsForbidden(String path) throws Exception {
            mockMvc.perform(get(path)
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(result -> {
                        int code = result.getResponse().getStatus();
                        org.assertj.core.api.Assertions.assertThat(code)
                                .as("Le chemin avec slash %s doit être rejeté (403 ou 400)", path)
                                .isIn(403, 400);
                    });
        }

        @ParameterizedTest(name = "Variante encodée : {0}")
        @ValueSource(strings = {
                "/api/%61dmin/users",
                "/api/%41dmin/users",
                "/api/%61%64%6d%69%6e/users",
                "/api/admin/%75sers"
        })
        @DisplayName("Variantes avec encodage URL (%-encoding) -> 403 Forbidden")
        void testUrlEncodedVariantsForbidden(String path) throws Exception {
            mockMvc.perform(get(path)
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(result -> {
                        int code = result.getResponse().getStatus();
                        org.assertj.core.api.Assertions.assertThat(code)
                                .as("Le chemin encodé %s doit être protégé et refuser l'accès", path)
                                .isIn(403, 400);
                    });
        }

        @ParameterizedTest(name = "Variante versionnée ou traversée : {0}")
        @ValueSource(strings = {
                "/api/v1/admin/users",
                "/api/v1/admin/dashboard",
                "/api/countries/../admin/users"
        })
        @DisplayName("Variantes versionnées ou relatives -> 403 Forbidden")
        void testVersionedAndRelativeVariantsForbidden(String path) throws Exception {
            mockMvc.perform(get(path)
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(result -> {
                        int code = result.getResponse().getStatus();
                        org.assertj.core.api.Assertions.assertThat(code)
                                .as("Le chemin versionné ou relatif %s doit refuser l'accès", path)
                                .isIn(403, 400);
                    });
        }
    }

    @Nested
    @DisplayName("2. Rejet pour un utilisateur anonyme (sans token)")
    class AnonymousUserUnauthorizedTests {

        @ParameterizedTest(name = "Chemin anonyme : {0}")
        @ValueSource(strings = {
                "/api/admin/users",
                "/api/ADMIN/users",
                "/api/admin/users/",
                "/api//admin/users",
                "/api/%61dmin/users",
                "/api/v1/admin/users"
        })
        @DisplayName("Toutes les variantes sans authentification sont rejetées (401 ou 403/400)")
        void testAnonymousRequestsRejected(String path) throws Exception {
            mockMvc.perform(get(path))
                    .andExpect(result -> {
                        int code = result.getResponse().getStatus();
                        org.assertj.core.api.Assertions.assertThat(code)
                                .as("L'accès anonyme à %s doit être refusé (401, 403 ou 400)", path)
                                .isIn(401, 403, 400);
                    });
        }
    }

    @Nested
    @DisplayName("3. Accès légitime pour l'administrateur (ROLE_ADMIN)")
    class AuthorizedAdminSuccessTests {

        @Test
        @DisplayName("L'administrateur accède au chemin standard /api/admin/users -> 200 OK")
        void testAdminAccessNormalPathSuccess() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("L'administrateur accède au tableau de bord /api/admin/dashboard -> 200 OK")
        void testAdminAccessDashboardSuccess() throws Exception {
            mockMvc.perform(get("/api/admin/dashboard")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }
}
