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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SEC-12 : Tests de sécurité sur le plafonnement de la pagination et la validation du tri.
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Quand une page dépasse la taille maximale autorisée (100), elle est refusée avec HTTP 400.</li>
 *   <li>Une taille de page par défaut est appliquée quand elle n'est pas fournie.</li>
 *   <li>Le tri n'accepte que des champs d'une liste autorisée ; tout autre champ est refusé avec HTTP 400.</li>
 *   <li>Les valeurs négatives ou nulles pour la pagination (page < 0, size <= 0) sont refusées avec HTTP 400.</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PaginationAndSortingSecurityTest {

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
                .phone("+22177" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("User" + salt)
                .lastName("Normal")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .isSuspended(false)
                .build());
        userToken = jwtUtil.generateToken(standardUser, standardUser.getId(), standardUser.getRole().name(), standardUser.getFullName());

        User adminUser = userRepository.save(User.builder()
                .phone("+22178" + (1000000 + (int) (Math.random() * 8999999)))
                .firstName("Admin" + salt)
                .lastName("Security")
                .password(passwordEncoder.encode("AdminSecret123!"))
                .role(Role.ROLE_ADMIN)
                .isVerified(true)
                .isSuspended(false)
                .build());
        adminToken = jwtUtil.generateToken(adminUser, adminUser.getId(), adminUser.getRole().name(), adminUser.getFullName());
    }

    // =========================================================================
    // 1. TESTS UNITAIRES SUR LE VALIDATEUR DE PAGINATION (PaginationValidator)
    // =========================================================================
    @Nested
    @DisplayName("1. Tests unitaires de PaginationValidator")
    class ValidatorUnitTests {

        @Test
        @DisplayName("Paramètres valides créent un Pageable correct")
        void validParametersCreatePageable() {
            Pageable pageable = PaginationValidator.validateAndCreate(
                    0, 20, "price", "asc",
                    PaginationValidator.PRODUCT_SORT_FIELDS, "createdAt", Sort.Direction.DESC
            );

            assertThat(pageable.getPageNumber()).isEqualTo(0);
            assertThat(pageable.getPageSize()).isEqualTo(20);
            assertThat(pageable.getSort().getOrderFor("price")).isNotNull();
            assertThat(pageable.getSort().getOrderFor("price").getDirection()).isEqualTo(Sort.Direction.ASC);
        }

        @Test
        @DisplayName("Taille de page limite maximale (100) est acceptée")
        void maximumPageSizeAccepted() {
            Pageable pageable = PaginationValidator.validateAndCreate(
                    5, 100, null, null,
                    PaginationValidator.PRODUCT_SORT_FIELDS, "createdAt", Sort.Direction.DESC
            );

            assertThat(pageable.getPageNumber()).isEqualTo(5);
            assertThat(pageable.getPageSize()).isEqualTo(100);
        }

        @Test
        @DisplayName("Taille de page minimale (1) est acceptée")
        void minimumPageSizeAccepted() {
            Pageable pageable = PaginationValidator.validateAndCreate(
                    0, 1, null, null,
                    PaginationValidator.PRODUCT_SORT_FIELDS, "createdAt", Sort.Direction.DESC
            );

            assertThat(pageable.getPageSize()).isEqualTo(1);
        }

        @ParameterizedTest
        @ValueSource(ints = {-1, -5, -100})
        @DisplayName("Numéro de page négatif lève une IllegalArgumentException")
        void negativePageThrowsException(int invalidPage) {
            assertThatThrownBy(() -> PaginationValidator.validatePage(invalidPage))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Le numéro de page ne peut pas être négatif");
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, -50})
        @DisplayName("Taille de page inférieure ou égale à zéro lève une IllegalArgumentException")
        void zeroOrNegativeSizeThrowsException(int invalidSize) {
            assertThatThrownBy(() -> PaginationValidator.validateSize(invalidSize))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("La taille de page doit être supérieure ou égale à 1");
        }

        @ParameterizedTest
        @ValueSource(ints = {101, 150, 1000, 100000})
        @DisplayName("Taille de page supérieure à 100 lève une IllegalArgumentException")
        void oversizedSizeThrowsException(int oversized) {
            assertThatThrownBy(() -> PaginationValidator.validateSize(oversized))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("La taille de page ne peut pas dépasser la limite maximale de 100");
        }

        @ParameterizedTest
        @ValueSource(strings = {"passwordHash", "verificationToken", "seller.password", "1=1", "id", "randomField"})
        @DisplayName("Champ de tri non autorisé lève une IllegalArgumentException")
        void forbiddenSortFieldThrowsException(String forbiddenField) {
            assertThatThrownBy(() -> PaginationValidator.validateSortField(forbiddenField, PaginationValidator.PRODUCT_SORT_FIELDS))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Champ de tri non autorisé");
        }

        @ParameterizedTest
        @ValueSource(strings = {"invalid", "hack", "ASC; DROP TABLE", "123"})
        @DisplayName("Direction de tri invalide lève une IllegalArgumentException")
        void invalidSortDirectionThrowsException(String invalidDir) {
            assertThatThrownBy(() -> PaginationValidator.validateSortDirection(invalidDir))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Direction de tri invalide");
        }

        @Test
        @DisplayName("Format combiné champ,direction (ex: price,asc) est correctement parsé")
        void combinedSortFieldParsed() {
            Pageable pageable = PaginationValidator.validateAndCreate(
                    0, 20, "price,asc", null,
                    PaginationValidator.PRODUCT_SORT_FIELDS, "createdAt", Sort.Direction.DESC
            );

            assertThat(pageable.getSort().getOrderFor("price")).isNotNull();
            assertThat(pageable.getSort().getOrderFor("price").getDirection()).isEqualTo(Sort.Direction.ASC);
        }
    }

    // =========================================================================
    // 2. TESTS HTTP SUR LE CATALOGUE PUBLIC (/api/products)
    // =========================================================================
    @Nested
    @DisplayName("2. Sécurité pagination sur /api/products")
    class ProductCatalogPaginationTests {

        @Test
        @DisplayName("Dépassement de la taille maximale (limit=101) retourne HTTP 400")
        void oversizedLimitReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("limit", "101"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("limite maximale de 100")));
        }

        @Test
        @DisplayName("Taille nulle ou négative (limit=0) retourne HTTP 400")
        void zeroLimitReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("limit", "0"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("supérieure ou égale à 1")));
        }

        @Test
        @DisplayName("Numéro de page négatif (page=-1) retourne HTTP 400")
        void negativePageReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("page", "-1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("ne peut pas être négatif")));
        }

        @Test
        @DisplayName("Tentative de tri sur champ sensible interne (sortBy=passwordHash) retourne HTTP 400")
        void sortOnSensitiveFieldReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("sortBy", "passwordHash"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Champ de tri non autorisé")));
        }

        @Test
        @DisplayName("Tentative de tri sur champ inconnu (sortBy=internalSecret) retourne HTTP 400")
        void sortOnUnknownFieldReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("sortBy", "internalSecret"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Champ de tri non autorisé")));
        }

        @Test
        @DisplayName("Direction de tri invalide (sortDir=hacked) retourne HTTP 400")
        void invalidSortDirReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("sortDir", "hacked"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Direction de tri invalide")));
        }

        @Test
        @DisplayName("Requête avec paramètres de tri et pagination valides retourne HTTP 200")
        void validPaginationAndSortReturnsOk() throws Exception {
            mockMvc.perform(get("/api/products")
                            .param("page", "0")
                            .param("limit", "20")
                            .param("sortBy", "price")
                            .param("sortDir", "asc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // =========================================================================
    // 3. TESTS HTTP SUR L'ESPACE ADMIN (/api/admin/**)
    // =========================================================================
    @Nested
    @DisplayName("3. Sécurité pagination sur /api/admin/**")
    class AdminPaginationTests {

        @Test
        @DisplayName("Admin /users avec taille excessive (size=500) retourne HTTP 400")
        void adminUsersOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("size", "500"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("limite maximale de 100")));
        }

        @Test
        @DisplayName("Admin /users avec page négative (page=-2) retourne HTTP 400")
        void adminUsersNegativePageReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "-2"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin /users avec tri sur champ sensible (sortBy=passwordHash) retourne HTTP 400")
        void adminUsersSensitiveSortReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("sortBy", "passwordHash"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Champ de tri non autorisé")));
        }

        @Test
        @DisplayName("Admin /orders avec taille excessive (size=101) retourne HTTP 400")
        void adminOrdersOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/orders")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("size", "101"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin /orders avec champ de tri inconnu retourne HTTP 400")
        void adminOrdersUnknownSortReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/orders")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("sortBy", "creditCardNumber"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin /payments avec taille excessive (size=200) retourne HTTP 400")
        void adminPaymentsOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/payments")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("size", "200"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin /cms/pages avec tri non autorisé retourne HTTP 400")
        void adminCmsPagesForbiddenSortReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/admin/cms/pages")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("sortBy", "secretContent"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin /cms/pages avec tri autorisé retourne HTTP 200")
        void adminCmsPagesAllowedSortReturnsOk() throws Exception {
            mockMvc.perform(get("/api/admin/cms/pages")
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "15")
                            .param("sortBy", "sortOrder")
                            .param("sortDir", "asc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // =========================================================================
    // 4. TESTS HTTP SUR LES COMMANDES UTILISATEUR (/api/orders/my-orders)
    // =========================================================================
    @Nested
    @DisplayName("4. Sécurité pagination sur /api/orders/my-orders")
    class UserOrdersPaginationTests {

        @Test
        @DisplayName("Utilisateur avec taille de page excessive (size=200) retourne HTTP 400")
        void userOrdersOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/orders/my-orders")
                            .header("Authorization", "Bearer " + userToken)
                            .param("size", "200"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Utilisateur avec numéro de page négatif (page=-1) retourne HTTP 400")
        void userOrdersNegativePageReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/orders/my-orders")
                            .header("Authorization", "Bearer " + userToken)
                            .param("page", "-1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Utilisateur avec champ de tri non autorisé retourne HTTP 400")
        void userOrdersInvalidSortReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/orders/my-orders")
                            .header("Authorization", "Bearer " + userToken)
                            .param("sortBy", "buyer.passwordHash"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    // =========================================================================
    // 5. TESTS HTTP SUR L'ESPACE VENDEUR (/api/seller/**)
    // =========================================================================
    @Nested
    @DisplayName("5. Sécurité pagination sur /api/seller/**")
    class SellerPaginationTests {

        @Test
        @DisplayName("Vendeur /products avec taille excessive (size=150) retourne HTTP 400")
        void sellerProductsOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/seller/products")
                            .header("Authorization", "Bearer " + userToken)
                            .param("size", "150"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Vendeur /products avec champ de tri non autorisé retourne HTTP 400")
        void sellerProductsInvalidSortReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/seller/products")
                            .header("Authorization", "Bearer " + userToken)
                            .param("sortBy", "seller.passwordHash"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Vendeur /transactions avec taille excessive (size=101) retourne HTTP 400")
        void sellerTransactionsOversizedReturnsBadRequest() throws Exception {
            mockMvc.perform(get("/api/seller/transactions")
                            .header("Authorization", "Bearer " + userToken)
                            .param("size", "101"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }
}
