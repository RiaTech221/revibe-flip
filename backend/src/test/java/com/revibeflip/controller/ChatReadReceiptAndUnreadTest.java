package com.revibeflip.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.NotificationRepository;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration US-15 :
 * - Statut isRead (false -> true) lors de la lecture
 * - Compteur de messages non lus (/api/messages/unread-count) et notification NEW_MESSAGE
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ChatReadReceiptAndUnreadTest {

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
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private SmsProvider smsProvider;

    @MockitoBean
    private PaymentGateway paymentGateway;

    @Test
    @DisplayName("US-15 : Compteur non lus, notification NEW_MESSAGE et passage isRead false -> true")
    void unreadCounter_newMessageNotification_andReadReceipt() throws Exception {
        User buyer = userRepository.save(User.builder()
                .firstName("Fatou")
                .lastName("Fall")
                .phone("+221778882201")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        User seller = userRepository.save(User.builder()
                .firstName("Ibrahima")
                .lastName("Sarr")
                .phone("+221778882202")
                .password(passwordEncoder.encode("Secret123!"))
                .role(Role.ROLE_USER)
                .isVerified(true)
                .build());

        Category category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder().name("Mode").slug("mode-us15").build()));

        Product product = productRepository.save(Product.builder()
                .title("Sneakers Dakar")
                .description("Pointure 42")
                .price(new BigDecimal("30000"))
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .category(category)
                .build());

        String buyerToken = jwtUtil.generateToken(buyer, buyer.getId(), buyer.getRole().name(), buyer.getFullName());
        String sellerToken = jwtUtil.generateToken(seller, seller.getId(), seller.getRole().name(), seller.getFullName());

        // 1. Acheteur démarre la conversation (1er message non lu)
        MvcResult startRes = mockMvc.perform(post("/api/messages/conversations")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", product.getId()))))
                .andExpect(status().isOk())
                .andReturn();

        long convId = objectMapper.readTree(startRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Acheteur envoie un 2e message -> isRead=false (coche grise)
        mockMvc.perform(post("/api/messages/send")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("conversationId", convId, "content", "Disponible aujourd'hui ?"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(false));

        // 3. Compteur non lus du vendeur = 2 + notification NEW_MESSAGE présente
        mockMvc.perform(get("/api/messages/unread-count")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(2));

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(seller.getId()))
                .anyMatch(n -> n.getType() == NotificationType.NEW_MESSAGE);

        // 4. Vendeur marque comme lu -> 2 messages marqués lus
        mockMvc.perform(post("/api/messages/conversations/" + convId + "/read")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(2));

        // 5. Compteur non lus du vendeur = 0, et messages ont isRead=true (double coche mauve)
        mockMvc.perform(get("/api/messages/unread-count")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(0));

        MvcResult msgsRes = mockMvc.perform(get("/api/messages/conversations/" + convId)
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode msgs = objectMapper.readTree(msgsRes.getResponse().getContentAsString()).path("data");
        assertThat(msgs).hasSize(2);
        assertThat(msgs.get(0).path("isRead").asBoolean()).isTrue();
        assertThat(msgs.get(1).path("isRead").asBoolean()).isTrue();
    }
}
