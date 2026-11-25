package com.revibeflip.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration : Vérification des informations complètes et valides
 * pour autoriser un utilisateur à devenir vendeur.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SellerEligibilityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private SmsProvider smsProvider;

    @MockitoBean
    private PaymentGateway paymentGateway;

    @Test
    @DisplayName("Bloque un utilisateur aux informations manquantes ou invalides et autorise un profil complet")
    void eligibilityCheck_blocksIncompleteOrInvalid_andAllowsCompleteUser() throws Exception {
        Category category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder().name("Mode").slug("mode-elig").build()));

        // 1. Utilisateur inscrit via OTP uniquement (champs manquants)
        User incompleteUser = userRepository.save(User.builder()
                .phone("+221778883301")
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .build());
        String incompleteToken = jwtUtil.generateToken(incompleteUser, incompleteUser.getId(), incompleteUser.getRole().name(), incompleteUser.getFullName());

        mockMvc.perform(get("/api/seller/eligibility")
                        .header("Authorization", "Bearer " + incompleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(false))
                .andExpect(jsonPath("$.data.missingFields", hasItems("prénom", "nom", "ville", "adresse")));

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + incompleteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Robe Wax",
                                "description", "Très belle robe",
                                "price", new BigDecimal("15000"),
                                "condition", ProductCondition.VERY_GOOD.name(),
                                "categoryId", category.getId(),
                                "imageUrls", List.of("https://res.cloudinary.com/demo/image/upload/sample.jpg")
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.eligible").value(false));

        // 2. Utilisateur avec format invalide (prénom numérique, email invalide, ville trop courte)
        User invalidUser = userRepository.save(User.builder()
                .firstName("123")
                .lastName("Diop")
                .phone("+221778883302")
                .email("email-invalide")
                .city("D")
                .address("Rue 10 Dakar")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .build());
        String invalidToken = jwtUtil.generateToken(invalidUser, invalidUser.getId(), invalidUser.getRole().name(), invalidUser.getFullName());

        mockMvc.perform(get("/api/seller/eligibility")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(false))
                .andExpect(jsonPath("$.data.invalidFields.firstName").isNotEmpty())
                .andExpect(jsonPath("$.data.invalidFields.email").isNotEmpty())
                .andExpect(jsonPath("$.data.invalidFields.city").isNotEmpty());

        // 3. Utilisateur complet et valide -> autorisé à devenir vendeur
        User completeUser = userRepository.save(User.builder()
                .firstName("Mariama")
                .lastName("Ba")
                .phone("+221778883303")
                .email("mariama.ba@example.com")
                .city("Dakar")
                .address("Sacré-Coeur 3, Villa 42")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .build());
        String completeToken = jwtUtil.generateToken(completeUser, completeUser.getId(), completeUser.getRole().name(), completeUser.getFullName());

        mockMvc.perform(get("/api/seller/eligibility")
                        .header("Authorization", "Bearer " + completeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(true));

        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + completeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Robe Wax Élégante",
                                "description", "Portée une fois, parfait état",
                                "price", new BigDecimal("20000"),
                                "condition", ProductCondition.VERY_GOOD.name(),
                                "categoryId", category.getId(),
                                "imageUrls", List.of("https://res.cloudinary.com/demo/image/upload/sample.jpg")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
