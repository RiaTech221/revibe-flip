package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST dédié à l'authentification et à la sécurité des comptes.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, vérification OTP et connexion")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur", description = "Génère un compte et un code OTP envoyé par SMS")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, extractClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(response, "Compte créé avec succès. Veuillez saisir le code OTP envoyé par SMS."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Validation du code OTP", description = "Active le compte et retourne le token JWT de session")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Numéro vérifié et compte activé avec succès !"));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Renvoyer un nouveau code OTP par SMS")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @RequestParam String phone,
            HttpServletRequest httpRequest) {
        authService.resendOtp(phone, extractClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(null, "Si un compte correspond à ce numéro, un nouveau code OTP a été envoyé."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demander une réinitialisation de mot de passe par OTP SMS")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(request.getPhone(), extractClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(null, "Si ce numéro est associé à un compte, un code de réinitialisation a été envoyé par SMS."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe avec le code OTP reçu par SMS")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Mot de passe réinitialisé avec succès."));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur", description = "Connexion par numéro de téléphone ou email avec mot de passe")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Connexion réussie."));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtenir le profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user)));
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
