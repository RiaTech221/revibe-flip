package com.revibeflip.service;

import com.revibeflip.entity.RefreshToken;
import com.revibeflip.entity.User;
import com.revibeflip.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Gestion des jetons de rafraîchissement avec hachage SHA-256, rotation à chaque usage et révocation.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${revibeflip.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public record RotationResult(User user, String rawRefreshToken) {}

    @Transactional
    public String createRefreshToken(User user) {
        String rawToken = generateRawToken();
        RefreshToken entity = RefreshToken.builder()
                .tokenHash(sha256(rawToken))
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    @Transactional
    public RotationResult rotateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Jeton de rafraîchissement manquant.");
        }
        String hash = sha256(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Jeton de rafraîchissement invalide."));

        if (Boolean.TRUE.equals(existing.getRevoked())) {
            // Détection de réutilisation d'un jeton déjà tourné : révocation de toute la famille utilisateur
            refreshTokenRepository.revokeAllByUser(existing.getUser());
            throw new IllegalArgumentException("Jeton de rafraîchissement révoqué. Veuillez vous reconnecter.");
        }

        if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            throw new IllegalArgumentException("Session expirée. Veuillez vous reconnecter.");
        }

        User user = existing.getUser();
        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            refreshTokenRepository.revokeAllByUser(user);
            throw new IllegalStateException("Compte suspendu.");
        }

        String nextRawToken = generateRawToken();
        String nextHash = sha256(nextRawToken);
        existing.setRevoked(true);
        existing.setReplacedByTokenHash(nextHash);
        refreshTokenRepository.save(existing);

        RefreshToken nextEntity = RefreshToken.builder()
                .tokenHash(nextHash)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(nextEntity);

        return new RotationResult(user, nextRawToken);
    }

    @Transactional
    public void revokeByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(sha256(rawToken)).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void revokeAllForUser(User user) {
        if (user != null) {
            refreshTokenRepository.revokeAllByUser(user);
        }
    }

    private String generateRawToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Erreur de hachage SHA-256", e);
        }
    }
}
