package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Messagerie Acheteur-Vendeur", description = "Discussions directes acheteur-vendeur et messages temps réel")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    @Operation(summary = "Lister toutes mes conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getMyConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getUserConversations(user.getId())));
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Obtenir les messages d'une conversation et marquer comme lus")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getConversationMessages(id, user)));
    }

    @PostMapping("/conversations")
    @Operation(summary = "Démarrer une conversation depuis une annonce")
    public ResponseEntity<ApiResponse<ConversationDto>> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            @AuthenticationPrincipal User buyer
    ) {
        ConversationDto conversation = chatService.startConversation(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(conversation, "Conversation initiée avec succès."));
    }

    @PostMapping("/send")
    @Operation(summary = "Envoyer un message texte dans une conversation existante")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal User sender
    ) {
        MessageDto sent = chatService.sendMessage(request, sender);
        return ResponseEntity.ok(ApiResponse.ok(sent, "Message envoyé."));
    }
}
