package com.revibeflip.security;

import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Tests de sécurité WebSocket/STOMP (SEC-19) :
 * - Vérification de compte actif/vérifié/non suspendu à la connexion CONNECT
 * - Refus strict de toute émission directe SEND depuis un client
 * - Politique deny-by-default sur SUBSCRIBE (wildcards, topics inconnus, topics tiers)
 * - Contrôle de propriété/participation sur les 3 canaux autorisés
 * - Libération des compteurs de débit à la déconnexion (DISCONNECT et SessionDisconnectEvent)
 */
@ExtendWith(MockitoExtension.class)
class WebSocketSecurityTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private WebSocketAuthInterceptor interceptor;

    private User buyer;
    private User seller;
    private User intruder;
    private User admin;
    private User pendingOtpUser;
    private User suspendedUser;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        buyer = User.builder()
                .id(10L)
                .phone("+221770000010")
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build();

        seller = User.builder()
                .id(20L)
                .phone("+221770000020")
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build();

        intruder = User.builder()
                .id(30L)
                .phone("+221770000030")
                .role(Role.ROLE_USER)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build();

        admin = User.builder()
                .id(1L)
                .phone("+221770000001")
                .role(Role.ROLE_ADMIN)
                .status(AccountStatus.ACTIVE)
                .isVerified(true)
                .isSuspended(false)
                .build();

        pendingOtpUser = User.builder()
                .id(40L)
                .phone("+221770000040")
                .role(Role.ROLE_USER)
                .status(AccountStatus.PENDING_OTP)
                .isVerified(false)
                .isSuspended(false)
                .build();

        suspendedUser = User.builder()
                .id(50L)
                .phone("+221770000050")
                .role(Role.ROLE_USER)
                .status(AccountStatus.SUSPENDED)
                .isVerified(true)
                .isSuspended(true)
                .build();

        conversation = Conversation.builder()
                .id(100L)
                .buyer(buyer)
                .seller(seller)
                .build();

        lenient().when(userRepository.findByIdentifier(buyer.getPhone())).thenReturn(Optional.of(buyer));
        lenient().when(userRepository.findByIdentifier(seller.getPhone())).thenReturn(Optional.of(seller));
        lenient().when(userRepository.findByIdentifier(intruder.getPhone())).thenReturn(Optional.of(intruder));
        lenient().when(userRepository.findByIdentifier(admin.getPhone())).thenReturn(Optional.of(admin));
        lenient().when(userRepository.findByIdentifier(pendingOtpUser.getPhone())).thenReturn(Optional.of(pendingOtpUser));
        lenient().when(userRepository.findByIdentifier(suspendedUser.getPhone())).thenReturn(Optional.of(suspendedUser));
        lenient().when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));
    }

    // =========================================================================
    // 1. CONNECT : Vérification compte actif, vérifié et non suspendu
    // =========================================================================

    @Test
    @DisplayName("CONNECT : un compte actif, vérifié et non suspendu avec JWT valide est authentifié")
    void connect_activeVerifiedUser_succeeds() {
        when(jwtUtil.extractUsername("valid-token")).thenReturn(buyer.getPhone());
        when(userDetailsService.loadUserByUsername(buyer.getPhone())).thenReturn(buyer);
        when(jwtUtil.validateToken("valid-token", buyer)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionId("sess-1");
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer valid-token");
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(msg, (MessageChannel) null);

        assertThat(accessor.getUser()).isNotNull();
        assertThat(accessor.getUser().getName()).isEqualTo(buyer.getPhone());
    }

    @Test
    @DisplayName("CONNECT : un compte PENDING_OTP / non vérifié est refusé")
    void connect_pendingOtpUser_denied() {
        when(jwtUtil.extractUsername("pending-token")).thenReturn(pendingOtpUser.getPhone());
        when(userDetailsService.loadUserByUsername(pendingOtpUser.getPhone())).thenReturn(pendingOtpUser);

        Message<byte[]> msg = connectMessage("sess-pending", "Bearer pending-token");

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("inactif");
    }

    @Test
    @DisplayName("CONNECT : un compte suspendu est refusé")
    void connect_suspendedUser_denied() {
        when(jwtUtil.extractUsername("suspended-token")).thenReturn(suspendedUser.getPhone());
        when(userDetailsService.loadUserByUsername(suspendedUser.getPhone())).thenReturn(suspendedUser);

        Message<byte[]> msg = connectMessage("sess-susp", "Bearer suspended-token");

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("suspendu");
    }

    @Test
    @DisplayName("CONNECT : un JWT sans subject (extractUsername == null) est refusé")
    void connect_nullUsername_denied() {
        when(jwtUtil.extractUsername("malformed-token")).thenReturn(null);

        Message<byte[]> msg = connectMessage("sess-null", "Bearer malformed-token");

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("invalide");
    }

    @Test
    @DisplayName("CONNECT : connexion sans jeton refusée")
    void connect_missingToken_denied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionId("sess-notoken");
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================================
    // 2. SEND : Refus strict de toute émission directe depuis un client
    // =========================================================================

    @Test
    @DisplayName("SEND : émission directe sur /topic/conversations/{id} refusée même pour un participant")
    void send_toConversationTopic_denied() {
        Message<byte[]> msg = sendMessage("sess-send-1", buyer, "/topic/conversations/100");

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("non autorisée");
    }

    @Test
    @DisplayName("SEND : émission directe sur /topic/user.{id}.notifications refusée (anti-spoofing)")
    void send_toNotificationTopic_denied() {
        Message<byte[]> msg = sendMessage("sess-send-2", intruder, "/topic/user.10.notifications");

        assertThatThrownBy(() -> interceptor.preSend(msg, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("SEND : émission directe sur /app/** ou sans authentification refusée")
    void send_toAppOrAnonymous_denied() {
        Message<byte[]> msgApp = sendMessage("sess-send-3", buyer, "/app/chat.send");
        Message<byte[]> msgAnon = sendMessage("sess-send-4", null, "/topic/conversations/100");

        assertThatThrownBy(() -> interceptor.preSend(msgApp, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> interceptor.preSend(msgAnon, (MessageChannel) null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================================
    // 3. SUBSCRIBE : Deny-by-default & contrôle de propriété
    // =========================================================================

    @Test
    @DisplayName("SUBSCRIBE : acheteur, vendeur et admin peuvent s'abonner à /topic/conversations/{id} et /read")
    void subscribe_authorizedConversationParticipants_succeed() {
        assertThat(interceptor.preSend(subscribeMessage("s1", buyer, "/topic/conversations/100"), null)).isNotNull();
        assertThat(interceptor.preSend(subscribeMessage("s2", seller, "/topic/conversations/100/read"), null)).isNotNull();
        assertThat(interceptor.preSend(subscribeMessage("s3", admin, "/topic/conversations/100"), null)).isNotNull();
    }

    @Test
    @DisplayName("SUBSCRIBE : tiers refusé sur /topic/conversations/{id} et /read")
    void subscribe_intruderOnConversation_denied() {
        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-int1", intruder, "/topic/conversations/100"), null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("vous n'êtes pas participant");

        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-int2", intruder, "/topic/conversations/100/read"), null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE : propriétaire autorisé sur ses propres notifications et messages, tiers refusé")
    void subscribe_ownNotificationsAndMessages_allowedAndForeignDenied() {
        assertThat(interceptor.preSend(
                subscribeMessage("s-n1", buyer, "/topic/user.10.notifications"), null)).isNotNull();
        assertThat(interceptor.preSend(
                subscribeMessage("s-m1", buyer, "/topic/users/10/messages"), null)).isNotNull();

        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-n2", intruder, "/topic/user.10.notifications"), null))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-m2", intruder, "/topic/users/10/messages"), null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE : wildcards (/topic/**, /topic/conversations/*, /topic/user.*.notifications) et canaux inconnus refusés")
    void subscribe_wildcardsAndUnknownDestinations_denied() {
        String[] disallowedDestinations = {
                "/topic/**",
                "/topic/*",
                "/topic/conversations/*",
                "/topic/conversations/**",
                "/topic/user.*.notifications",
                "/topic/users/*/messages",
                "/queue/private",
                "/topic/admin/events",
                "/topic/conversations/100/extra",
                ""
        };

        for (String dest : disallowedDestinations) {
            Message<byte[]> msg = subscribeMessage("s-wild", buyer, dest);
            assertThatThrownBy(() -> interceptor.preSend(msg, null))
                    .as("Destination %s doit être refusée", dest)
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test
    @DisplayName("SUBSCRIBE : un compte PENDING_OTP ou suspendu ne peut s'abonner à aucun canal")
    void subscribe_inactiveOrSuspendedAccount_denied() {
        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-pend", pendingOtpUser, "/topic/user.40.notifications"), null))
                .isInstanceOf(AccessDeniedException.class);

        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-susp", suspendedUser, "/topic/user.50.notifications"), null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE : un client non authentifié est refusé même sur un canal non listé")
    void subscribe_unauthenticated_denied() {
        assertThatThrownBy(() -> interceptor.preSend(
                subscribeMessage("s-anon", null, "/topic/**"), null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================================
    // 4. DISCONNECT : Libération des compteurs de débit
    // =========================================================================

    @Test
    @DisplayName("DISCONNECT : le compteur de débit est libéré sur trame STOMP DISCONNECT")
    void disconnect_stompFrame_releasesRateLimitBucket() {
        String sessionId = "sess-cleanup-frame";
        interceptor.preSend(subscribeMessage(sessionId, buyer, "/topic/user.10.notifications"), null);
        assertThat(interceptor.hasSessionBucket(sessionId)).isTrue();

        StompHeaderAccessor disconnectAccessor = StompHeaderAccessor.create(StompCommand.DISCONNECT);
        disconnectAccessor.setSessionId(sessionId);
        Message<byte[]> disconnectMsg = MessageBuilder.createMessage(new byte[0], disconnectAccessor.getMessageHeaders());
        interceptor.preSend(disconnectMsg, null);

        assertThat(interceptor.hasSessionBucket(sessionId)).isFalse();
    }

    @Test
    @DisplayName("DISCONNECT : le compteur de débit est libéré sur SessionDisconnectEvent (coupure réseau)")
    void disconnect_sessionDisconnectEvent_releasesRateLimitBucket() {
        String sessionId = "sess-cleanup-event";
        interceptor.preSend(subscribeMessage(sessionId, buyer, "/topic/user.10.notifications"), null);
        assertThat(interceptor.hasSessionBucket(sessionId)).isTrue();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.DISCONNECT);
        accessor.setSessionId(sessionId);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        SessionDisconnectEvent event = new SessionDisconnectEvent(this, msg, sessionId, CloseStatus.NORMAL);

        interceptor.handleSessionDisconnect(event);

        assertThat(interceptor.hasSessionBucket(sessionId)).isFalse();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Message<byte[]> connectMessage(String sessionId, String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionId(sessionId);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", authHeader);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<byte[]> sendMessage(String sessionId, User user, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setSessionId(sessionId);
        accessor.setDestination(destination);
        if (user != null) {
            accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<byte[]> subscribeMessage(String sessionId, User user, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setSessionId(sessionId);
        accessor.setDestination(destination);
        if (user != null) {
            accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
