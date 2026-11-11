package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.ChatOfferDto;
import com.revibeflip.dto.CreateOfferRequest;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.ChatOfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat-offers")
@RequiredArgsConstructor
@Tag(name = "Offres de Négociation dans le Chat", description = "Gestion des offres de prix vendeur, acceptation/refus acheteur et réservation d'articles")
public class ChatOfferController {

    private final ChatOfferService chatOfferService;
    private final UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @PostMapping
    @Operation(summary = "Émettre une offre de prix depuis la conversation (Vendeur uniquement)")
    public ResponseEntity<ApiResponse<ChatOfferDto>> createOffer(
            @Valid @RequestBody CreateOfferRequest request,
            Authentication authentication
    ) {
        User seller = resolveUser(authentication);
        ChatOfferDto offer = chatOfferService.createOffer(seller, request);
        return ResponseEntity.ok(ApiResponse.ok(offer, "Offre de prix envoyée à l'acheteur."));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accepter une offre de prix reçue et réserver l'article (Acheteur uniquement)")
    public ResponseEntity<ApiResponse<ChatOfferDto>> acceptOffer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        ChatOfferDto offer = chatOfferService.acceptOffer(buyer, id);
        return ResponseEntity.ok(ApiResponse.ok(offer, "Offre acceptée avec succès. Vous pouvez maintenant procéder au paiement."));
    }

    @PostMapping("/{id}/decline")
    @Operation(summary = "Décliner une offre de prix reçue (Acheteur uniquement)")
    public ResponseEntity<ApiResponse<ChatOfferDto>> declineOffer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        ChatOfferDto offer = chatOfferService.declineOffer(buyer, id);
        return ResponseEntity.ok(ApiResponse.ok(offer, "Offre déclinée."));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Annuler une offre en attente (Vendeur uniquement)")
    public ResponseEntity<ApiResponse<ChatOfferDto>> cancelOffer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User seller = resolveUser(authentication);
        ChatOfferDto offer = chatOfferService.cancelOffer(seller, id);
        return ResponseEntity.ok(ApiResponse.ok(offer, "Offre annulée."));
    }

    @GetMapping("/conversation/{conversationId}")
    @Operation(summary = "Obtenir l'historique des offres pour une conversation")
    public ResponseEntity<ApiResponse<List<ChatOfferDto>>> getConversationOffers(
            @PathVariable Long conversationId,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        List<ChatOfferDto> offers = chatOfferService.getConversationOffers(conversationId, user);
        return ResponseEntity.ok(ApiResponse.ok(offers));
    }

    @GetMapping("/seller")
    @Operation(summary = "Lister toutes les offres en cours émises par le vendeur connecté")
    public ResponseEntity<ApiResponse<List<ChatOfferDto>>> getSellerOffers(Authentication authentication) {
        User seller = resolveUser(authentication);
        List<ChatOfferDto> offers = chatOfferService.getSellerActiveOffers(seller);
        return ResponseEntity.ok(ApiResponse.ok(offers));
    }

    @GetMapping("/seller/all")
    @Operation(summary = "Lister tout l'historique des offres émises par le vendeur connecté")
    public ResponseEntity<ApiResponse<List<ChatOfferDto>>> getSellerAllOffers(Authentication authentication) {
        User seller = resolveUser(authentication);
        List<ChatOfferDto> offers = chatOfferService.getSellerAllOffers(seller);
        return ResponseEntity.ok(ApiResponse.ok(offers));
    }
}
