package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.security.SafeMediaService;
import com.revibeflip.service.storage.ImageStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Contrôleur REST d'upload sécurisé des photos d'annonces, avatars, litiges et CMS.
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Uploads & Médias", description = "Téléversement et consultation des photos d'articles")
public class UploadController {

    private final ImageStorageService imageStorageService;

    @Value("${revibeflip.upload.dir:uploads/}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Téléverser une image (photo de vêtement, détail chat, profil, etc.)")
    public ResponseEntity<ApiResponse<String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "context", required = false, defaultValue = "products") String context) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Le fichier envoyé est vide."));
        }

        // Limite de taille stricte : 5 Mo max
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("La taille du fichier dépasse la limite autorisée de 5 Mo."));
        }

        // Contrôle du type déclaré du fichier (JPG, PNG, WebP uniquement)
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg")
                && !contentType.equalsIgnoreCase("image/png")
                && !contentType.equalsIgnoreCase("image/webp"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Format de fichier non autorisé. Formats acceptés : JPG, PNG, WebP."));
        }

        try {
            byte[] rawBytes = file.getBytes();
            SafeMediaService.DetectedType detected = SafeMediaService.detectType(rawBytes, false);
            SafeMediaService.verifyImageWithTika(rawBytes, detected);
            byte[] cleanBytes = SafeMediaService.sanitizeImage(rawBytes, detected);

            String fileUrl = imageStorageService.store(cleanBytes, context, detected.extension, detected.mimeType);
            return ResponseEntity.ok(ApiResponse.ok(fileUrl, "Image téléversée avec succès."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IOException ex) {
            log.error("Erreur lors de l'enregistrement du fichier", ex);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Impossible d'enregistrer l'image."));
        }
    }

    @GetMapping("/{context}/{fileName:.+}")
    @Operation(summary = "Servir une image téléversée dans un dossier contextuel")
    public ResponseEntity<Resource> getFileInContext(@PathVariable String context, @PathVariable String fileName) {
        try {
            String safeContext = imageStorageService.normalizeContext(context);
            return serveLocalFile(Paths.get(uploadDir).toAbsolutePath().normalize().resolve(safeContext).resolve(fileName));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{fileName:.+}")
    @Operation(summary = "Servir une image téléversée")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        return serveLocalFile(Paths.get(uploadDir).toAbsolutePath().normalize().resolve(fileName));
    }

    private ResponseEntity<Resource> serveLocalFile(Path unresolvedPath) {
        try {
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = unresolvedPath.normalize();
            if (!filePath.startsWith(uploadRoot)) {
                return ResponseEntity.badRequest().build();
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header("X-Content-Type-Options", "nosniff")
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
