package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.DeliveryDto;
import com.revibeflip.dto.UpdateDeliveryStatusRequest;
import com.revibeflip.entity.User;
import com.revibeflip.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@Tag(name = "Livraison & Suivi de Colis", description = "Suivi pas à pas de l'acheminement des colis (Jumia style)")
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Obtenir le suivi de livraison pour une commande")
    public ResponseEntity<ApiResponse<DeliveryDto>> getDeliveryByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryService.getDeliveryByOrderId(orderId)));
    }

    @GetMapping("/track/{trackingNumber}")
    @Operation(summary = "Suivre un colis par son numéro de suivi unique")
    public ResponseEntity<ApiResponse<DeliveryDto>> trackByNumber(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryService.getDeliveryByTrackingNumber(trackingNumber)));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Mettre à jour le statut de livraison (PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED)")
    public ResponseEntity<ApiResponse<DeliveryDto>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDeliveryStatusRequest request,
            @AuthenticationPrincipal User user
    ) {
        DeliveryDto updated = deliveryService.updateDeliveryStatus(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Statut de livraison mis à jour : " + request.getStatus().getLabel()));
    }
}
