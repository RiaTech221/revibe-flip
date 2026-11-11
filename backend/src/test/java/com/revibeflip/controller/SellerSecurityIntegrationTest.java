package com.revibeflip.controller;

import com.revibeflip.entity.Order;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SellerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("Sécurité Espace Vendeur: Accès refusé pour une requête non authentifiée")
    void testUnauthenticated_Forbidden() throws Exception {
        mockMvc.perform(get("/api/seller/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sécurité Espace Vendeur: Accès accepté pour un utilisateur authentifié sur son dashboard")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testSeller_AllowedOnOwnDashboard() throws Exception {
        mockMvc.perform(get("/api/seller/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Isolation Vendeur: Un vendeur A ne peut pas modifier ni supprimer l'annonce du vendeur B")
    @WithMockUser(username = "+221771112233", roles = {"USER"}) // Connecté en Vendeur A (Aminata)
    void testSellerA_CannotModifyOrDeleteSellerB_Product() throws Exception {
        // Trouver une annonce appartenant à Moussa (+221774445566)
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        if (moussa != null) {
            Product productOfMoussa = productRepository.findBySellerIdOrderByCreatedAtDesc(moussa.getId())
                    .stream().findFirst().orElse(null);

            if (productOfMoussa != null) {
                // Aminata tente de supprimer l'annonce de Moussa -> 403 AccessDenied
                mockMvc.perform(delete("/api/seller/products/" + productOfMoussa.getId()))
                        .andExpect(status().isForbidden());

                // Aminata tente de modifier le statut de l'annonce de Moussa -> 403 AccessDenied
                mockMvc.perform(put("/api/seller/products/" + productOfMoussa.getId() + "/status?status=INACTIVE"))
                        .andExpect(status().isForbidden());
            }
        }
    }

    @Test
    @DisplayName("Isolation Vendeur: Un vendeur ne peut pas accéder aux commandes d'un autre vendeur")
    @WithMockUser(username = "+221778889900", roles = {"USER"}) // Connecté en Fatou (Acheteur non vendeur de la commande)
    void testOtherUser_CannotAcceptOrRefuse_Order() throws Exception {
        Order existingOrder = orderRepository.findAll().stream().findFirst().orElse(null);
        if (existingOrder != null) {
            mockMvc.perform(put("/api/seller/orders/" + existingOrder.getId() + "/accept"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Isolation Dashboard Vendeur: Vendeur A et Vendeur B ont des tableaux de bord distincts et isolés")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testSellerDashboard_Isolation_SellerA() throws Exception {
        mockMvc.perform(get("/api/seller/dashboard?period=30d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sellerPhone").value("+221771112233"))
                .andExpect(jsonPath("$.data.sellerName").value("Aminata Diallo"))
                .andExpect(jsonPath("$.data.actionItems").exists())
                .andExpect(jsonPath("$.data.turnover").exists());
    }

    @Test
    @DisplayName("Isolation Dashboard Vendeur: Vendeur B voit exclusivement son propre compte")
    @WithMockUser(username = "+221774445566", roles = {"USER"})
    void testSellerDashboard_Isolation_SellerB() throws Exception {
        mockMvc.perform(get("/api/seller/dashboard?period=30d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sellerPhone").value("+221774445566"))
                .andExpect(jsonPath("$.data.sellerName").value("Moussa Ndiaye"));
    }

    @Test
    @DisplayName("Dashboard Vendeur: Périodes 7d, 30d, 90d, month et custom acceptées")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testSellerDashboard_AllPeriodsSupported() throws Exception {
        mockMvc.perform(get("/api/seller/dashboard?period=7d")).andExpect(status().isOk());
        mockMvc.perform(get("/api/seller/dashboard?period=90d")).andExpect(status().isOk());
        mockMvc.perform(get("/api/seller/dashboard?period=month")).andExpect(status().isOk());
        mockMvc.perform(get("/api/seller/dashboard?period=custom&from=2026-11-01&to=2026-11-11")).andExpect(status().isOk());
    }
}
