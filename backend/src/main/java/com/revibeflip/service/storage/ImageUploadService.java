package com.revibeflip.service.storage;

import com.revibeflip.security.SafeMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;

/**
 * Service centralisé de validation, assainissement et stockage d'images (JPG, PNG, WebP ≤ 5 Mo).
 * Délègue le stockage effectif à {@link ImageStorageService} (Cloud Storage Cloudinary en production ou local en dev).
 */
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    public static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024L * 1024L; // 5 Mo
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private final ImageStorageService imageStorageService;

    /**
     * Valide un fichier image (non vide, taille ≤ 5 Mo, format JPG/PNG/WebP vérifié par
     * Content-Type, magic bytes et Apache Tika), supprime ses métadonnées EXIF/XMP et
     * le stocke via {@link ImageStorageService}.
     *
     * @param file    Fichier multipart téléversé
     * @param context Contexte de stockage (ex. {@code avatars}, {@code products})
     * @return URL publique de l'image stockée
     * @throws IllegalArgumentException si le fichier est vide, trop lourd ou d'un format interdit
     * @throws IOException              si le stockage échoue
     */
    public String uploadImage(MultipartFile file, String context) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier envoyé est vide.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("La taille du fichier dépasse la limite autorisée de 5 Mo.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.trim().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Format de fichier non autorisé. Formats acceptés : JPG, PNG, WebP.");
        }

        String safeContext = imageStorageService.normalizeContext(context);
        byte[] rawBytes = file.getBytes();
        if (rawBytes.length > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("La taille du fichier dépasse la limite autorisée de 5 Mo.");
        }

        SafeMediaService.DetectedType detected = SafeMediaService.detectType(rawBytes, false);
        SafeMediaService.verifyImageWithTika(rawBytes, detected);
        byte[] cleanBytes = SafeMediaService.sanitizeImage(rawBytes, detected);

        return imageStorageService.store(cleanBytes, safeContext, detected.extension, detected.mimeType);
    }
}
