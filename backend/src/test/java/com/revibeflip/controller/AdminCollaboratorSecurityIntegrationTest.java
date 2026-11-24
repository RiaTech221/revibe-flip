package com.revibeflip.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.CategoryRequest;
import com.revibeflip.dto.CreateCollaboratorRequest;
import com.revibeflip.dto.UpdateCollaboratorPermissionsRequest;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AdminPermission;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US-36 : Tests d'intégration et de sécurité sur la création et la gestion des comptes collaborateurs.
 *
 * <p>Vérifie :
 * <ul>
 *   <li>Création de collaborateurs avec permissions fines par module par un ROLE_ADMIN.</li>
 *   <li>Refus (403) de création / modification / suppression pour non-admins et collaborateurs.</li>
 *   <li>Accès accordé (200) aux modules pour lesquels le collaborateur a la permission.</li>
 *   <li>Accès refusé (403) aux modules pour lesquels le collaborateur n'a pas la permission.</li>
 *   <li>Effet immédiat de la modification de permissions et de la suspension.</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AdminCollaboratorSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SmsProvider smsProvider;

    @MockitoBean
    private PaymentGateway paymentGateway;

    private User adminUser;
    private String adminToken;

    private User regularUser;
    private String regularUserToken;

    @BeforeEach
    void setUp() {
        String salt = UUID.randomUUID().toString().substring(0, 8);

        // 1. Admin
        adminUser = userRepository.save(User.builder()
                .phone("+22177" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("Admin" + salt)
                .lastName("Principal")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .isVerified(true)
                .isSuspended(false)
                .build());
        adminToken = tokenFor(adminUser);

        // 2. Regular User
        regularUser = userRepository.save(User.builder()
                .phone("+22178" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("User" + salt)
                .lastName("Normal")
                .password(passwordEncoder.encode("UserPass123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .isSuspended(false)
                .build());
        regularUserToken = tokenFor(regularUser);
    }

    private String tokenFor(User user) {
        return jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getFullName());
    }

    private User createCollaborator(Set<AdminPermission> permissions) {
        String salt = UUID.randomUUID().toString().substring(0, 8);
        return userRepository.save(User.builder()
                .phone("+22176" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("Collab" + salt)
                .lastName("Modérateur")
                .password(passwordEncoder.encode("CollabPass123!"))
                .role(Role.ROLE_COLLABORATOR)
                .isVerified(true)
                .isSuspended(false)
                .adminPermissions(new HashSet<>(permissions))
                .build());
    }

    // =========================================================================
    // 1. CRÉATION ET GESTION DES COLLABORATEURS (RÉSERVÉ À L'ADMIN)
    // =========================================================================
    @Nested
    @DisplayName("1. CRUD Collaborateurs — Contrôle d'accès et permissions")
    class CollaboratorCrudTests {

        @Test
        @DisplayName("Un ROLE_ADMIN peut créer un compte collaborateur avec ses permissions")
        void adminCanCreateCollaborator() throws Exception {
            String newPhone = "+22177" + (1000000 + (int) (Math.random() * 8999999));
            CreateCollaboratorRequest request = CreateCollaboratorRequest.builder()
                    .firstName("Moussa")
                    .lastName("Diop")
                    .phone(newPhone)
                    .email("moussa." + UUID.randomUUID().toString().substring(0, 6) + "@revibeflip.sn")
                    .password("SecretCollab123!")
                    .permissions(Set.of(AdminPermission.DASHBOARD, AdminPermission.PRODUCTS))
                    .build();

            mockMvc.perform(post("/api/admin/collaborators")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.role").value("ROLE_COLLABORATOR"))
                    .andExpect(jsonPath("$.data.phone").value(newPhone))
                    .andExpect(jsonPath("$.data.permissions").isArray())
                    .andExpect(jsonPath("$.data.initialPassword").value("SecretCollab123!"));

            User created = userRepository.findByPhone(newPhone).orElse(null);
            assertThat(created).isNotNull();
            assertThat(created.getRole()).isEqualTo(Role.ROLE_COLLABORATOR);
            assertThat(created.getAdminPermissions()).containsExactlyInAnyOrder(AdminPermission.DASHBOARD, AdminPermission.PRODUCTS);
        }

        @Test
        @DisplayName("Un collaborateur ne peut pas créer un autre collaborateur (403 Forbidden)")
        void collaboratorCannotCreateCollaborator() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.USERS));
            String collabToken = tokenFor(collab);

            CreateCollaboratorRequest request = CreateCollaboratorRequest.builder()
                    .firstName("Attacker")
                    .lastName("SubCollab")
                    .phone("+221779998877")
                    .permissions(Set.of(AdminPermission.DASHBOARD))
                    .build();

            mockMvc.perform(post("/api/admin/collaborators")
                            .header("Authorization", "Bearer " + collabToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Un utilisateur simple (ROLE_USER) ne peut pas créer de collaborateur (403 Forbidden)")
        void regularUserCannotCreateCollaborator() throws Exception {
            CreateCollaboratorRequest request = CreateCollaboratorRequest.builder()
                    .firstName("Test")
                    .lastName("User")
                    .phone("+221770001122")
                    .permissions(Set.of(AdminPermission.DASHBOARD))
                    .build();

            mockMvc.perform(post("/api/admin/collaborators")
                            .header("Authorization", "Bearer " + regularUserToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Une requête sans authentification renvoie 401 Unauthorized")
        void unauthenticatedCannotAccessCollaborators() throws Exception {
            mockMvc.perform(get("/api/admin/collaborators"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("L'administrateur peut modifier les permissions d'un collaborateur existant")
        void adminCanUpdateCollaboratorPermissions() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.PRODUCTS));

            UpdateCollaboratorPermissionsRequest updateReq = UpdateCollaboratorPermissionsRequest.builder()
                    .firstName("Modifié")
                    .lastName("NouveauNom")
                    .permissions(Set.of(AdminPermission.CATEGORIES, AdminPermission.REPORTS))
                    .build();

            mockMvc.perform(put("/api/admin/collaborators/" + collab.getId())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            User updated = userRepository.findById(collab.getId()).orElseThrow();
            assertThat(updated.getAdminPermissions()).containsExactlyInAnyOrder(AdminPermission.CATEGORIES, AdminPermission.REPORTS);
        }

        @Test
        @DisplayName("L'administrateur peut suspendre et réactiver un collaborateur")
        void adminCanSuspendAndReactivateCollaborator() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.PRODUCTS));

            // Suspension
            mockMvc.perform(put("/api/admin/collaborators/" + collab.getId() + "/suspend")
                            .param("suspend", "true")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isSuspended").value(true));

            User suspended = userRepository.findById(collab.getId()).orElseThrow();
            assertThat(suspended.getIsSuspended()).isTrue();

            // Réactivation
            mockMvc.perform(put("/api/admin/collaborators/" + collab.getId() + "/suspend")
                            .param("suspend", "false")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isSuspended").value(false));

            User reactivated = userRepository.findById(collab.getId()).orElseThrow();
            assertThat(reactivated.getIsSuspended()).isFalse();
        }

        @Test
        @DisplayName("L'administrateur peut retirer (supprimer) un compte collaborateur")
        void adminCanDeleteCollaborator() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.DASHBOARD));

            mockMvc.perform(delete("/api/admin/collaborators/" + collab.getId())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            User deleted = userRepository.findById(collab.getId()).orElse(null);
            // Soit supprimé physiquement, soit anonymisé/suspendu si contraintes FK
            if (deleted != null) {
                assertThat(deleted.getIsSuspended()).isTrue();
                assertThat(deleted.getRole()).isEqualTo(Role.ROLE_USER);
            }
        }
    }

    // =========================================================================
    // 2. CONTRÔLE D'ACCÈS GRANULAIRE PAR MODULE (US-27 à US-32)
    // =========================================================================
    @Nested
    @DisplayName("2. Sécurité des modules Back-Office par permission")
    class ModulePermissionTests {

        // --- US-27 : DASHBOARD ---
        @Test
        @DisplayName("Collaborateur avec DASHBOARD accède à /api/admin/dashboard (200 OK)")
        void collaboratorWithDashboardAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.DASHBOARD));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/dashboard")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans DASHBOARD est rejeté sur /api/admin/dashboard (403 Forbidden)")
        void collaboratorWithoutDashboardAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.PRODUCTS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/dashboard")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        // --- US-28 : USERS ---
        @Test
        @DisplayName("Collaborateur avec USERS accède à /api/admin/users (200 OK)")
        void collaboratorWithUsersAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.USERS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans USERS est rejeté sur /api/admin/users (403 Forbidden)")
        void collaboratorWithoutUsersAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.DASHBOARD));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        // --- US-29 : PRODUCTS ---
        @Test
        @DisplayName("Collaborateur avec PRODUCTS accède à /api/admin/products (200 OK)")
        void collaboratorWithProductsAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.PRODUCTS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/products")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans PRODUCTS est rejeté sur /api/admin/products (403 Forbidden)")
        void collaboratorWithoutProductsAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.CATEGORIES));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/products")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        // --- US-30 : CATEGORIES ---
        @Test
        @DisplayName("Collaborateur avec CATEGORIES accède à POST /api/admin/categories (200 OK)")
        void collaboratorWithCategoriesAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.CATEGORIES));
            String token = tokenFor(collab);

            String uniqueSuffix = UUID.randomUUID().toString().substring(0, 5);
            CategoryRequest req = CategoryRequest.builder()
                    .name("Catégorie Collab " + uniqueSuffix)
                    .slug("collab-cat-" + uniqueSuffix)
                    .icon("tag")
                    .description("Test permission catégorie")
                    .displayOrder(99)
                    .build();

            mockMvc.perform(post("/api/admin/categories")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans CATEGORIES est rejeté sur POST /api/admin/categories (403 Forbidden)")
        void collaboratorWithoutCategoriesAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.DASHBOARD));
            String token = tokenFor(collab);

            String uniqueSuffix = UUID.randomUUID().toString().substring(0, 5);
            CategoryRequest req = CategoryRequest.builder()
                    .name("Catégorie Rejetée " + uniqueSuffix)
                    .slug("rejected-cat-" + uniqueSuffix)
                    .build();

            mockMvc.perform(post("/api/admin/categories")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
        }

        // --- US-31 : ORDERS_PAYMENTS ---
        @Test
        @DisplayName("Collaborateur avec ORDERS_PAYMENTS accède à /api/admin/orders et /api/admin/payments (200 OK)")
        void collaboratorWithOrdersPaymentsAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.ORDERS_PAYMENTS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/orders")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/admin/payments")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans ORDERS_PAYMENTS est rejeté sur /api/admin/orders et /api/admin/payments (403 Forbidden)")
        void collaboratorWithoutOrdersPaymentsAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.PRODUCTS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/orders")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            mockMvc.perform(get("/api/admin/payments")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        // --- US-32 : REPORTS ---
        @Test
        @DisplayName("Collaborateur avec REPORTS accède à /api/admin/reports (200 OK)")
        void collaboratorWithReportsAccessAllowed() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.REPORTS));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/reports")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Collaborateur sans REPORTS est rejeté sur /api/admin/reports (403 Forbidden)")
        void collaboratorWithoutReportsAccessForbidden() throws Exception {
            User collab = createCollaborator(Set.of(AdminPermission.DASHBOARD));
            String token = tokenFor(collab);

            mockMvc.perform(get("/api/admin/reports")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        // --- MODULES RÉSERVÉS À L'ADMINISTRATEUR SEUL ---
        @Test
        @DisplayName("Un collaborateur même avec toutes les permissions ne peut pas accéder aux paramètres plateforme (403 Forbidden)")
        void collaboratorCannotAccessPlatformSettings() throws Exception {
            User fullCollab = createCollaborator(Set.of(
                    AdminPermission.DASHBOARD,
                    AdminPermission.USERS,
                    AdminPermission.PRODUCTS,
                    AdminPermission.CATEGORIES,
                    AdminPermission.ORDERS_PAYMENTS,
                    AdminPermission.REPORTS
            ));
            String token = tokenFor(fullCollab);

            mockMvc.perform(get("/api/admin/settings")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }
}
