package com.revibeflip.security;

import com.revibeflip.dto.UpdateProductRequest;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.service.ProductModificationPolicyService;
import com.revibeflip.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * SEC-07 : Tests unitaires de sécurité pour l'harmonisation des règles de modification d'annonce (US-08).
 *
 * <p>Critères d'acceptation :
 * <ul>
 *   <li>Seul le propriétaire ou un administrateur peut modifier l'annonce (HTTP 403 sinon).</li>
 *   <li>Modification acceptée uniquement pour les statuts DRAFT, ACTIVE et INACTIVE.</li>
 *   <li>Refus (HTTP 409) si l'annonce est SOLD ou RESERVED.</li>
 *   <li>Refus (HTTP 409) de changer le prix et les champs clés si une commande est en cours.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class ProductModificationSecurityTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ProductModificationPolicyService policyService;

    private User owner;
    private User otherUser;
    private User admin;
    private Category category1;
    private Category category2;
    private Product product;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(10L).phone("+221770000001").role(Role.ROLE_USER).build();
        otherUser = User.builder().id(20L).phone("+221770000002").role(Role.ROLE_USER).build();
        admin = User.builder().id(99L).phone("+221770000099").role(Role.ROLE_ADMIN).build();

        category1 = Category.builder().id(1L).name("Mode").build();
        category2 = Category.builder().id(2L).name("Tech").build();

        product = Product.builder()
                .id(100L)
                .title("Sneakers Nike Air")
                .description("Très bon état")
                .price(BigDecimal.valueOf(25000))
                .condition(ProductCondition.VERY_GOOD)
                .category(category1)
                .status(ProductStatus.ACTIVE)
                .seller(owner)
                .build();
    }

    @Nested
    @DisplayName("1. Règle d'autorisation (Propriétaire vs Admin vs Tiers)")
    class AuthorizationRules {

        @Test
        @DisplayName("Le propriétaire légitime peut modifier son annonce")
        void testOwnerCanModify() {
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(false);

            assertThatCode(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Sneakers Nike Air", 1L, ProductCondition.VERY_GOOD
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("L'administrateur peut modifier l'annonce de n'importe quel vendeur")
        void testAdminCanModifyAnyProduct() {
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(false);

            assertThatCode(() -> policyService.validateProductModification(
                    product, admin, BigDecimal.valueOf(25000), "Sneakers Nike Air (Modéré)", 1L, ProductCondition.VERY_GOOD
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Un tiers non propriétaire et non admin est rejeté avec AccessDeniedException (403)")
        void testOtherUserCannotModify() {
            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, otherUser, BigDecimal.valueOf(25000), "Piratage Titre", 1L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Vous n'êtes pas autorisé à modifier cette annonce.");
        }
    }

    @Nested
    @DisplayName("2. Statuts autorisés et refusés (SOLD / RESERVED)")
    class StatusRules {

        @ParameterizedTest
        @EnumSource(value = ProductStatus.class, names = {"DRAFT", "ACTIVE", "INACTIVE"})
        @DisplayName("Modification autorisée pour les statuts DRAFT, ACTIVE et INACTIVE")
        void testModificationAllowedForDraftActiveInactive(ProductStatus status) {
            product.setStatus(status);
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(false);

            assertThatCode(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Titre Modifié", 1L, ProductCondition.VERY_GOOD
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Modification refusée (HTTP 409) si l'annonce est SOLD")
        void testModificationRejectedIfSold() {
            product.setStatus(ProductStatus.SOLD);

            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Titre Modifié", 1L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier une annonce au statut SOLD.");
        }

        @Test
        @DisplayName("Modification refusée (HTTP 409) si l'annonce est RESERVED")
        void testModificationRejectedIfReserved() {
            product.setStatus(ProductStatus.RESERVED);

            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Titre Modifié", 1L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier une annonce au statut RESERVED.");
        }

        @Test
        @DisplayName("Changement de statut interdit si l'annonce est SOLD ou RESERVED")
        void testToggleStatusForbiddenIfSoldOrReserved() {
            product.setStatus(ProductStatus.SOLD);

            assertThatThrownBy(() -> policyService.validateStatusChange(product, owner, ProductStatus.ACTIVE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Une annonce vendue ou réservée ne peut pas changer de statut.");
        }
    }

    @Nested
    @DisplayName("3. Protection des champs clés et du prix pendant une commande en cours")
    class ActiveOrderRules {

        @BeforeEach
        void setUpActiveOrder() {
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(true);
        }

        @Test
        @DisplayName("Interdiction de changer le prix si une commande est en cours (HTTP 409)")
        void testPriceChangeBlockedIfOrderInProgress() {
            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(30000), "Sneakers Nike Air", 1L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier le prix d'une annonce faisant l'objet d'une commande en cours.");
        }

        @Test
        @DisplayName("Interdiction de changer le titre si une commande est en cours (HTTP 409)")
        void testTitleChangeBlockedIfOrderInProgress() {
            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Chaussures Modifiées", 1L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier le titre d'une annonce faisant l'objet d'une commande en cours.");
        }

        @Test
        @DisplayName("Interdiction de changer la catégorie si une commande est en cours (HTTP 409)")
        void testCategoryChangeBlockedIfOrderInProgress() {
            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Sneakers Nike Air", 2L, ProductCondition.VERY_GOOD
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier la catégorie d'une annonce faisant l'objet d'une commande en cours.");
        }

        @Test
        @DisplayName("Interdiction de changer l'état (condition) si une commande est en cours (HTTP 409)")
        void testConditionChangeBlockedIfOrderInProgress() {
            assertThatThrownBy(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Sneakers Nike Air", 1L, ProductCondition.SATISFACTORY
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier l'état d'une annonce faisant l'objet d'une commande en cours.");
        }

        @Test
        @DisplayName("Modification autorisée si les champs clés et le prix ne changent pas")
        void testNonCriticalFieldsModificationAllowedEvenWithActiveOrder() {
            assertThatCode(() -> policyService.validateProductModification(
                    product, owner, BigDecimal.valueOf(25000), "Sneakers Nike Air", 1L, ProductCondition.VERY_GOOD
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Interdiction de changer le statut de l'annonce si une commande est en cours")
        void testStatusChangeBlockedIfOrderInProgress() {
            assertThatThrownBy(() -> policyService.validateStatusChange(product, owner, ProductStatus.INACTIVE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier le statut d'une annonce ayant une commande en cours.");
        }
    }

    @Nested
    @DisplayName("4. Délégation dans ProductService (Endpoints génériques d'update)")
    class ProductServiceDelegationRules {

        private ProductService productService;
        private ProductRepository productRepository;
        private CategoryRepository categoryRepository;

        @BeforeEach
        void setUpProductService() {
            productRepository = org.mockito.Mockito.mock(ProductRepository.class);
            categoryRepository = org.mockito.Mockito.mock(CategoryRepository.class);
            productService = new ProductService(productRepository, categoryRepository, policyService);
            when(productRepository.findById(100L)).thenReturn(java.util.Optional.of(product));
        }

        @Test
        @DisplayName("ProductService rejette la modification si l'utilisateur n'est pas le propriétaire (403)")
        void testProductServiceRejectsNonOwner() {
            UpdateProductRequest req = new UpdateProductRequest();
            req.setTitle("Piratage");

            assertThatThrownBy(() -> productService.updateProduct(100L, req, otherUser))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("ProductService rejette la modification d'un produit SOLD (409)")
        void testProductServiceRejectsSoldProduct() {
            product.setStatus(ProductStatus.SOLD);
            UpdateProductRequest req = new UpdateProductRequest();
            req.setDescription("Nouvelle description");

            assertThatThrownBy(() -> productService.updateProduct(100L, req, owner))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier une annonce au statut SOLD.");
        }

        @Test
        @DisplayName("ProductService rejette le changement de prix si une commande est en cours (409)")
        void testProductServiceRejectsPriceChangeUnderActiveOrder() {
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(true);
            UpdateProductRequest req = new UpdateProductRequest();
            req.setPrice(BigDecimal.valueOf(99999));

            assertThatThrownBy(() -> productService.updateProduct(100L, req, owner))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Impossible de modifier le prix d'une annonce faisant l'objet d'une commande en cours.");
        }

        @Test
        @DisplayName("ProductService autorise la modification valide par le propriétaire")
        void testProductServiceAllowsValidUpdate() {
            when(orderRepository.existsByProductIdAndStatusIn(eq(100L), any())).thenReturn(false);
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateProductRequest req = new UpdateProductRequest();
            req.setTitle("Nouveau Titre Valide");
            req.setDescription("Nouvelle Description");

            var updated = productService.updateProduct(100L, req, owner);
            org.assertj.core.api.Assertions.assertThat(updated.getTitle()).isEqualTo("Nouveau Titre Valide");
        }
    }
}
