package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateOrderRequest;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.PageResponseDto;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Commandes", description = "Gestion des commandes, livraisons et confirmation de réception (Escrow)")
/**
 * Contrôleur REST de gestion des commandes.
 * Orchestre la création de commande avec calcul des frais de validation (1%), livraison et commission (20%).
 */
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle commande (avec calcul des frais 1% et livraison)")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        OrderDto created = orderService.createOrder(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(created, "Commande initiée avec succès. Veuillez procéder au paiement."));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'une commande")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderById(id, user)));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Lister mes achats avec pagination et filtre par statut")
    public ResponseEntity<ApiResponse<PageResponseDto<OrderDto>>> getMyOrdersPaginated(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        Page<OrderDto> orderPage = orderService.getBuyerOrdersPaginated(buyer.getId(), status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponseDto.fromPage(orderPage)));
    }

    @GetMapping("/buyer")
    @Operation(summary = "Lister tous mes achats (en tant qu'acheteur)")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyBuyerOrders(Authentication authentication) {
        User buyer = resolveUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrdersAsBuyer(buyer.getId())));
    }

    @GetMapping("/seller")
    @Operation(summary = "Lister mes ventes (en tant que vendeur)")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMySellerOrders(Authentication authentication) {
        User seller = resolveUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrdersAsSeller(seller.getId())));
    }

    @PostMapping("/{id}/confirm-receipt")
    @Operation(summary = "Confirmer la réception de l'article et débloquer les fonds de l'Escrow")
    public ResponseEntity<ApiResponse<OrderDto>> confirmReceipt(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        OrderDto completed = orderService.confirmReceipt(id, buyer);
        return ResponseEntity.ok(ApiResponse.ok(completed, "Réception confirmée avec succès ! Les fonds ont été débloqués pour le vendeur."));
    }
}
