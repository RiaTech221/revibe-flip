package com.revibeflip.dto;

import com.revibeflip.entity.User;

/**
 * SEC-01 — DTO public d'un utilisateur.
 *
 * <p>Contient uniquement les champs non-sensibles visibles par n'importe qui,
 * sans authentification. Les champs PII (phone, email, address) et les
 * métadonnées de sécurité (role, isSuspended, mustChangePassword) sont
 * volontairement exclus.
 *
 * <p>Utiliser ce DTO pour tout endpoint public (GET /api/users/{id},
 * ProductDto.seller, etc.). Continuer à utiliser {@link UserDto} pour les
 * endpoints authentifiés qui concernent l'utilisateur lui-même ou pour
 * l'interface d'administration.
 */
public record PublicUserDto(
        Long id,
        String fullName,
        String profilePicture,
        String city,
        String countryCode,
        String flagEmoji,
        Boolean isVerified,
        Double rating,
        Integer reviewCount,
        Double trustScore
) {
    public static PublicUserDto fromEntity(User user) {
        if (user == null) return null;
        return new PublicUserDto(
                user.getId(),
                user.getFullName(),
                user.getProfilePicture(),
                user.getCity(),
                user.getCountry() != null ? user.getCountry().getCode() : null,
                user.getCountry() != null ? user.getCountry().getFlagEmoji() : null,
                user.getIsVerified(),
                user.getRating(),
                user.getReviewCount() != null ? user.getReviewCount() : 0,
                user.getTrustScore()
        );
    }
}
