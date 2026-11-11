package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Panier (Mono-Vendeur)", description = "Gestion du panier d'achat mono-vendeur avec articles uniques de seconde main")
/**
 * Contrôleur REST du panier d'achat ReVibe FliP.
 * Gère la consultation, l'ajout et le vidage en appliquant la règle stricte du panier mono-vendeur.
 */
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise pour accéder au panier.");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @GetMapping
    @Operation(summary = "Obtenir le panier actuel de l'acheteur")
    public ResponseEntity<ApiResponse<CartDto>> getCart(Authentication authentication) {
        User buyer = resolveUser(authentication);
        CartDto cart = cartService.getCart(buyer);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Panier récupéré avec succès."));
    }

    @PostMapping("/items")
    @Operation(summary = "Ajouter un article unique au panier (avec contrainte mono-vendeur)")
    public ResponseEntity<ApiResponse<CartDto>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        CartDto cart = cartService.addToCart(buyer, request);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Article ajouté au panier avec succès."));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Supprimer un article du panier")
    public ResponseEntity<ApiResponse<CartDto>> removeFromCart(
            @PathVariable Long productId,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        CartDto cart = cartService.removeFromCart(buyer, productId);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Article retiré du panier."));
    }

    @DeleteMapping
    @Operation(summary = "Vider entièrement le panier")
    public ResponseEntity<ApiResponse<CartDto>> clearCart(Authentication authentication) {
        User buyer = resolveUser(authentication);
        CartDto cart = cartService.clearCart(buyer);
        return ResponseEntity.ok(ApiResponse.ok(cart, "Panier vidé avec succès."));
    }

    @PostMapping("/discuss")
    @Operation(summary = "Ouvrir ou reprendre la discussion avec le vendeur pour finaliser les articles du panier")
    public ResponseEntity<ApiResponse<ConversationDto>> discussWithSeller(Authentication authentication) {
        User buyer = resolveUser(authentication);
        ConversationDto conv = cartService.startDiscussionFromCart(buyer);
        return ResponseEntity.ok(ApiResponse.ok(conv, "Discussion initiée avec le vendeur."));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Transformer le panier en commande unique avec frais de livraison calculés une seule fois")
    public ResponseEntity<ApiResponse<OrderDto>> checkout(
            @Valid @RequestBody CreateOrderFromCartRequest request,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        OrderDto order = cartService.checkoutCart(buyer, request);
        return ResponseEntity.ok(ApiResponse.ok(order, "Commande créée depuis le panier avec succès. Veuillez procéder au paiement."));
    }
}
