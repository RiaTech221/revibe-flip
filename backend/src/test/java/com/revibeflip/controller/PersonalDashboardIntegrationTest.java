package com.revibeflip.controller;

import com.revibeflip.entity.Category;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.Review;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.DeliveryMode;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.ReviewRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.sms.SmsProvider;
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

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US-06 — Tests d'intégration du tableau de bord personnel :
 * - Historique des commandes (achats pour tous, ventes réservées aux vendeurs)
 * - Annonces, note moyenne sur 5, nombre d'avis et évaluations strictement réservés aux vendeurs
 * - Aucun champ vendeur exposé à un simple acheteur
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PersonalDashboardIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private SmsProvider smsProvider;
    @MockitoBean private PaymentGateway paymentGateway;

    private static final String PURE_BUYER_PHONE = "+221780060001";
    private static final String SELLER_PHONE = "+221780060002";
    private static final String SECOND_BUYER_PHONE = "+221780060003";

    private String buyerToken;
    private String sellerToken;

    @BeforeEach
    void setUp() {
        User pureBuyer = userRepository.findByPhone(PURE_BUYER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(PURE_BUYER_PHONE)
                        .email("acheteur.us06@revibeflip.test")
                        .firstName("Oumar")
                        .lastName("Ba")
                        .city("Dakar")
                        .password(passwordEncoder.encode("Secret123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .build())
        );

        User seller = userRepository.findByPhone(SELLER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(SELLER_PHONE)
                        .email("vendeur.us06@revibeflip.test")
                        .firstName("Awa")
                        .lastName("Ndiaye")
                        .city("Dakar")
                        .password(passwordEncoder.encode("Secret123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .build())
        );

        User secondBuyer = userRepository.findByPhone(SECOND_BUYER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(SECOND_BUYER_PHONE)
                        .email("acheteur2.us06@revibeflip.test")
                        .firstName("Mamadou")
                        .lastName("Fall")
                        .city("Thiès")
                        .password(passwordEncoder.encode("Secret123!"))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .build())
        );

        Category category = categoryRepository.findAll().stream().findFirst().orElseThrow();

        if (productRepository.countBySellerId(seller.getId()) == 0) {
            Product p1 = productRepository.save(Product.builder()
                    .seller(seller)
                    .category(category)
                    .title("Veste US-06 Vintage")
                    .description("Article de test US-06 #1")
                    .price(new BigDecimal("15000"))
                    .condition(ProductCondition.VERY_GOOD)
                    .status(ProductStatus.SOLD)
                    .locationCity("Dakar")
                    .build());

            Product p2 = productRepository.save(Product.builder()
                    .seller(seller)
                    .category(category)
                    .title("Sac US-06 Cuir")
                    .description("Article de test US-06 #2")
                    .price(new BigDecimal("22000"))
                    .condition(ProductCondition.GOOD)
                    .status(ProductStatus.ACTIVE)
                    .locationCity("Dakar")
                    .build());

            Order order1 = orderRepository.save(Order.builder()
                    .orderNumber("RF-US06-0001")
                    .buyer(pureBuyer)
                    .seller(seller)
                    .product(p1)
                    .itemPrice(new BigDecimal("15000"))
                    .agreedPrice(new BigDecimal("15000"))
                    .validationFee(new BigDecimal("150"))
                    .deliveryFee(new BigDecimal("1500"))
                    .totalAmount(new BigDecimal("16650"))
                    .platformCommission(new BigDecimal("3000"))
                    .sellerPayout(new BigDecimal("12000"))
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .status(OrderStatus.COMPLETED)
                    .build());

            Order order2 = orderRepository.save(Order.builder()
                    .orderNumber("RF-US06-0002")
                    .buyer(secondBuyer)
                    .seller(seller)
                    .product(p2)
                    .itemPrice(new BigDecimal("22000"))
                    .agreedPrice(new BigDecimal("22000"))
                    .validationFee(new BigDecimal("220"))
                    .deliveryFee(new BigDecimal("1500"))
                    .totalAmount(new BigDecimal("23720"))
                    .platformCommission(new BigDecimal("4400"))
                    .sellerPayout(new BigDecimal("17600"))
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .status(OrderStatus.COMPLETED)
                    .build());

            reviewRepository.save(Review.builder()
                    .order(order1)
                    .reviewer(pureBuyer)
                    .targetUser(seller)
                    .rating(5)
                    .comment("Excellent vendeur, livraison rapide !")
                    .build());

            reviewRepository.save(Review.builder()
                    .order(order2)
                    .reviewer(secondBuyer)
                    .targetUser(seller)
                    .rating(4)
                    .comment("Article conforme à la description.")
                    .build());
        }

        buyerToken = jwtUtil.generateToken(pureBuyer, pureBuyer.getId(), pureBuyer.getRole().name(), pureBuyer.getFullName());
        sellerToken = jwtUtil.generateToken(seller, seller.getId(), seller.getRole().name(), seller.getFullName());
    }

    @Test
    @DisplayName("Simple acheteur : voit uniquement ses achats, aucun champ vendeur (annonces, ventes, note, avis)")
    void pureBuyerReceivesOnlyPurchasesAndNoSellerData() throws Exception {
        mockMvc.perform(get("/api/users/me/dashboard")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isSeller").value(false))
                .andExpect(jsonPath("$.data.purchasesCount").value(1))
                .andExpect(jsonPath("$.data.purchases.content[0].orderNumber").value("RF-US06-0001"))
                // Aucun champ vendeur ne doit être exposé à un simple acheteur
                .andExpect(jsonPath("$.data.sales").doesNotExist())
                .andExpect(jsonPath("$.data.salesCount").doesNotExist())
                .andExpect(jsonPath("$.data.listings").doesNotExist())
                .andExpect(jsonPath("$.data.listingsCount").doesNotExist())
                .andExpect(jsonPath("$.data.averageRating").doesNotExist())
                .andExpect(jsonPath("$.data.reviewCount").doesNotExist())
                .andExpect(jsonPath("$.data.reviews").doesNotExist());
    }

    @Test
    @DisplayName("Vendeur : voit ses commandes (achats + ventes), annonces, note moyenne sur 5, nombre d'avis et évaluations")
    void sellerReceivesOrdersListingsRatingAndReviews() throws Exception {
        mockMvc.perform(get("/api/users/me/dashboard")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isSeller").value(true))
                .andExpect(jsonPath("$.data.purchasesCount").value(0))
                .andExpect(jsonPath("$.data.salesCount").value(2))
                .andExpect(jsonPath("$.data.sales.content.length()").value(2))
                .andExpect(jsonPath("$.data.listingsCount").value(2))
                .andExpect(jsonPath("$.data.listings.content.length()").value(2))
                .andExpect(jsonPath("$.data.averageRating").value(4.5))
                .andExpect(jsonPath("$.data.reviewCount").value(2))
                .andExpect(jsonPath("$.data.reviews.content.length()").value(2));
    }

    @Test
    @DisplayName("Pagination : les annonces et ventes vendeur sont paginées")
    void sellerDashboardSupportsPagination() throws Exception {
        mockMvc.perform(get("/api/users/me/dashboard")
                        .param("listingsPage", "0")
                        .param("salesPage", "1")
                        .param("size", "1")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.listings.content.length()").value(1))
                .andExpect(jsonPath("$.data.listings.totalElements").value(2))
                .andExpect(jsonPath("$.data.listings.totalPages").value(2))
                .andExpect(jsonPath("$.data.listings.hasNext").value(true))
                .andExpect(jsonPath("$.data.sales.pageNumber").value(1))
                .andExpect(jsonPath("$.data.sales.content.length()").value(1));
    }

    @Test
    @DisplayName("Accès non authentifié refusé (401 Unauthorized)")
    void unauthenticatedDashboardRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/users/me/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
