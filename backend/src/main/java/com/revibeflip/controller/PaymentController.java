package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Paiements Mobiles & Escrow", description = "Paiements par Wave, Orange Money, Free Money avec séquestre (Escrow)")
/**
 * Contrôleur REST des paiements mobiles (Wave, Orange Money, Free Money).
 * Gère le séquestre bancaire (Escrow) avec blocage des fonds jusqu'à livraison conforme.
 */
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @PostMapping("/process")
    @Operation(summary = "Effectuer le paiement mobile (Wave, Orange Money, Free Money)")
    public ResponseEntity<ApiResponse<PaymentDto>> processPayment(
            @Valid @RequestBody ProcessPaymentRequest request,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        PaymentDto payment = paymentService.processPayment(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(payment, "Paiement validé avec succès ! Les fonds sont sécurisés en séquestre."));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Obtenir les informations de paiement d'une commande")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentByOrderId(@PathVariable Long orderId) {
        PaymentDto payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }
}
