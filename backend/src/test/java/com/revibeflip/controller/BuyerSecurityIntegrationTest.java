package com.revibeflip.controller;

import com.revibeflip.entity.Address;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.User;
import com.revibeflip.repository.AddressRepository;
import com.revibeflip.repository.OrderRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class BuyerSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Test
    @DisplayName("Sécurité Acheteur: Requête non authentifiée refusée sur les commandes")
    void testUnauthenticated_ForbiddenOnOrders() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sécurité Acheteur: Requête non authentifiée refusée sur le carnet d'adresses")
    void testUnauthenticated_ForbiddenOnAddresses() throws Exception {
        mockMvc.perform(get("/api/users/addresses"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sécurité Acheteur: Utilisateur connecté autorisé sur son carnet d'adresses")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testAuthenticatedBuyer_AllowedOnAddresses() throws Exception {
        mockMvc.perform(get("/api/users/addresses"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sécurité Acheteur: Utilisateur connecté autorisé sur ses commandes paginées")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testAuthenticatedBuyer_AllowedOnMyOrders() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Isolation Acheteur: L'acheteur A ne peut pas consulter une commande appartenant exclusivement à l'acheteur B")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testBuyerA_CannotAccessBuyerB_Order() throws Exception {
        // Trouver une commande passée par Moussa (+221774445566) où Aminata n'est ni acheteur ni vendeur
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        if (moussa != null) {
            Order orderOfMoussa = orderRepository.findByBuyerIdOrderByCreatedAtDesc(moussa.getId())
                    .stream()
                    .filter(o -> !o.getSeller().getPhone().equals("+221771112233"))
                    .findFirst()
                    .orElse(null);

            if (orderOfMoussa != null) {
                mockMvc.perform(get("/api/orders/" + orderOfMoussa.getId()))
                        .andExpect(status().isForbidden());
            }
        }
    }

    @Test
    @DisplayName("Isolation Acheteur: L'acheteur A ne peut pas confirmer la réception d'une commande appartenant à B")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testBuyerA_CannotConfirmReceipt_OrderOfB() throws Exception {
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        if (moussa != null) {
            Order orderOfMoussa = orderRepository.findByBuyerIdOrderByCreatedAtDesc(moussa.getId())
                    .stream()
                    .filter(o -> !o.getSeller().getPhone().equals("+221771112233"))
                    .findFirst()
                    .orElse(null);

            if (orderOfMoussa != null) {
                mockMvc.perform(post("/api/orders/" + orderOfMoussa.getId() + "/confirm-receipt"))
                        .andExpect(status().isForbidden());
            }
        }
    }

    @Test
    @DisplayName("Isolation Acheteur: L'acheteur A ne peut pas modifier l'adresse de livraison de B")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testBuyerA_CannotModifyAddressOfB() throws Exception {
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        if (moussa != null) {
            Address addressOfMoussa = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(moussa.getId())
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (addressOfMoussa != null) {
                mockMvc.perform(put("/api/users/addresses/" + addressOfMoussa.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\":\"Piratage\",\"recipientName\":\"Hacker\",\"phone\":\"+221770000000\",\"city\":\"Dakar\",\"addressLine\":\"Inconnue\",\"isDefault\":false}"))
                        .andExpect(status().isForbidden());
            }
        }
    }
}
