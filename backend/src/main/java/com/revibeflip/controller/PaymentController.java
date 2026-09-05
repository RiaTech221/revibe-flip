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

    @PostMapping("/process")
    @Operation(summary = "Effectuer le paiement mobile (Wave, Orange Money, Free Money)")
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
