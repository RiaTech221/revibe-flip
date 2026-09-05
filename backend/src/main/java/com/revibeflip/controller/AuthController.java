package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, vérification OTP et connexion")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur", description = "Génère un compte et un code OTP de validation SMS")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
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
    public ResponseEntity<ApiResponse<String>> resendOtp(@RequestParam String phone) {
        String newOtp = authService.resendOtp(phone);
        return ResponseEntity.ok(ApiResponse.ok(newOtp, "Nouveau code OTP envoyé avec succès."));
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
}
