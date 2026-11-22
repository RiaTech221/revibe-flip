package com.revibeflip.controller;

import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.ReviewRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * SEC-01 — R6 : Vérification que GET /api/reviews/user/{userId} (endpoint public)
 * n'expose aucune donnée PII du reviewer ni du reviewee.
 *
 * <p>ReviewDto ne contient volontairement que des données non-PII :
 * id, orderId, reviewerId (Long), reviewerName (fullName), reviewerAvatar (URL),
 * targetUserId (Long), rating, comment, createdAt.
 *
 * <p>Stratégie de fixture : on cherche le premier utilisateur ayant des avis
 * dans la base H2 initialisée par DataInitializer. Si aucun avis n'existe,
 * les tests de contenu sont skippés (assumeTrue). Le test R6-01 (accès public)
 * fonctionne toujours avec un userId quelconque (retourne liste vide).
 *
 * <p>Note : Review.order_id est NOT NULL (contrainte DB), donc il est impossible
 * de créer un Review sans Order en test d'intégration. Pas de correction nécessaire
 * côté production — ReviewDto est déjà clean.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ReviewDataExposureTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @MockitoBean private SmsProvider smsProvider;
    @MockitoBean private PaymentGateway paymentGateway;

    /**
     * PII du reviewer que l'on SURVEILLE — extraites dynamiquement du reviewer en base.
     * Si aucun avis n'existe, ces valeurs restent null et les tests body-check skippent.
     */
    private String reviewerPhone;
    private String reviewerEmail;
    private String revieweePhone;
    private String revieweeEmail;

    /** ID de l'utilisateur cible (reviewee) utilisé dans les requêtes. */
    private Long revieweeId;

    /** Flag : indique si des avis existent en base pour les tests de contenu. */
    private boolean hasReviews;

    @BeforeEach
    void setUpFixtures() {
        // Cherche le premier utilisateur ayant des avis (peuplé par DataInitializer)
        List<User> allUsers = userRepository.findAll();
        for (User candidate : allUsers) {
            var reviews = reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(candidate.getId());
            if (!reviews.isEmpty()) {
                revieweeId = candidate.getId();
                revieweePhone = candidate.getPhone();
                revieweeEmail = candidate.getEmail();
                var firstReview = reviews.get(0);
                if (firstReview.getReviewer() != null) {
                    reviewerPhone = firstReview.getReviewer().getPhone();
                    reviewerEmail = firstReview.getReviewer().getEmail();
                }
                hasReviews = true;
                break;
            }
        }

        if (!hasReviews) {
            // Fallback : utilise n'importe quel userId existant pour tester l'accès public
            revieweeId = allUsers.isEmpty() ? 1L : allUsers.get(0).getId();
        }
    }

    // ------------------------------------------------------------------ //
    //  R6a — Accessibilité publique                                        //
    // ------------------------------------------------------------------ //

    @Test
    @DisplayName("R6-01 : GET /api/reviews/user/{id} est accessible sans authentification (200)")
    void reviewEndpoint_IsPublic() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andDo(print())
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ //
    //  R6b — Corps brut : aucune PII                                       //
    // ------------------------------------------------------------------ //

    @Test
    @DisplayName("R6-02 : Le corps brut ne contient pas le téléphone du reviewer")
    void reviews_BodyDoesNotContainReviewerPhone() throws Exception {
        Assumptions.assumeTrue(hasReviews && reviewerPhone != null,
                "Pas d'avis en base — test skipé");
        MvcResult result = mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString())
                .as("Le téléphone du reviewer ne doit PAS apparaître dans GET /api/reviews/user/{id}")
                .doesNotContain(reviewerPhone);
    }

    @Test
    @DisplayName("R6-03 : Le corps brut ne contient pas l'e-mail du reviewer")
    void reviews_BodyDoesNotContainReviewerEmail() throws Exception {
        Assumptions.assumeTrue(hasReviews && reviewerEmail != null,
                "Pas d'avis en base — test skipé");
        MvcResult result = mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString())
                .as("L'e-mail du reviewer ne doit PAS apparaître dans GET /api/reviews/user/{id}")
                .doesNotContain(reviewerEmail);
    }

    @Test
    @DisplayName("R6-04 : Le corps brut ne contient pas l'e-mail du reviewee")
    void reviews_BodyDoesNotContainRevieweeEmail() throws Exception {
        Assumptions.assumeTrue(hasReviews && revieweeEmail != null,
                "Pas d'avis en base — test skipé");
        MvcResult result = mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString())
                .as("L'e-mail du reviewee ne doit PAS apparaître dans GET /api/reviews/user/{id}")
                .doesNotContain(revieweeEmail);
    }

    // ------------------------------------------------------------------ //
    //  R6c — jsonPath récursif : aucun champ PII/sécurité                  //
    // ------------------------------------------------------------------ //

    @Test
    @DisplayName("R6-05 : Aucun champ 'phone' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoPhoneField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..phone").isEmpty());
    }

    @Test
    @DisplayName("R6-06 : Aucun champ 'email' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoEmailField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..email").isEmpty());
    }

    @Test
    @DisplayName("R6-07 : Aucun champ 'address' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoAddressField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..address").isEmpty());
    }

    @Test
    @DisplayName("R6-08 : Aucun champ 'role' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoRoleField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..role").isEmpty());
    }

    @Test
    @DisplayName("R6-09 : Aucun champ 'isSuspended' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoIsSuspendedField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..isSuspended").isEmpty());
    }

    @Test
    @DisplayName("R6-10 : Aucun champ 'mustChangePassword' dans les avis (jsonPath récursif)")
    void reviews_JsonPath_NoMustChangePasswordField() throws Exception {
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..mustChangePassword").isEmpty());
    }

    // ------------------------------------------------------------------ //
    //  R6d — Positifs : champs non-PII attendus                            //
    // ------------------------------------------------------------------ //

    @Test
    @DisplayName("R6-11 : Les avis contiennent reviewerName, rating, comment si des avis existent")
    void reviews_Contains_ExpectedFields() throws Exception {
        Assumptions.assumeTrue(hasReviews, "Pas d'avis en base — test skipé");
        mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].rating").exists())
                .andExpect(jsonPath("$.data[0].reviewerName").exists());
    }

    @Test
    @DisplayName("R6-12 : reviewerName est un nom complet, sans numéro de téléphone")
    void reviews_ReviewerName_DoesNotContainPhone() throws Exception {
        Assumptions.assumeTrue(hasReviews && reviewerPhone != null,
                "Pas d'avis en base — test skipé");
        MvcResult result = mockMvc.perform(get("/api/reviews/user/" + revieweeId))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString())
                .doesNotContain(reviewerPhone);
    }
}
