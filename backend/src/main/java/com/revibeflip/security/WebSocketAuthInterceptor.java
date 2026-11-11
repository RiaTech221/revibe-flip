package com.revibeflip.security;

import com.revibeflip.entity.Conversation;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.ConversationRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.security.Principal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    private static final Pattern CONVERSATION_TOPIC_PATTERN = Pattern.compile("^/topic/conversations/(\\d+)$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();

        // 1. Authentification lors du handshake STOMP CONNECT
        if (StompCommand.CONNECT.equals(command)) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                authHeader = accessor.getFirstNativeHeader("token");
                if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                    authHeader = "Bearer " + authHeader;
                }
            }

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String username = jwtUtil.extractUsername(token);
                    if (username != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        if (jwtUtil.validateToken(token, userDetails)) {
                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(auth);
                            log.debug("WebSocket authentifié pour l'utilisateur: {}", username);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Échec validation JWT WebSocket: {}", e.getMessage());
                }
            }
        }

        // 2. Sécurisation stricte de l'abonnement SUBSCRIBE aux conversations
        if (StompCommand.SUBSCRIBE.equals(command)) {
            String destination = accessor.getDestination();
            if (destination != null) {
                Matcher matcher = CONVERSATION_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    Long conversationId = Long.parseLong(matcher.group(1));
                    Principal principal = accessor.getUser();
                    if (principal == null) {
                        log.warn("Abonnement non authentifié refusé pour {}", destination);
                        throw new AccessDeniedException("Authentification requise pour s'abonner aux discussions.");
                    }

                    User user = userRepository.findByIdentifier(principal.getName())
                            .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé."));

                    if (Boolean.TRUE.equals(user.getIsSuspended())) {
                        throw new AccessDeniedException("Votre compte est actuellement suspendu.");
                    }

                    // Seuls l'acheteur, le vendeur ou l'admin ont accès à ce canal
                    Conversation conversation = conversationRepository.findById(conversationId)
                            .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable."));

                    boolean isBuyer = conversation.getBuyer().getId().equals(user.getId());
                    boolean isSeller = conversation.getSeller().getId().equals(user.getId());
                    boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;

                    if (!isBuyer && !isSeller && !isAdmin) {
                        log.warn("Tentative d'espionnage WebSocket par {} sur la conversation #{}", user.getPhone(), conversationId);
                        throw new AccessDeniedException("Accès refusé : vous n'êtes pas participant de cette conversation.");
                    }
                }
            }
        }

        return message;
    }
}
