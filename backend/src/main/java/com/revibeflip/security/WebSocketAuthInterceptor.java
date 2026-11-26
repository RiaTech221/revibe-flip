package com.revibeflip.security;

import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Intercepteur de sécurité des canaux STOMP WebSocket (SEC-19).
 * <p>
 * - Exige un jeton JWT valide et un compte actif, vérifié et non suspendu lors du {@code CONNECT}.
 * - Refuse toute émission directe {@code SEND} depuis un client (tous les envois passent par REST).
 * - Applique une politique deny-by-default sur {@code SUBSCRIBE} : seuls les canaux explicitement
 *   autorisés ({@code /topic/conversations/{id}}, {@code /topic/conversations/{id}/read},
 *   {@code /topic/user.{id}.notifications}, {@code /topic/users/{id}/messages}) sont permis
 *   avec contrôle strict de propriété/participation.
 * - Libère les compteurs de débit par session à la déconnexion ({@code DISCONNECT} et
 *   {@link SessionDisconnectEvent}).
 * - Journalise les refus sans aucune donnée sensible (aucun téléphone, email ni jeton).
 * </p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    private static final Pattern CONVERSATION_TOPIC_PATTERN =
            Pattern.compile("^/topic/conversations/(\\d+)(?:/read)?$");
    private static final Pattern NOTIFICATION_TOPIC_PATTERN =
            Pattern.compile("^/topic/user\\.(\\d+)\\.notifications$");
    private static final Pattern USER_MESSAGES_TOPIC_PATTERN =
            Pattern.compile("^/topic/users/(\\d+)/messages$");

    private static final int MAX_SUBSCRIPTIONS_PER_MINUTE = 60;
    private static final int MAX_LOG_DESTINATION_LENGTH = 120;

    private final Map<String, Deque<Instant>> sessionRateBuckets = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        // 1. Authentification et vérification d'état du compte lors du CONNECT
        if (StompCommand.CONNECT.equals(command)) {
            handleConnect(accessor);
            return message;
        }

        // 2. Nettoyage immédiat des compteurs de débit à la déconnexion STOMP
        if (StompCommand.DISCONNECT.equals(command)) {
            releaseSessionBucket(accessor.getSessionId());
            return message;
        }

        // 3. Refus strict de toute émission directe SEND depuis un client (SEC-19)
        if (StompCommand.SEND.equals(command)) {
            String destination = sanitizeForLog(accessor.getDestination());
            String actor = resolveLogActor(accessor.getUser());
            log.warn("WS_SEND_DENIED actor={} sessionId={} destination={}",
                    actor, sanitizeForLog(accessor.getSessionId()), destination);
            throw new AccessDeniedException("Émission directe WebSocket non autorisée.");
        }

        // 4. Contrôle d'abonnement SUBSCRIBE en politique deny-by-default (SEC-19)
        if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
            return message;
        }

        return message;
    }

    /**
     * Libère également les compteurs de débit en cas de coupure réseau/WebSocket
     * sans trame STOMP DISCONNECT explicite.
     */
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        if (event != null) {
            releaseSessionBucket(event.getSessionId());
        }
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = sanitizeForLog(accessor.getSessionId());
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            authHeader = accessor.getFirstNativeHeader("token");
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                authHeader = "Bearer " + authHeader;
            }
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WS_CONNECT_DENIED reason=missing_token sessionId={}", sessionId);
            throw new AccessDeniedException("Jeton JWT requis pour la connexion WebSocket.");
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            log.warn("WS_CONNECT_DENIED reason=empty_token sessionId={}", sessionId);
            throw new AccessDeniedException("Jeton JWT requis pour la connexion WebSocket.");
        }

        try {
            String username = jwtUtil.extractUsername(token);
            if (username == null || username.isBlank()) {
                log.warn("WS_CONNECT_DENIED reason=invalid_subject sessionId={}", sessionId);
                throw new AccessDeniedException("Jeton JWT invalide.");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!(userDetails instanceof User u)) {
                log.warn("WS_CONNECT_DENIED reason=unsupported_principal sessionId={}", sessionId);
                throw new AccessDeniedException("Authentification WebSocket invalide.");
            }

            if (Boolean.TRUE.equals(u.getIsSuspended())) {
                log.warn("WS_CONNECT_DENIED reason=account_suspended userId={} sessionId={}", u.getId(), sessionId);
                throw new AccessDeniedException("Compte suspendu.");
            }

            if (u.getStatus() != AccountStatus.ACTIVE || !Boolean.TRUE.equals(u.getIsVerified())) {
                log.warn("WS_CONNECT_DENIED reason=account_inactive userId={} status={} sessionId={}",
                        u.getId(), u.getStatus(), sessionId);
                throw new AccessDeniedException("Compte inactif ou non vérifié.");
            }

            if (!jwtUtil.validateToken(token, userDetails)) {
                log.warn("WS_CONNECT_DENIED reason=invalid_token userId={} sessionId={}", u.getId(), sessionId);
                throw new AccessDeniedException("Jeton JWT invalide.");
            }

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(auth);
        } catch (AccessDeniedException ex) {
            throw ex;
        } catch (Exception e) {
            log.warn("WS_CONNECT_DENIED reason=authentication_error sessionId={}", sessionId);
            throw new AccessDeniedException("Authentification WebSocket invalide.");
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String sessionId = sanitizeForLog(accessor.getSessionId());
        String rawDestination = accessor.getDestination();
        String safeDestination = sanitizeForLog(rawDestination);
        Principal principal = accessor.getUser();

        if (principal == null) {
            log.warn("WS_SUBSCRIBE_DENIED reason=unauthenticated sessionId={} destination={}",
                    sessionId, safeDestination);
            throw new AccessDeniedException("Authentification requise pour s'abonner aux canaux temps réel.");
        }

        if (rawDestination == null || rawDestination.isBlank()) {
            log.warn("WS_SUBSCRIBE_DENIED reason=missing_destination actor={} sessionId={}",
                    resolveLogActor(principal), sessionId);
            throw new AccessDeniedException("Destination d'abonnement WebSocket invalide.");
        }

        User user = userRepository.findByIdentifier(principal.getName())
                .orElseThrow(() -> {
                    log.warn("WS_SUBSCRIBE_DENIED reason=user_not_found sessionId={} destination={}",
                            sessionId, safeDestination);
                    return new AccessDeniedException("Utilisateur non trouvé.");
                });

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            log.warn("WS_SUBSCRIBE_DENIED reason=account_suspended userId={} sessionId={} destination={}",
                    user.getId(), sessionId, safeDestination);
            throw new AccessDeniedException("Votre compte est actuellement suspendu.");
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            log.warn("WS_SUBSCRIBE_DENIED reason=account_inactive userId={} status={} sessionId={} destination={}",
                    user.getId(), user.getStatus(), sessionId, safeDestination);
            throw new AccessDeniedException("Votre compte n'est pas actif.");
        }

        enforceSubscriptionRateLimit(accessor.getSessionId(), user.getId(), safeDestination);

        // Canal 1 : /topic/conversations/{id} et /topic/conversations/{id}/read
        Matcher convMatcher = CONVERSATION_TOPIC_PATTERN.matcher(rawDestination);
        if (convMatcher.matches()) {
            Long conversationId = parseIdOrDeny(convMatcher.group(1), user.getId(), sessionId, safeDestination);
            Conversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> {
                        log.warn("WS_SUBSCRIBE_DENIED reason=conversation_not_found userId={} conversationId={} sessionId={}",
                                user.getId(), conversationId, sessionId);
                        return new AccessDeniedException("Accès refusé : conversation introuvable ou non autorisée.");
                    });

            boolean isBuyer = conversation.getBuyer().getId().equals(user.getId());
            boolean isSeller = conversation.getSeller().getId().equals(user.getId());
            boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;

            if (!isBuyer && !isSeller && !isAdmin) {
                log.warn("WS_SUBSCRIBE_DENIED reason=not_conversation_participant userId={} conversationId={} sessionId={}",
                        user.getId(), conversationId, sessionId);
                throw new AccessDeniedException("Accès refusé : vous n'êtes pas participant de cette conversation.");
            }
            return;
        }

        // Canal 2 : /topic/user.{userId}.notifications
        Matcher notifMatcher = NOTIFICATION_TOPIC_PATTERN.matcher(rawDestination);
        if (notifMatcher.matches()) {
            Long targetUserId = parseIdOrDeny(notifMatcher.group(1), user.getId(), sessionId, safeDestination);
            if (!user.getId().equals(targetUserId)) {
                log.warn("WS_SUBSCRIBE_DENIED reason=foreign_notifications userId={} targetUserId={} sessionId={}",
                        user.getId(), targetUserId, sessionId);
                throw new AccessDeniedException("Accès refusé : vous ne pouvez écouter que vos propres notifications.");
            }
            return;
        }

        // Canal 3 : /topic/users/{userId}/messages
        Matcher userMsgMatcher = USER_MESSAGES_TOPIC_PATTERN.matcher(rawDestination);
        if (userMsgMatcher.matches()) {
            Long targetUserId = parseIdOrDeny(userMsgMatcher.group(1), user.getId(), sessionId, safeDestination);
            if (!user.getId().equals(targetUserId)) {
                log.warn("WS_SUBSCRIBE_DENIED reason=foreign_user_messages userId={} targetUserId={} sessionId={}",
                        user.getId(), targetUserId, sessionId);
                throw new AccessDeniedException("Accès refusé : vous ne pouvez écouter que vos propres messages.");
            }
            return;
        }

        // Deny-by-default : tout autre canal (wildcards /topic/**, /queue/**, canaux inconnus) est refusé
        log.warn("WS_SUBSCRIBE_DENIED reason=disallowed_destination userId={} sessionId={} destination={}",
                user.getId(), sessionId, safeDestination);
        throw new AccessDeniedException("Abonnement non autorisé sur ce canal.");
    }

    private void enforceSubscriptionRateLimit(String sessionId, Long userId, String safeDestination) {
        String key = (sessionId != null && !sessionId.isBlank()) ? sessionId : "user:" + userId;
        Instant now = Instant.now();
        Deque<Instant> deque = sessionRateBuckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst().isBefore(now.minusSeconds(60))) {
                deque.pollFirst();
            }
            if (deque.size() >= MAX_SUBSCRIPTIONS_PER_MINUTE) {
                log.warn("WS_SUBSCRIBE_DENIED reason=rate_limit_exceeded userId={} sessionId={} destination={}",
                        userId, sanitizeForLog(sessionId), safeDestination);
                throw new AccessDeniedException("Débit d'abonnements WebSocket dépassé.");
            }
            deque.addLast(now);
        }
    }

    private Long parseIdOrDeny(String rawId, Long userId, String sessionId, String safeDestination) {
        try {
            return Long.parseLong(rawId);
        } catch (NumberFormatException e) {
            log.warn("WS_SUBSCRIBE_DENIED reason=invalid_target_id userId={} sessionId={} destination={}",
                    userId, sessionId, safeDestination);
            throw new AccessDeniedException("Destination d'abonnement WebSocket invalide.");
        }
    }

    private void releaseSessionBucket(String sessionId) {
        if (sessionId != null && !sessionId.isBlank()) {
            sessionRateBuckets.remove(sessionId);
        }
    }

    private String resolveLogActor(Principal principal) {
        if (principal == null) {
            return "anonymous";
        }
        if (principal instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof User u
                && u.getId() != null) {
            return "userId=" + u.getId();
        }
        return "authenticated";
    }

    private static String sanitizeForLog(String value) {
        if (value == null) {
            return "null";
        }
        String cleaned = value.replaceAll("[\\r\\n\\t\\p{Cntrl}]", "_");
        if (cleaned.length() > MAX_LOG_DESTINATION_LENGTH) {
            return cleaned.substring(0, MAX_LOG_DESTINATION_LENGTH) + "...";
        }
        return cleaned;
    }

    boolean hasSessionBucket(String sessionId) {
        return sessionId != null && sessionRateBuckets.containsKey(sessionId);
    }
}
