package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur REST dédié à l'authentification, aux jetons de session et à la réinitialisation de mot de passe.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, vérification OTP, connexion et rafraîchissement")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "revibeflip_refresh_token";

    private final AuthService authService;

    @Value("${revibeflip.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur", description = "Génère un compte et un code OTP envoyé par SMS")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, extractClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok(response, "Compte créé avec succès. Veuillez saisir le code OTP envoyé par SMS."));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Validation du code OTP", description = "Active le compte et retourne les jetons de session")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse response = authService.verifyOtp(request);
        attachRefreshCookie(httpRequest, httpResponse, response.getRefreshToken());
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
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.resetPassword(request);
        clearRefreshCookie(httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.ok(null, "Mot de passe réinitialisé avec succès."));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur", description = "Connexion par numéro de téléphone ou email avec mot de passe")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse response = authService.login(request);
        attachRefreshCookie(httpRequest, httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(response, "Connexion réussie."));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rafraîchir le jeton d'accès avec rotation du jeton de rafraîchissement")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String rawRefreshToken = extractRefreshToken(httpRequest, body);
        AuthResponse response = authService.refreshToken(rawRefreshToken);
        attachRefreshCookie(httpRequest, httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(response, "Session rafraîchie."));
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion et révocation du jeton de rafraîchissement")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String rawRefreshToken = extractRefreshToken(httpRequest, body);
        authService.logout(rawRefreshToken, user);
        clearRefreshCookie(httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.ok(null, "Déconnexion réussie."));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtenir le profil de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user)));
    }

    private void attachRefreshCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        boolean secure = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(refreshExpirationMs / 1000)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecureRequest(request))
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        return request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
    }

    private String extractRefreshToken(HttpServletRequest request, Map<String, String> body) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                    return cookie.getValue();
                }
            }
        }
        if (body != null && body.get("refreshToken") != null) {
            return body.get("refreshToken");
        }
        return null;
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
