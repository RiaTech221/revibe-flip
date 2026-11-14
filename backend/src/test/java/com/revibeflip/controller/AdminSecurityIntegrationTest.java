package com.revibeflip.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AdminSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Sécurité: Accès refusé (403) pour un utilisateur avec ROLE_USER sur /api/admin/dashboard")
    @WithMockUser(username = "+221778889900", roles = {"USER"})
    void testAdminEndpoint_ForbiddenForRoleUser() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sécurité: Accès accepté (200) pour un administrateur avec ROLE_ADMIN sur /api/admin/dashboard")
    @WithMockUser(username = "+221770000000", roles = {"ADMIN"})
    void testAdminEndpoint_AllowedForRoleAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard?period=30d"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/dashboard?period=7d"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/dashboard?period=90d"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/dashboard?period=month"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/dashboard?period=custom&from=2026-01-01&to=2026-01-31"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin: Grand livre accessible à ROLE_ADMIN")
    @WithMockUser(username = "+221770000001", roles = {"ADMIN"})
    void testDevReseed_AllowedForRoleAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/ledger"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sécurité: Accès refusé (401) pour une requête non authentifiée")
    void testAdminEndpoint_UnauthorizedWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Sécurité: Modification d'utilisateur interdite (403) pour ROLE_USER")
    @WithMockUser(username = "+221778889900", roles = {"USER"})
    void testAdminAction_ForbiddenForRoleUser() throws Exception {
        mockMvc.perform(put("/api/admin/users/1/suspend?suspend=true"))
                .andExpect(status().isForbidden());
    }
}
