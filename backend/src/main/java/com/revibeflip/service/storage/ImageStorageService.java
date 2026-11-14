package com.revibeflip.service.storage;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;

/**
 * Abstraction de stockage des images (local par défaut, ou Cloudinary en production).
 */
public interface ImageStorageService {

    Set<String> ALLOWED_CONTEXTS = Set.of("products", "avatars", "cms", "disputes", "general");

    /**
     * Stocke les octets d'une image déjà validée et assainie, dans le dossier correspondant au contexte.
     *
     * @param cleanBytes Octets de l'image sans métadonnées EXIF
     * @param context    Contexte métier ({@code products}, {@code avatars}, {@code cms}, {@code disputes}, {@code general})
     * @param extension  Extension normalisée ({@code .jpg}, {@code .png}, {@code .webp})
     * @param mimeType   Type MIME validé ({@code image/jpeg}, {@code image/png}, {@code image/webp})
     * @return URL publique autorisée par la liste blanche ({@code /api/uploads/...} ou {@code https://res.cloudinary.com/...})
     */
    String store(byte[] cleanBytes, String context, String extension, String mimeType) throws IOException;

    default String normalizeContext(String context) {
        if (context == null || context.isBlank()) {
            return "products";
        }
        String normalized = context.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTEXTS.contains(normalized)) {
            throw new IllegalArgumentException("Contexte de stockage non autorisé : " + context);
        }
        return normalized;
    }
}
