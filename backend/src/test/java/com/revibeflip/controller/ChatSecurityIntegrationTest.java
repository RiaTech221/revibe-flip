package com.revibeflip.controller;

import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.WebSocketAuthInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ChatSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private WebSocketAuthInterceptor webSocketAuthInterceptor;

    private Conversation testConversation;
    private User buyer;
    private User seller;
    private User intruder;

    @BeforeEach
    void setUp() {
        buyer = userRepository.findByPhone("+221773334455").orElseGet(() ->
                userRepository.save(User.builder()
                        .phone("+221773334455")
                        .password("password123")
                        .firstName("Modou")
                        .lastName("Gueye")
                        .role(Role.ROLE_USER)
                        .isSuspended(false)
                        .build()));

        seller = userRepository.findByPhone("+221771112233").orElseGet(() ->
                userRepository.save(User.builder()
                        .phone("+221771112233")
                        .password("password123")
                        .firstName("Aminata")
                        .lastName("Diallo")
                        .role(Role.ROLE_USER)
                        .isSuspended(false)
                        .build()));

        intruder = userRepository.findByPhone("+221779998877").orElseGet(() ->
                userRepository.save(User.builder()
                        .phone("+221779998877")
                        .password("password123")
                        .firstName("Fatou")
                        .lastName("Sow")
                        .role(Role.ROLE_USER)
                        .isSuspended(false)
                        .build()));

        Product product = productRepository.findAll().stream().findFirst().orElse(null);

        testConversation = conversationRepository.findByProductAndUsers(
                product != null ? product.getId() : 1L, buyer.getId(), seller.getId()
        ).orElseGet(() -> conversationRepository.save(Conversation.builder()
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .lastMessagePreview("Test discussion")
                .build()));
    }

    @Test
    @DisplayName("Sécurité : Un utilisateur tiers ne peut PAS lire la conversation d'un autre (403 Forbidden)")
    @WithMockUser(username = "+221779998877", roles = {"USER"})
    void testThirdParty_CannotReadConversation() throws Exception {
        mockMvc.perform(get("/api/messages/conversations/" + testConversation.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sécurité : L'acheteur légitime PEUT lire sa propre conversation (200 OK)")
    @WithMockUser(username = "+221773334455", roles = {"USER"})
    void testBuyer_CanReadOwnConversation() throws Exception {
        mockMvc.perform(get("/api/messages/conversations/" + testConversation.getId()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sécurité : Le vendeur légitime PEUT lire sa propre conversation (200 OK)")
    @WithMockUser(username = "+221771112233", roles = {"USER"})
    void testSeller_CanReadOwnConversation() throws Exception {
        mockMvc.perform(get("/api/messages/conversations/" + testConversation.getId()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sécurité : Un utilisateur tiers ne peut PAS s'abonner via WebSocket à une conversation étrangère")
    void testWebSocket_ThirdPartySubscription_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/conversations/" + testConversation.getId());

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                new org.springframework.security.core.userdetails.User(intruder.getPhone(), "", java.util.List.of()),
                null,
                java.util.List.of()
        );
        accessor.setUser(auth);

        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> webSocketAuthInterceptor.preSend(message, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("vous n'êtes pas participant");
    }
}
