package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.PaymentDto;
import com.revibeflip.dto.ProcessPaymentRequest;
import com.revibeflip.entity.User;
import com.revibeflip.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Paiements Mobiles & Escrow", description = "Paiements par Wave, Orange Money, Free Money avec séquestre (Escrow)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @Operation(summary = "Initier un paiement mobile réel (Génère le lien Wave / QR code / Paydunya)")
    public ResponseEntity<ApiResponse<com.revibeflip.dto.InitiatePaymentResponse>> initiatePayment(
            @Valid @RequestBody com.revibeflip.dto.InitiatePaymentRequest request,
            @AuthenticationPrincipal User buyer
    ) {
        com.revibeflip.dto.InitiatePaymentResponse response = paymentService.initiatePayment(request, buyer);
        return ResponseEntity.ok(ApiResponse.ok(response, "Session de paiement initiée."));
    }

    @PostMapping(value = {"/webhook", "/webhook/{provider}"})
    @Operation(summary = "Webhook de notification instantanée de paiement (IPN Wave / Paydunya)")
    public ResponseEntity<ApiResponse<PaymentDto>> handleWebhook(
            @PathVariable(required = false) String provider,
            @RequestBody java.util.Map<String, Object> payload,
            @RequestHeader java.util.Map<String, String> headers
    ) {
        PaymentDto payment = paymentService.processWebhookConfirmation(payload, headers);
        return ResponseEntity.ok(ApiResponse.ok(payment, "Notification de paiement traitée avec succès."));
    }

    @GetMapping("/status/{reference}")
    @Operation(summary = "Vérifier l'état d'un paiement en temps réel par référence de transaction")
    public ResponseEntity<ApiResponse<PaymentDto>> checkPaymentStatus(@PathVariable String reference) {
        PaymentDto payment = paymentService.getPaymentByReference(reference);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @PostMapping("/process")
    @Operation(summary = "Effectuer le paiement mobile direct (Secours / Simulation sandbox)")
    public ResponseEntity<ApiResponse<PaymentDto>> processPayment(
            @Valid @RequestBody ProcessPaymentRequest request,
            @AuthenticationPrincipal User buyer
    ) {
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
