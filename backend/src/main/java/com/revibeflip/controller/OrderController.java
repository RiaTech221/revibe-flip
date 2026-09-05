package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateOrderRequest;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.entity.User;
import com.revibeflip.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Commandes", description = "Gestion des commandes, livraisons et confirmation de réception (Escrow)")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Créer une nouvelle commande (avec calcul des frais 1% et livraison)")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal User buyer
    ) {
        OrderDto created = orderService.createOrder(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(created, "Commande initiée avec succès. Veuillez procéder au paiement."));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'une commande")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderById(id, user)));
    }

    @GetMapping("/buyer")
    @Operation(summary = "Lister mes achats (en tant qu'acheteur)")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyBuyerOrders(@AuthenticationPrincipal User buyer) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrdersAsBuyer(buyer.getId())));
    }

    @GetMapping("/seller")
    @Operation(summary = "Lister mes ventes (en tant que vendeur)")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMySellerOrders(@AuthenticationPrincipal User seller) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrdersAsSeller(seller.getId())));
    }

    @PostMapping("/{id}/confirm-receipt")
    @Operation(summary = "Confirmer la réception de l'article et débloquer les fonds de l'Escrow")
    public ResponseEntity<ApiResponse<OrderDto>> confirmReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal User buyer
    ) {
        OrderDto completed = orderService.confirmReceipt(id, buyer);
        return ResponseEntity.ok(ApiResponse.ok(completed, "Réception confirmée avec succès ! Les fonds ont été débloqués pour le vendeur."));
    }
}
