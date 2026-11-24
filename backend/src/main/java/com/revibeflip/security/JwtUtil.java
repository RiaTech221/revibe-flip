package com.revibeflip.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.function.Function;

/**
 * Utilitaire cryptographique pour la génération, la signature et la validation des jetons JWT (SEC-05).
 * Utilise explicitement HS256 avec clé >= 256 bits issue de l'environnement et durée de vie courte (15 min).
 */
@Component
@Slf4j
public class JwtUtil {

    private final Environment environment;

    @Value("${revibeflip.jwt.secret:}")
    private String secret;

    @Value("${revibeflip.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    private static final String KNOWN_DEV_SECRET = "9a3f2c5d8e1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d2a5f8e1b4a7f0c3e6b9d";
    private static final int MIN_SECRET_BYTES = 32; // 256 bits

    public JwtUtil(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateSecret() {
        boolean isProduction = environment != null &&
                (environment.matchesProfiles("prod") || "production".equalsIgnoreCase(environment.getProperty("APP_ENV")));

        if (isProduction) {
            // SEC-05 : En production, le secret doit être fourni explicitement hors du code (Render)
            if (secret == null || secret.isBlank()) {
                throw new IllegalStateException("ÉCHEC DÉMARRAGE PRODUCTION (SEC-05) : La variable d'environnement REVIBE_JWT_SECRET est obligatoire.");
            }
            if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
                throw new IllegalStateException(String.format(
                        "ÉCHEC DÉMARRAGE PRODUCTION (SEC-05) : REVIBE_JWT_SECRET doit contenir au moins %d octets (256 bits). Longueur reçue : %d octets.",
                        MIN_SECRET_BYTES, secret.getBytes(StandardCharsets.UTF_8).length));
            }
            if (KNOWN_DEV_SECRET.equalsIgnoreCase(secret.trim())) {
                throw new IllegalStateException("ÉCHEC DÉMARRAGE PRODUCTION (SEC-05) : La clé de signature en production ne peut pas être la clé de développement connue du dépôt Git.");
            }
        } else {
            // Profil local / test / dev : si non défini, génère une clé éphémère sécurisée en mémoire
            if (secret == null || secret.isBlank()) {
                log.warn("⚠️ SEC-05 : Aucun secret REVIBE_JWT_SECRET défini en local. Génération d'une clé cryptographique éphémère de 256 bits pour la session.");
                byte[] ephemeral = new byte[MIN_SECRET_BYTES];
                new SecureRandom().nextBytes(ephemeral);
                this.secret = HexFormat.of().formatHex(ephemeral);
            } else if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
                throw new IllegalStateException(String.format(
                        "REVIBE_JWT_SECRET doit contenir au moins %d octets (256 bits). Longueur reçue : %d octets.",
                        MIN_SECRET_BYTES, secret.getBytes(StandardCharsets.UTF_8).length));
            }
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails, Long userId, String role, String fullName) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("fullName", fullName);
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
