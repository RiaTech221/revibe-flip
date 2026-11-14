package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.PayTechIpnPayload;
import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.PaymentInitiationResponse;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur REST des paiements PayTech, webhooks IPN et vérification de statut.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Paiements PayTech", description = "Initiation de paiement PayTech, webhook IPN sécurisé et vérification de statut")
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

    @PostMapping({"/initiate", "/process"})
    @Operation(summary = "Initier un paiement PayTech", description = "Crée la demande de paiement côté serveur et retourne uniquement l'URL de redirection PayTech.")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> initiatePayment(
            @Valid @RequestBody ProcessPaymentRequest request,
            Authentication authentication
    ) {
        User buyer = resolveUser(authentication);
        PaymentInitiationResponse response = paymentService.initiatePayment(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(response, "Demande de paiement initialisée. Redirection vers PayTech."));
    }

    @PostMapping("/ipn")
    @Operation(summary = "Webhook IPN PayTech", description = "Endpoint public recevant les notifications de paiement signées par PayTech.")
    public ResponseEntity<Map<String, Object>> handleIpn(
            @RequestBody PayTechIpnPayload payload,
            HttpServletRequest request
    ) {
        String sourceIp = extractClientIp(request);
        paymentService.handlePayTechIpn(payload, sourceIp);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/transfer-ipn")
    @Operation(summary = "Webhook IPN Transfert PayTech", description = "Endpoint public recevant les notifications de statut de versement vendeur.")
    public ResponseEntity<Map<String, Object>> handleTransferIpn(@RequestBody Map<String, Object> payload) {
        String externalId = payload.get("external_id") != null ? String.valueOf(payload.get("external_id")) : null;
        String status = payload.get("status") != null ? String.valueOf(payload.get("status")) : null;
        paymentService.handleTransferIpn(externalId, status);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/order/{orderId}/verify")
    @Operation(summary = "Vérifier l'état réel du paiement d'une commande auprès de PayTech")
    public ResponseEntity<ApiResponse<PaymentDto>> verifyPayment(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User requester = resolveUser(authentication);
        PaymentDto payment = paymentService.verifyOrderPaymentStatus(orderId, requester);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Obtenir les informations de paiement d'une commande")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentByOrderId(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User requester = resolveUser(authentication);
        PaymentDto payment = paymentService.getPaymentByOrderId(orderId, requester);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
