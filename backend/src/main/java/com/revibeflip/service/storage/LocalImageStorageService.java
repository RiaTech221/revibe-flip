package com.revibeflip.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Implémentation locale par défaut de {@link ImageStorageService}.
 * Enregistre les images dans {@code <uploadDir>/<context>/<uuid><ext>}.
 */
@Service
@ConditionalOnProperty(name = "revibeflip.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalImageStorageService implements ImageStorageService {

    private final String uploadDir;

    public LocalImageStorageService(@Value("${revibeflip.upload.dir:uploads/}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public String store(byte[] cleanBytes, String context, String extension, String mimeType) throws IOException {
        String safeContext = normalizeContext(context);
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path contextDir = uploadRoot.resolve(safeContext).normalize();
        if (!contextDir.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Répertoire de stockage invalide.");
        }
        if (!Files.exists(contextDir)) {
            Files.createDirectories(contextDir);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path targetLocation = contextDir.resolve(storedFileName).normalize();
        if (!targetLocation.startsWith(contextDir)) {
            throw new IllegalArgumentException("Nom de fichier invalide.");
        }
        Files.write(targetLocation, cleanBytes);
        return "/api/uploads/" + safeContext + "/" + storedFileName;
    }
}
