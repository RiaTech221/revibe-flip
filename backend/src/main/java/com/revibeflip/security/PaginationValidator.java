package com.revibeflip.security;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.Locale;
import java.util.Set;

/**
 * Validateur centralisé pour le plafonnement de la pagination et la validation stricte des champs de tri (SEC-12).
 * Empêche le DoS par surchage de pagination (OOM) et l'injection / énumération par tri sur colonnes internes ou sensibles.
 */
public final class PaginationValidator {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MIN_PAGE_SIZE = 1;
    public static final int MAX_PAGE_SIZE = 100;

    // Whitelists strictes des champs de tri autorisés par ressource métier
    public static final Set<String> PRODUCT_SORT_FIELDS = Set.of(
            "createdAt", "price", "title", "viewCount", "updatedAt"
    );

    public static final Set<String> ORDER_SORT_FIELDS = Set.of(
            "createdAt", "totalAmount", "status", "updatedAt"
    );

    public static final Set<String> USER_SORT_FIELDS = Set.of(
            "createdAt", "rating", "reviewCount", "firstName", "lastName", "email"
    );

    public static final Set<String> PAYMENT_SORT_FIELDS = Set.of(
            "createdAt", "amount"
    );

    public static final Set<String> REPORT_SORT_FIELDS = Set.of(
            "createdAt", "status"
    );

    public static final Set<String> REVIEW_SORT_FIELDS = Set.of(
            "createdAt", "rating"
    );

    public static final Set<String> CMS_PAGE_SORT_FIELDS = Set.of(
            "createdAt", "sortOrder", "updatedAt", "title"
    );

    public static final Set<String> CONTACT_MESSAGE_SORT_FIELDS = Set.of(
            "createdAt", "status"
    );

    public static final Set<String> NOTIFICATION_SORT_FIELDS = Set.of(
            "createdAt", "isRead"
    );

    public static final Set<String> MEDIA_ASSET_SORT_FIELDS = Set.of(
            "createdAt", "fileSize", "originalFilename"
    );

    public static final Set<String> AUDIT_LOG_SORT_FIELDS = Set.of(
            "createdAt", "actionType"
    );

    public static final Set<String> LEDGER_SORT_FIELDS = Set.of(
            "createdAt", "amount"
    );

    private PaginationValidator() {
        // Empêcher l'instanciation
    }

    /**
     * Valide les paramètres de pagination et de tri, puis instancie un Pageable sécurisé.
     *
     * @param page               Numéro de la page (>= 0)
     * @param size               Taille de la page (1 à 100)
     * @param sortBy             Nom du champ de tri (optionnel, doit appartenir à allowedSortFields)
     * @param sortDir            Direction du tri ("asc" ou "desc", optionnel)
     * @param allowedSortFields  Whitelist des champs de tri autorisés pour la ressource
     * @param defaultSortBy      Champ de tri par défaut si non spécifié
     * @param defaultDirection   Direction de tri par défaut si non spécifiée
     * @return Pageable validé et sécurisé
     * @throws IllegalArgumentException si les paramètres sont invalides
     */
    public static Pageable validateAndCreate(
            int page,
            int size,
            String sortBy,
            String sortDir,
            Set<String> allowedSortFields,
            String defaultSortBy,
            Sort.Direction defaultDirection
    ) {
        validatePage(page);
        validateSize(size);

        Sort.Direction direction = defaultDirection != null ? defaultDirection : Sort.Direction.DESC;
        if (sortDir != null && !sortDir.isBlank()) {
            direction = validateSortDirection(sortDir);
        }

        String targetSortBy = defaultSortBy;
        if (sortBy != null && !sortBy.isBlank()) {
            if (sortBy.contains(",")) {
                String[] parts = sortBy.split(",", 2);
                String field = parts[0].trim();
                validateSortField(field, allowedSortFields);
                targetSortBy = field;
                if (parts.length > 1 && !parts[1].isBlank()) {
                    direction = validateSortDirection(parts[1].trim());
                }
            } else {
                validateSortField(sortBy.trim(), allowedSortFields);
                targetSortBy = sortBy.trim();
            }
        }

        if (targetSortBy != null && !targetSortBy.isBlank()) {
            return PageRequest.of(page, size, Sort.by(direction, targetSortBy));
        }

        return PageRequest.of(page, size);
    }

    /**
     * Valide les paramètres de pagination avec un Sort prédéfini ou personnalisé.
     */
    public static Pageable validateAndCreate(int page, int size, Sort sort) {
        validatePage(page);
        validateSize(size);
        return sort != null ? PageRequest.of(page, size, sort) : PageRequest.of(page, size);
    }

    /**
     * Valide les paramètres de pagination sans tri particulier.
     */
    public static Pageable validateAndCreate(int page, int size) {
        validatePage(page);
        validateSize(size);
        return PageRequest.of(page, size);
    }

    /**
     * Vérifie que le numéro de page est valide (>= 0).
     */
    public static void validatePage(int page) {
        if (page < 0) {
            throw new IllegalArgumentException("Le numéro de page ne peut pas être négatif (reçu : " + page + ").");
        }
    }

    /**
     * Vérifie que la taille de page est comprise entre 1 et MAX_PAGE_SIZE (100).
     */
    public static void validateSize(int size) {
        if (size < MIN_PAGE_SIZE) {
            throw new IllegalArgumentException("La taille de page doit être supérieure ou égale à " + MIN_PAGE_SIZE + " (reçu : " + size + ").");
        }
        if (size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("La taille de page ne peut pas dépasser la limite maximale de " + MAX_PAGE_SIZE + " (reçu : " + size + ").");
        }
    }

    /**
     * Vérifie et normalise la direction de tri.
     */
    public static Sort.Direction validateSortDirection(String sortDir) {
        if (sortDir == null || sortDir.isBlank()) {
            return Sort.Direction.DESC;
        }
        String normalized = sortDir.trim().toLowerCase(Locale.ROOT);
        if ("asc".equals(normalized)) {
            return Sort.Direction.ASC;
        }
        if ("desc".equals(normalized)) {
            return Sort.Direction.DESC;
        }
        throw new IllegalArgumentException("Direction de tri invalide : '" + sortDir + "'. Valeurs acceptées : 'asc', 'desc'.");
    }

    /**
     * Vérifie que le champ de tri appartient à la liste blanche autorisée.
     */
    public static void validateSortField(String sortBy, Set<String> allowedSortFields) {
        if (sortBy == null || sortBy.isBlank()) {
            return;
        }
        if (allowedSortFields == null || allowedSortFields.isEmpty()) {
            throw new IllegalArgumentException("Aucun tri dynamique n'est autorisé pour cette ressource.");
        }
        String trimmedField = sortBy.trim();
        if (!allowedSortFields.contains(trimmedField)) {
            throw new IllegalArgumentException("Champ de tri non autorisé : '" + trimmedField + "'. Champs autorisés : " + allowedSortFields);
        }
    }
}
