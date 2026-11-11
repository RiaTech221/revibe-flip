package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Contrôleur REST d'upload sécurisé des photos d'annonces et photos de profil.
 */
@RestController
@RequestMapping("/api/uploads")
@Slf4j
@Tag(name = "Uploads & Médias", description = "Téléversement et consultation des photos d'articles")
public class UploadController {

    @Value("${revibeflip.upload.dir:uploads/}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Téléverser une image (photo de vêtement, détail chat, profil, etc.)")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Le fichier envoyé est vide."));
        }

        // Limite de taille stricte : 5 Mo max
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("La taille du fichier dépasse la limite autorisée de 5 Mo."));
        }

        // Contrôle du type réel du fichier (JPG, PNG, WebP uniquement)
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg") 
                && !contentType.equalsIgnoreCase("image/png") 
                && !contentType.equalsIgnoreCase("image/webp"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Format de fichier non autorisé. Formats acceptés : JPG, PNG, WebP."));
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = switch (contentType.toLowerCase()) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> ".jpg";
            };

            // Renommage sécurisé côté serveur avec UUID
            String storedFileName = UUID.randomUUID().toString() + extension;
            Path targetLocation = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/uploads/" + storedFileName;
            return ResponseEntity.ok(ApiResponse.ok(fileUrl, "Image téléversée avec succès."));
        } catch (IOException ex) {
            log.error("Erreur lors de l'enregistrement du fichier", ex);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Impossible d'enregistrer l'image."));
        }
    }

    @GetMapping("/{fileName:.+}")
    @Operation(summary = "Servir une image téléversée")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
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
