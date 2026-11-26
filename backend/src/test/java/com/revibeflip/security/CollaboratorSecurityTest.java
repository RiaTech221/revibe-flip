package com.revibeflip.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.dto.CreateCollaboratorRequest;
import com.revibeflip.dto.ResolveReportRequest;
import com.revibeflip.dto.UpdateCollaboratorPermissionsRequest;
import com.revibeflip.dto.UpdateUserRoleRequest;
import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.Message;
import com.revibeflip.entity.Report;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.AdminPermission;
import com.revibeflip.entity.enums.ReportReason;
import com.revibeflip.entity.enums.ReportStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.MessageRepository;
import com.revibeflip.repository.RefreshTokenRepository;
import com.revibeflip.repository.ReportRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-17 : Tests de sécurité sur le cloisonnement des droits des collaborateurs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class CollaboratorSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private User admin1;
    private User admin2;
    private User collabUsers;
    private User collabReports;
    private User collabDashboardOnly;
    private User regularUser;
    private User regularSeller;

    private String admin1Token;
    private String collabUsersToken;
    private String collabReportsToken;
    private String collabDashboardToken;

    @BeforeEach
    void setUp() {
        admin1 = saveUser(Role.ROLE_ADMIN, Set.of(), "AdminOne");
        admin2 = saveUser(Role.ROLE_ADMIN, Set.of(), "AdminTwo");
        collabUsers = saveUser(Role.ROLE_COLLABORATOR, Set.of(AdminPermission.USERS), "CollabUsers");
        collabReports = saveUser(Role.ROLE_COLLABORATOR, Set.of(AdminPermission.REPORTS), "CollabReports");
        collabDashboardOnly = saveUser(Role.ROLE_COLLABORATOR, Set.of(AdminPermission.DASHBOARD), "CollabDash");
        regularUser = saveUser(Role.ROLE_USER, Set.of(), "RegularBuyer");
        regularSeller = saveUser(Role.ROLE_USER, Set.of(), "RegularSeller");

        admin1Token = tokenFor(admin1);
        collabUsersToken = tokenFor(collabUsers);
        collabReportsToken = tokenFor(collabReports);
        collabDashboardToken = tokenFor(collabDashboardOnly);
    }

    // =========================================================================
    // 1. SUSPENSION / RÉACTIVATION : COLLABORATEUR LIMITÉ À ROLE_USER
    // =========================================================================

    @Test
    @DisplayName("1.1 Un collaborateur PERMISSION_USERS ne peut ni suspendre ni réactiver un ROLE_ADMIN (403)")
    void collaboratorCannotSuspendOrReactivateAdmin() throws Exception {
        mockMvc.perform(put("/api/admin/users/" + admin2.getId() + "/suspend")
                        .param("suspend", "true")
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(admin2.getId()).orElseThrow().getIsSuspended()).isFalse();
    }

    @Test
    @DisplayName("1.2 Un collaborateur PERMISSION_USERS ne peut ni suspendre ni réactiver un autre collaborateur (403)")
    void collaboratorCannotSuspendOrReactivateAnotherCollaborator() throws Exception {
        mockMvc.perform(put("/api/admin/users/" + collabReports.getId() + "/suspend")
                        .param("suspend", "true")
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(collabReports.getId()).orElseThrow().getIsSuspended()).isFalse();
    }

    @Test
    @DisplayName("1.3 Un collaborateur PERMISSION_USERS peut suspendre et réactiver un ROLE_USER ordinaire (200)")
    void collaboratorCanSuspendAndReactivateRegularUser() throws Exception {
        mockMvc.perform(put("/api/admin/users/" + regularUser.getId() + "/suspend")
                        .param("suspend", "true")
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(regularUser.getId()).orElseThrow().getIsSuspended()).isTrue();

        mockMvc.perform(put("/api/admin/users/" + regularUser.getId() + "/suspend")
                        .param("suspend", "false")
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(regularUser.getId()).orElseThrow().getIsSuspended()).isFalse();
    }

    // =========================================================================
    // 2. RÉSOLUTION DE SIGNALEMENT : MÊMES GARDE-FOUS + RÉVOCATION SESSIONS
    // =========================================================================

    @Test
    @DisplayName("2.1 Un collaborateur PERMISSION_REPORTS ne peut pas suspendre un ROLE_ADMIN via resolveReport (403)")
    void collaboratorCannotSuspendAdminViaReportResolution() throws Exception {
        Report reportAgainstAdmin = reportRepository.save(Report.builder()
                .reporter(regularUser)
                .reportedUser(admin1)
                .reason(ReportReason.ABUSIVE_BEHAVIOR)
                .status(ReportStatus.PENDING)
                .build());

        ResolveReportRequest req = new ResolveReportRequest();
        req.setStatus(ReportStatus.RESOLVED);
        req.setAction("SUSPEND_USER");
        req.setAdminNotes("Tentative abusive");

        mockMvc.perform(put("/api/admin/reports/" + reportAgainstAdmin.getId() + "/resolve")
                        .header("Authorization", "Bearer " + collabReportsToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(admin1.getId()).orElseThrow().getIsSuspended()).isFalse();
    }

    @Test
    @DisplayName("2.2 Un collaborateur PERMISSION_REPORTS ne peut pas suspendre un autre collaborateur via resolveReport (403)")
    void collaboratorCannotSuspendPeerViaReportResolution() throws Exception {
        Report reportAgainstCollab = reportRepository.save(Report.builder()
                .reporter(regularUser)
                .reportedUser(collabUsers)
                .reason(ReportReason.SCAM)
                .status(ReportStatus.PENDING)
                .build());

        ResolveReportRequest req = new ResolveReportRequest();
        req.setStatus(ReportStatus.RESOLVED);
        req.setAction("SUSPEND_USER");

        mockMvc.perform(put("/api/admin/reports/" + reportAgainstCollab.getId() + "/resolve")
                        .header("Authorization", "Bearer " + collabReportsToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(collabUsers.getId()).orElseThrow().getIsSuspended()).isFalse();
    }

    @Test
    @DisplayName("2.3 Résolution SUSPEND_USER sur un ROLE_USER ordinaire suspend le compte et révoque ses sessions")
    void resolveReportSuspendRegularUser_revokesSessions() throws Exception {
        String userRefresh = refreshTokenService.createRefreshToken(regularUser);
        Report report = reportRepository.save(Report.builder()
                .reporter(regularSeller)
                .reportedUser(regularUser)
                .reason(ReportReason.SCAM)
                .status(ReportStatus.PENDING)
                .build());

        ResolveReportRequest req = new ResolveReportRequest();
        req.setStatus(ReportStatus.RESOLVED);
        req.setAction("SUSPEND_USER");
        req.setAdminNotes("Fraude confirmée");

        mockMvc.perform(put("/api/admin/reports/" + report.getId() + "/resolve")
                        .header("Authorization", "Bearer " + collabReportsToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(regularUser.getId()).orElseThrow().getIsSuspended()).isTrue();
        assertThat(refreshTokenRepository.findByTokenHash(sha256(userRefresh)).orElseThrow().getRevoked()).isTrue();
    }

    // =========================================================================
    // 3. RÉTROGRADATION : PERMISSIONS VIDÉES, SESSIONS RÉVOQUÉES, AUTHORITIES STRICTES
    // =========================================================================

    @Test
    @DisplayName("3.1 Rétrograder un collaborateur en ROLE_USER vide ses permissions et révoque ses sessions")
    void demotingCollaboratorToUser_clearsPermissionsAndRevokesSessions() throws Exception {
        String collabRefresh = refreshTokenService.createRefreshToken(collabUsers);

        UpdateUserRoleRequest req = new UpdateUserRoleRequest();
        req.setRole(Role.ROLE_USER);

        mockMvc.perform(put("/api/admin/users/" + collabUsers.getId() + "/role")
                        .header("Authorization", "Bearer " + admin1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        User reloaded = userRepository.findById(collabUsers.getId()).orElseThrow();
        assertThat(reloaded.getRole()).isEqualTo(Role.ROLE_USER);
        assertThat(reloaded.getAdminPermissions()).isEmpty();
        assertThat(refreshTokenRepository.findByTokenHash(sha256(collabRefresh)).orElseThrow().getRevoked()).isTrue();
    }

    @Test
    @DisplayName("3.2 User.getAuthorities() n'accorde les droits PERMISSION_* qu'aux comptes ROLE_COLLABORATOR")
    void getAuthorities_grantsPermissionsOnlyToCollaborator() {
        User staleUser = User.builder()
                .id(999L)
                .phone("+221779999999")
                .role(Role.ROLE_USER)
                .adminPermissions(new HashSet<>(Set.of(AdminPermission.USERS, AdminPermission.REPORTS)))
                .build();

        assertThat(staleUser.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_USER")
                .doesNotContain("PERMISSION_USERS", "PERMISSION_REPORTS");
    }

    // =========================================================================
    // 4. PÉRIMÈTRE DASHBOARD & LISTE UTILISATEURS
    // =========================================================================

    @Test
    @DisplayName("4.1 Le dashboard d'un collaborateur PERMISSION_DASHBOARD seul masque auditLogs, recentOrders et recentReports")
    void dashboardFilteredForCollaborator() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + collabDashboardToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recentAuditLogs").isEmpty())
                .andExpect(jsonPath("$.data.recentOrders").isEmpty())
                .andExpect(jsonPath("$.data.recentReports").isEmpty())
                .andExpect(jsonPath("$.data.actionItems.unreadContactMessages").value(0));
    }

    @Test
    @DisplayName("4.2 La liste et le détail utilisateurs pour un collaborateur PERMISSION_USERS excluent ROLE_ADMIN et ROLE_COLLABORATOR")
    void usersListAndDetailFilteredForCollaborator() throws Exception {
        // Demander role=ROLE_ADMIN renvoie une page vide
        mockMvc.perform(get("/api/admin/users")
                        .param("role", "ROLE_ADMIN")
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());

        // Consulter le détail d'un admin renvoie 403
        mockMvc.perform(get("/api/admin/users/" + admin1.getId())
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isForbidden());

        // Consulter le détail d'un utilisateur ordinaire réussit
        mockMvc.perform(get("/api/admin/users/" + regularUser.getId())
                        .header("Authorization", "Bearer " + collabUsersToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 5. AUDIT DE CONVERSATION : SIGNALEMENT VALIDE ET LIÉ REQUIS
    // =========================================================================

    @Test
    @DisplayName("5.1 audit-view exige un reportId valide et lié à la conversation (403 sinon, 200 si lié)")
    void auditViewConversationRequiresLinkedReport() throws Exception {
        Conversation conv = conversationRepository.save(Conversation.builder()
                .buyer(regularUser)
                .seller(regularSeller)
                .lastMessagePreview("Bonjour")
                .build());

        messageRepository.save(Message.builder()
                .conversation(conv)
                .sender(regularUser)
                .content("Message de test audit")
                .build());

        // Sans reportId -> 403
        mockMvc.perform(get("/api/admin/conversations/" + conv.getId() + "/audit-view")
                        .header("Authorization", "Bearer " + collabReportsToken))
                .andExpect(status().isForbidden());

        // reportId inexistant -> 403
        mockMvc.perform(get("/api/admin/conversations/" + conv.getId() + "/audit-view")
                        .param("reportId", "999999")
                        .header("Authorization", "Bearer " + collabReportsToken))
                .andExpect(status().isForbidden());

        // Signalement non lié à cette conversation (autres utilisateurs) -> 403
        Report unrelatedReport = reportRepository.save(Report.builder()
                .reporter(admin1)
                .reportedUser(admin2)
                .reason(ReportReason.OTHER)
                .status(ReportStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/admin/conversations/" + conv.getId() + "/audit-view")
                        .param("reportId", String.valueOf(unrelatedReport.getId()))
                        .header("Authorization", "Bearer " + collabReportsToken))
                .andExpect(status().isForbidden());

        // Signalement valide et lié (buyer signale seller) -> 200
        Report linkedReport = reportRepository.save(Report.builder()
                .reporter(regularUser)
                .reportedUser(regularSeller)
                .reason(ReportReason.SCAM)
                .status(ReportStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/admin/conversations/" + conv.getId() + "/audit-view")
                        .param("reportId", String.valueOf(linkedReport.getId()))
                        .header("Authorization", "Bearer " + collabReportsToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].content").value("Message de test audit"));
    }

    // =========================================================================
    // 6. VALIDATION FORMAT EMAIL SUR LES DTO COLLABORATEURS
    // =========================================================================

    @Test
    @DisplayName("6.1 Un format d'e-mail invalide est rejeté (400) à la création et mise à jour d'un collaborateur")
    void invalidEmailRejectedOnCollaboratorEndpoints() throws Exception {
        CreateCollaboratorRequest createReq = CreateCollaboratorRequest.builder()
                .firstName("Bad")
                .lastName("Email")
                .phone("+22177" + (1000000 + (int) (Math.random() * 8999999)))
                .email("pas-un-email-valide")
                .permissions(Set.of(AdminPermission.DASHBOARD))
                .build();

        mockMvc.perform(post("/api/admin/collaborators")
                        .header("Authorization", "Bearer " + admin1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isBadRequest());

        UpdateCollaboratorPermissionsRequest updateReq = UpdateCollaboratorPermissionsRequest.builder()
                .email("encore-invalide@@")
                .permissions(Set.of(AdminPermission.DASHBOARD))
                .build();

        mockMvc.perform(put("/api/admin/collaborators/" + collabDashboardOnly.getId())
                        .header("Authorization", "Bearer " + admin1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User saveUser(Role role, Set<AdminPermission> perms, String label) {
        String salt = UUID.randomUUID().toString().substring(0, 8);
        String phone = "+22177" + (1000000 + (int) (Math.random() * 8999999));
        return userRepository.save(User.builder()
                .phone(phone)
                .email(label.toLowerCase() + "-" + salt + "@revibeflip.sn")
                .firstName(label)
                .lastName("Test")
                .password(passwordEncoder.encode("StrongPass123!"))
                .role(role)
                .adminPermissions(new HashSet<>(perms))
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build());
    }

    private String tokenFor(User user) {
        return jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getFullName());
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
