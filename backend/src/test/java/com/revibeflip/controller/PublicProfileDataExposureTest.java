package com.revibeflip.controller;

import com.revibeflip.entity.User;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.UserRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.test.context.support.WithMockUser;

/**
 * SEC-01 — Tests de non-régression : exposition de données privées sur les endpoints publics.
 *
 * <p>Ces tests DOIVENT ÉCHOUER tant que {@code PublicUserDto} n'est pas implémenté.
 * Ils vérifient que les champs PII/méta-sécurité suivants ne transitent PAS
 * dans les réponses publiques (sans authentification) :
 * <ul>
 *   <li>{@code phone}</li>
 *   <li>{@code email}</li>
 *   <li>{@code address}</li>
 *   <li>{@code role}</li>
 *   <li>{@code isSuspended}</li>
 *   <li>{@code mustChangePassword}</li>
 * </ul>
 *
 * <p>Endpoints couverts :
 * <ul>
 *   <li>GET /api/users/{id}        — profil public (R1)</li>
 *   <li>GET /api/products          — catalogue (R2 — seller embarqué)</li>
 *   <li>GET /api/products/{id}     — fiche produit (R2 — seller embarqué)</li>
 *   <li>POST /api/reports          — signalement (R3 — reportedUser embarqué)</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PublicProfileDataExposureTest {

    // ------------------------------------------------------------------ //
    //  Dépendances Spring                                                  //
    // ------------------------------------------------------------------ //

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    /** SmsProvider mocké pour ne pas déclencher d'appels SMS réels pendant les tests. */
    @MockitoBean private SmsProvider smsProvider;
    /** PaymentGateway mocké pour ne pas déclencher d'appels réseau réels. */
    @MockitoBean private PaymentGateway paymentGateway;

    // ------------------------------------------------------------------ //
    //  Fixtures partagées                                                  //
    // ------------------------------------------------------------------ //

    /** Téléphone du vendeur de test — valeur PII qui NE DOIT PAS apparaître en public. */
    private static final String SELLER_PHONE   = "+221799000111";
    /** E-mail du vendeur de test — valeur PII qui NE DOIT PAS apparaître en public. */
    private static final String SELLER_EMAIL   = "sec01.vendeur@revibeflip.test";
    /** Adresse du vendeur de test — valeur PII qui NE DOIT PAS apparaître en public. */
    private static final String SELLER_ADDRESS = "5 Rue de la Sécurité, Dakar, Sénégal";
    /** Téléphone de l'utilisateur cible d'un signalement — NE DOIT PAS fuiter. */
    private static final String TARGET_PHONE   = "+221799000222";
    /** E-mail de la cible du signalement — NE DOIT PAS fuiter. */
    private static final String TARGET_EMAIL   = "sec01.cible@revibeflip.test";
    /** Téléphone du reporter — utilisé pour l'authentification lors du signalement. */
    private static final String REPORTER_PHONE = "+221799000333";

    private Long sellerId;
    private Long productId;
    private Long targetUserId;

    @BeforeEach
    void setUpFixtures() {
        // --- Vendeur (seller) ---
        User seller = userRepository.findByPhone(SELLER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(SELLER_PHONE)
                        .email(SELLER_EMAIL)
                        .address(SELLER_ADDRESS)
                        .firstName("VendeurSEC")
                        .lastName("Test")
                        .password(passwordEncoder.encode("SecTest123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .mustChangePassword(false)
                        .build())
        );
        sellerId = seller.getId();

        // --- Produit actif de ce vendeur ---
        Product existingProduct = productRepository
                .findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .findFirst()
                .orElse(null);

        if (existingProduct == null) {
            Category cat = categoryRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "Aucune catégorie présente en base — le DataInitializer doit s'être exécuté"));
            Product newProduct = productRepository.save(Product.builder()
                    .seller(seller)
                    .category(cat)
                    .title("Robe SEC-01 Test")
                    .description("Produit de test pour l'audit sécurité SEC-01")
                    .price(new BigDecimal("12000"))
                    .condition(ProductCondition.GOOD)
                    .status(ProductStatus.ACTIVE)
                    .build());
            productId = newProduct.getId();
        } else {
            productId = existingProduct.getId();
        }

        // --- Utilisateur cible du signalement ---
        User target = userRepository.findByPhone(TARGET_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(TARGET_PHONE)
                        .email(TARGET_EMAIL)
                        .firstName("CibleSEC")
                        .lastName("Test")
                        .password(passwordEncoder.encode("SecTest123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .mustChangePassword(false)
                        .build())
        );
        targetUserId = target.getId();

        // --- Reporter (authentifié pour POST /api/reports) ---
        userRepository.findByPhone(REPORTER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(REPORTER_PHONE)
                        .email("sec01.reporter@revibeflip.test")
                        .firstName("ReporterSEC")
                        .lastName("Test")
                        .password(passwordEncoder.encode("SecTest123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .mustChangePassword(false)
                        .build())
        );
    }

    // ================================================================== //
    //  R1 — GET /api/users/{id}  (endpoint public)                        //
    // ================================================================== //

    @Nested
    @DisplayName("R1 — GET /api/users/{id} : profil public ne doit pas exposer les PII")
    class R1_PublicUserProfile {

        @Test
        @DisplayName("R1-01 : Réponse 200 sans token (endpoint effectivement public)")
        void publicProfile_Returns200_WhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andDo(print())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("R1-02 : Le corps brut ne contient pas le numéro de téléphone du vendeur")
        void publicProfile_BodyDoesNotContainPhone() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            // Vérifie que la valeur littérale du téléphone n'est pas dans la réponse JSON
            assertThat(body)
                    .as("Le numéro de téléphone du vendeur (%s) ne doit PAS apparaître dans GET /api/users/{id}", SELLER_PHONE)
                    .doesNotContain(SELLER_PHONE);
        }

        @Test
        @DisplayName("R1-03 : Le corps brut ne contient pas l'e-mail du vendeur")
        void publicProfile_BodyDoesNotContainEmail() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'e-mail du vendeur (%s) ne doit PAS apparaître dans GET /api/users/{id}", SELLER_EMAIL)
                    .doesNotContain(SELLER_EMAIL);
        }

        @Test
        @DisplayName("R1-04 : Le corps brut ne contient pas l'adresse du vendeur")
        void publicProfile_BodyDoesNotContainAddress() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'adresse du vendeur ne doit PAS apparaître dans GET /api/users/{id}")
                    .doesNotContain(SELLER_ADDRESS);
        }

        @Test
        @DisplayName("R1-05 : Le champ JSON 'phone' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_PhoneFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.phone").doesNotExist());
        }

        @Test
        @DisplayName("R1-06 : Le champ JSON 'email' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_EmailFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.email").doesNotExist());
        }

        @Test
        @DisplayName("R1-07 : Le champ JSON 'address' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_AddressFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.address").doesNotExist());
        }

        @Test
        @DisplayName("R1-08 : Le champ JSON 'role' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_RoleFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").doesNotExist());
        }

        @Test
        @DisplayName("R1-09 : Le champ JSON 'isSuspended' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_IsSuspendedFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isSuspended").doesNotExist());
        }

        @Test
        @DisplayName("R1-10 : Le champ JSON 'mustChangePassword' est absent de la réponse (jsonPath)")
        void publicProfile_JsonPath_MustChangePasswordFieldAbsent() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.mustChangePassword").doesNotExist());
        }
    }

    // ================================================================== //
    //  R2 — GET /api/products  (catalogue public — seller embarqué)       //
    // ================================================================== //

    @Nested
    @DisplayName("R2a — GET /api/products : catalogue public — seller ne doit pas exposer ses PII")
    class R2a_ProductCatalog {

        @Test
        @DisplayName("R2a-01 : Le corps brut du catalogue ne contient pas le téléphone du vendeur")
        void catalog_BodyDoesNotContainSellerPhone() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("Le téléphone du vendeur (%s) ne doit PAS apparaître dans GET /api/products", SELLER_PHONE)
                    .doesNotContain(SELLER_PHONE);
        }

        @Test
        @DisplayName("R2a-02 : Le corps brut du catalogue ne contient pas l'e-mail du vendeur")
        void catalog_BodyDoesNotContainSellerEmail() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'e-mail du vendeur (%s) ne doit PAS apparaître dans GET /api/products", SELLER_EMAIL)
                    .doesNotContain(SELLER_EMAIL);
        }

        @Test
        @DisplayName("R2a-03 : Le corps brut du catalogue ne contient pas l'adresse du vendeur")
        void catalog_BodyDoesNotContainSellerAddress() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'adresse du vendeur ne doit PAS apparaître dans GET /api/products")
                    .doesNotContain(SELLER_ADDRESS);
        }

        @Test
        @DisplayName("R2a-04 : Aucun objet seller dans le catalogue ne contient le champ 'phone' (jsonPath récursif)")
        void catalog_JsonPath_NoSellerPhoneField() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    // jsonPath("$..phone") doit être vide : aucun champ 'phone' imbriqué nulle part
                    .andExpect(jsonPath("$..phone").isEmpty());
        }

        @Test
        @DisplayName("R2a-05 : Aucun objet seller dans le catalogue ne contient le champ 'email' (jsonPath récursif)")
        void catalog_JsonPath_NoSellerEmailField() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$..email").isEmpty());
        }

        @Test
        @DisplayName("R2a-06 : Aucun objet seller dans le catalogue ne contient le champ 'role' (jsonPath récursif)")
        void catalog_JsonPath_NoSellerRoleField() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$..role").isEmpty());
        }

        @Test
        @DisplayName("R2a-07 : Aucun objet seller ne contient 'isSuspended' (jsonPath récursif)")
        void catalog_JsonPath_NoSellerIsSuspendedField() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$..isSuspended").isEmpty());
        }

        @Test
        @DisplayName("R2a-08 : Aucun objet seller ne contient 'mustChangePassword' (jsonPath récursif)")
        void catalog_JsonPath_NoSellerMustChangePasswordField() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$..mustChangePassword").isEmpty());
        }
    }

    // ================================================================== //
    //  R2 — GET /api/products/{id}  (fiche produit — seller embarqué)     //
    // ================================================================== //

    @Nested
    @DisplayName("R2b — GET /api/products/{id} : fiche produit — seller ne doit pas exposer ses PII")
    class R2b_ProductDetail {

        @Test
        @DisplayName("R2b-01 : Le corps brut de la fiche ne contient pas le téléphone du vendeur")
        void productDetail_BodyDoesNotContainSellerPhone() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("Le téléphone du vendeur (%s) ne doit PAS apparaître dans GET /api/products/{id}", SELLER_PHONE)
                    .doesNotContain(SELLER_PHONE);
        }

        @Test
        @DisplayName("R2b-02 : Le corps brut de la fiche ne contient pas l'e-mail du vendeur")
        void productDetail_BodyDoesNotContainSellerEmail() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'e-mail du vendeur (%s) ne doit PAS apparaître dans GET /api/products/{id}", SELLER_EMAIL)
                    .doesNotContain(SELLER_EMAIL);
        }

        @Test
        @DisplayName("R2b-03 : Le corps brut de la fiche ne contient pas l'adresse du vendeur")
        void productDetail_BodyDoesNotContainSellerAddress() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'adresse du vendeur ne doit PAS apparaître dans GET /api/products/{id}")
                    .doesNotContain(SELLER_ADDRESS);
        }

        @Test
        @DisplayName("R2b-04 : Le champ seller.phone est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerPhoneAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.phone").doesNotExist());
        }

        @Test
        @DisplayName("R2b-05 : Le champ seller.email est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerEmailAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.email").doesNotExist());
        }

        @Test
        @DisplayName("R2b-06 : Le champ seller.address est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerAddressAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.address").doesNotExist());
        }

        @Test
        @DisplayName("R2b-07 : Le champ seller.role est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerRoleAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.role").doesNotExist());
        }

        @Test
        @DisplayName("R2b-08 : Le champ seller.isSuspended est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerIsSuspendedAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.isSuspended").doesNotExist());
        }

        @Test
        @DisplayName("R2b-09 : Le champ seller.mustChangePassword est absent de la fiche produit (jsonPath)")
        void productDetail_JsonPath_SellerMustChangePasswordAbsent() throws Exception {
            mockMvc.perform(get("/api/products/" + productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.seller.mustChangePassword").doesNotExist());
        }
    }

    // ================================================================== //
    //  R3 — POST /api/reports  (réponse expose reportedUser)              //
    // ================================================================== //

    @Nested
    @DisplayName("R3 — POST /api/reports : la réponse ne doit pas exposer les PII de l'utilisateur signalé")
    class R3_ReportResponse {

        /**
         * Génère un JWT valide pour le reporter en appelant POST /api/auth/login.
         * On utilise le seeder de dev ou la fixture créée dans @BeforeEach.
         */
        private String loginAndGetToken(String phone, String password) throws Exception {
            String loginBody = String.format(
                    "{\"identifier\":\"%s\",\"password\":\"%s\"}", phone, password);

            MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();

            String loginResponse = loginResult.getResponse().getContentAsString();
            // Extraire le token de la réponse JSON {"data":{"token":"...",...}}
            // On utilise une extraction simple par regex pour rester sans dépendance Jackson dans le test
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("\"token\"\\s*:\\s*\"([^\"]+)\"")
                    .matcher(loginResponse);
            if (m.find()) {
                return m.group(1);
            }
            throw new IllegalStateException(
                    "Token introuvable dans la réponse de login : " + loginResponse);
        }

        @Test
        @DisplayName("R3-01 : Le corps brut de la réponse ne contient pas le téléphone de la cible")
        void reportResponse_BodyDoesNotContainTargetPhone() throws Exception {
            String token = loginAndGetToken(REPORTER_PHONE, "SecTest123!");

            String reportBody = String.format(
                    "{\"reportedUserId\":%d,\"reason\":\"FAKE_PROFILE\",\"details\":\"Test SEC-01\"}",
                    targetUserId);

            MvcResult result = mockMvc.perform(post("/api/reports")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(reportBody))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("Le téléphone de la cible (%s) ne doit PAS apparaître dans la réponse de POST /api/reports", TARGET_PHONE)
                    .doesNotContain(TARGET_PHONE);
        }

        @Test
        @DisplayName("R3-02 : Le corps brut de la réponse ne contient pas l'e-mail de la cible")
        void reportResponse_BodyDoesNotContainTargetEmail() throws Exception {
            String token = loginAndGetToken(REPORTER_PHONE, "SecTest123!");

            String reportBody = String.format(
                    "{\"reportedUserId\":%d,\"reason\":\"FAKE_PROFILE\",\"details\":\"Test SEC-01 email\"}",
                    targetUserId);

            MvcResult result = mockMvc.perform(post("/api/reports")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(reportBody))
                    .andExpect(status().isOk())
                    .andReturn();

            String body = result.getResponse().getContentAsString();
            assertThat(body)
                    .as("L'e-mail de la cible (%s) ne doit PAS apparaître dans la réponse de POST /api/reports", TARGET_EMAIL)
                    .doesNotContain(TARGET_EMAIL);
        }

        @Test
        @DisplayName("R3-03 : Le champ reportedUser.phone est absent de la réponse (jsonPath)")
        void reportResponse_JsonPath_ReportedUserPhoneAbsent() throws Exception {
            String token = loginAndGetToken(REPORTER_PHONE, "SecTest123!");

            String reportBody = String.format(
                    "{\"reportedUserId\":%d,\"reason\":\"SCAM\",\"details\":\"Test SEC-01 jsonpath\"}",
                    targetUserId);

            mockMvc.perform(post("/api/reports")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(reportBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.reportedUser.phone").doesNotExist());
        }

        @Test
        @DisplayName("R3-04 : Le champ reportedUser.email est absent de la réponse (jsonPath)")
        void reportResponse_JsonPath_ReportedUserEmailAbsent() throws Exception {
            String token = loginAndGetToken(REPORTER_PHONE, "SecTest123!");

            String reportBody = String.format(
                    "{\"reportedUserId\":%d,\"reason\":\"SCAM\",\"details\":\"Test SEC-01 email jsonpath\"}",
                    targetUserId);

            mockMvc.perform(post("/api/reports")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(reportBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.reportedUser.email").doesNotExist());
        }

        @Test
        @DisplayName("R3-05 : Les champs role, isSuspended, mustChangePassword sont absents pour reporter ET reportedUser")
        void reportResponse_JsonPath_SensitiveMetaFieldsAbsent() throws Exception {
            String token = loginAndGetToken(REPORTER_PHONE, "SecTest123!");

            String reportBody = String.format(
                    "{\"reportedUserId\":%d,\"reason\":\"ABUSIVE_BEHAVIOR\",\"details\":\"Test SEC-01 meta\"}",
                    targetUserId);

            mockMvc.perform(post("/api/reports")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(reportBody))
                    .andExpect(status().isOk())
                    // Vérifie l'absence récursive dans toute la réponse
                    .andExpect(jsonPath("$..role").isEmpty())
                    .andExpect(jsonPath("$..isSuspended").isEmpty())
                    .andExpect(jsonPath("$..mustChangePassword").isEmpty());
        }
    }

    // ================================================================== //
    //  TESTS POSITIFS                                                      //
    //  - Profil public : champs attendus présents                          //
    //  - Suspendu / inexistant → 404                                       //
    //  - GET /api/auth/me → profil complet pour l'utilisateur connecté    //
    //  - Admin /api/admin/users → profil complet, refusé à ROLE_USER      //
    // ================================================================== //

    @Nested
    @DisplayName("Positifs — GET /api/users/{id} contient les champs attendus")
    class Positive_PublicProfileFields {

        @Test
        @DisplayName("P-01 : fullName est présent dans le profil public")
        void publicProfile_Contains_FullName() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.fullName").exists())
                    .andExpect(jsonPath("$.data.fullName").isNotEmpty());
        }

        @Test
        @DisplayName("P-02 : rating est présent dans le profil public")
        void publicProfile_Contains_Rating() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.rating").exists());
        }

        @Test
        @DisplayName("P-03 : reviewCount est présent dans le profil public")
        void publicProfile_Contains_ReviewCount() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.reviewCount").exists());
        }

        @Test
        @DisplayName("P-04 : trustScore est présent dans le profil public")
        void publicProfile_Contains_TrustScore() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.trustScore").exists());
        }

        @Test
        @DisplayName("P-05 : isVerified est présent dans le profil public")
        void publicProfile_Contains_IsVerified() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isVerified").exists());
        }

        @Test
        @DisplayName("P-06 : id est présent et correspond à l'utilisateur demandé")
        void publicProfile_Contains_Id() throws Exception {
            mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(sellerId));
        }

        @Test
        @DisplayName("P-07 : le nom du vendeur est bien présent dans la réponse")
        void publicProfile_FullName_MatchesSeller() throws Exception {
            MvcResult res = mockMvc.perform(get("/api/users/" + sellerId))
                    .andExpect(status().isOk())
                    .andReturn();
            assertThat(res.getResponse().getContentAsString()).contains("VendeurSEC");
        }
    }

    @Nested
    @DisplayName("Positifs — GET /api/users/{id} : 404 pour comptes inexistants ou suspendus")
    class Positive_404Cases {

        @Test
        @DisplayName("P-08 : Utilisateur inexistant renvoie 404")
        void publicProfile_Returns404_WhenUserNotFound() throws Exception {
            mockMvc.perform(get("/api/users/999999999"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("P-09 : Utilisateur suspendu renvoie 404 (profil masqué)")
        void publicProfile_Returns404_WhenUserSuspended() throws Exception {
            final String SUSPENDED_PHONE = "+221799000444";
            User suspended = userRepository.findByPhone(SUSPENDED_PHONE).orElseGet(() ->
                    userRepository.save(User.builder()
                            .phone(SUSPENDED_PHONE)
                            .email("sec01.suspended@revibeflip.test")
                            .firstName("SuspendedSEC")
                            .lastName("Test")
                            .password(passwordEncoder.encode("SecTest123!"))
                            .role(Role.ROLE_USER)
                            .isVerified(true)
                            .isSuspended(true)
                            .mustChangePassword(false)
                            .build())
            );
            if (!Boolean.TRUE.equals(suspended.getIsSuspended())) {
                suspended.setIsSuspended(true);
                userRepository.save(suspended);
            }
            mockMvc.perform(get("/api/users/" + suspended.getId()))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Positifs — GET /api/auth/me : profil complet pour l'utilisateur connecté")
    class Positive_AuthMe {

        @Test
        @DisplayName("P-10 : /api/auth/me renvoie phone/email/role pour l'utilisateur connecté")
        void authMe_Returns_FullProfile_ForAuthenticatedUser() throws Exception {
            String loginBody = String.format(
                    "{\"identifier\":\"%s\",\"password\":\"%s\"}", REPORTER_PHONE, "SecTest123!");
            MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();
            String loginResponse = loginResult.getResponse().getContentAsString();
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("\"token\"\\s*:\\s*\"([^\"]+)\"")
                    .matcher(loginResponse);
            if (!m.find()) throw new IllegalStateException("Token introuvable: " + loginResponse);
            String token = m.group(1);

            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.phone").exists())
                    .andExpect(jsonPath("$.data.email").exists())
                    .andExpect(jsonPath("$.data.role").exists());
        }

        @Test
        @DisplayName("P-11 : /api/auth/me est refusé sans authentification (401)")
        void authMe_Returns401_WhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Positifs — Admin /api/admin/users : profil complet pour admin, refusé à ROLE_USER")
    class Positive_AdminUsers {

        @Test
        @DisplayName("P-12 : /api/admin/users est refusé à un utilisateur normal (403)")
        @WithMockUser(username = "+221799000333", roles = {"USER"})
        void adminUsers_Returns403_ForNormalUser() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("P-13 : /api/admin/users renvoie phone/email/role pour un admin authentifié")
        void adminUsers_Returns_FullProfile_ForAdmin() throws Exception {
            // Création d'un admin de test si inexistant
            final String ADMIN_TEST_PHONE = "+221799000555";
            userRepository.findByPhone(ADMIN_TEST_PHONE).orElseGet(() ->
                    userRepository.save(User.builder()
                            .phone(ADMIN_TEST_PHONE)
                            .email("sec01.admin@revibeflip.test")
                            .firstName("AdminSEC")
                            .lastName("Test")
                            .password(passwordEncoder.encode("SecTest123!"))
                            .role(Role.ROLE_ADMIN)
                            .isVerified(true)
                            .isSuspended(false)
                            .mustChangePassword(false)
                            .build())
            );

            String loginBody = String.format(
                    "{\"identifier\":\"%s\",\"password\":\"%s\"}", ADMIN_TEST_PHONE, "SecTest123!");
            MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();
            String loginResponse = loginResult.getResponse().getContentAsString();
            java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("\"token\"\\s*:\\s*\"([^\"]+)\"")
                    .matcher(loginResponse);
            if (!m.find()) throw new IllegalStateException("Token admin introuvable: " + loginResponse);
            String token = m.group(1);

            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content[0].phone").exists())
                    .andExpect(jsonPath("$.data.content[0].email").exists())
                    .andExpect(jsonPath("$.data.content[0].role").exists());
        }
    }
}
