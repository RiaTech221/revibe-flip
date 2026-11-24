package com.revibeflip.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.ProductImage;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.ProductRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration US-14 :
 * - Un seul fil par vendeur, avec reprise de l'historique existant
 * - Insertion automatique de la carte produit (photo, nom) et du message « Je suis intéressé »
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class SingleThreadChatTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

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
    @DisplayName("US-14 : Un seul fil par vendeur, reprise historique + carte produit & 'Je suis intéressé'")
    void singleThreadPerSeller_insertsProductCardAndInterestedMessage() throws Exception {
        User buyer = userRepository.save(User.builder()
                .firstName("Awa")
                .lastName("Diop")
                .phone("+221778881101")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        User seller = userRepository.save(User.builder()
                .firstName("Moussa")
                .lastName("Ndiaye")
                .phone("+221778881102")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        Category category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder().name("Mode").slug("mode-us14").build()));

        Product productA = Product.builder()
                .title("Robe Wax Premium")
                .description("Robe neuve")
                .price(new BigDecimal("25000"))
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .category(category)
                .build();
        productA.getImages().add(ProductImage.builder()
                .product(productA)
                .imageUrl("https://cdn.example.com/robe-wax.jpg")
                .isPrimary(true)
                .displayOrder(0)
                .build());
        productA = productRepository.save(productA);

        Product productB = Product.builder()
                .title("Sac Cuir Ngaye")
                .description("Sac artisanal")
                .price(new BigDecimal("35000"))
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .category(category)
                .build();
        productB.getImages().add(ProductImage.builder()
                .product(productB)
                .imageUrl("https://cdn.example.com/sac-cuir.jpg")
                .isPrimary(true)
                .displayOrder(0)
                .build());
        productB = productRepository.save(productB);

        String buyerToken = jwtUtil.generateToken(buyer, buyer.getId(), buyer.getRole().name(), buyer.getFullName());

        // 1. Premier contact sur Produit A
        MvcResult res1 = mockMvc.perform(post("/api/messages/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", productA.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.productId").value(productA.getId()))
                .andReturn();

        long convId1 = objectMapper.readTree(res1.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Second contact sur Produit B du MÊME vendeur -> même conversation, 2e carte insérée
        MvcResult res2 = mockMvc.perform(post("/api/messages/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", productB.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(convId1))
                .andExpect(jsonPath("$.data.productId").value(productB.getId()))
                .andReturn();

        long convId2 = objectMapper.readTree(res2.getResponse().getContentAsString())
                .path("data").path("id").asLong();
        assertThat(convId2).isEqualTo(convId1);

        // 3. Re-clic immédiat sur Produit B -> pas de doublon
        mockMvc.perform(post("/api/messages/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", productB.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(convId1));

        // Vérifier l'historique : 2 messages avec cartes produit + "Je suis intéressé"
        MvcResult msgsRes = mockMvc.perform(get("/api/messages/conversations/" + convId1)
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode messages = objectMapper.readTree(msgsRes.getResponse().getContentAsString()).path("data");
        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).path("productId").asLong()).isEqualTo(productA.getId());
        assertThat(messages.get(0).path("productTitle").asText()).isEqualTo("Robe Wax Premium");
        assertThat(messages.get(0).path("productImageUrl").asText()).isEqualTo("https://cdn.example.com/robe-wax.jpg");
        assertThat(messages.get(0).path("content").asText()).isEqualTo("Je suis intéressé");

        assertThat(messages.get(1).path("productId").asLong()).isEqualTo(productB.getId());
        assertThat(messages.get(1).path("productTitle").asText()).isEqualTo("Sac Cuir Ngaye");
        assertThat(messages.get(1).path("productImageUrl").asText()).isEqualTo("https://cdn.example.com/sac-cuir.jpg");
        assertThat(messages.get(1).path("content").asText()).isEqualTo("Je suis intéressé");
    }
}
