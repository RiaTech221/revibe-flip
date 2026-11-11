package com.revibeflip.service;

import com.revibeflip.dto.MediaAssetDto;
import com.revibeflip.entity.MediaAsset;
import com.revibeflip.entity.User;
import com.revibeflip.repository.MediaAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaAssetService {

    private final MediaAssetRepository mediaAssetRepository;

    private static final String UPLOAD_DIR = "uploads/media";
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");
    private static final String PDF_TYPE = "application/pdf";
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_PDF_SIZE = 10 * 1024 * 1024;   // 10 MB

    @Transactional
    public MediaAssetDto uploadMedia(MultipartFile file, String altText, User user) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Aucun fichier fourni.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "fichier";
        String lowerName = originalName.toLowerCase();

        // 1. REFUS STRICT DU FORMAT SVG
        if (lowerName.endsWith(".svg") || "image/svg+xml".equalsIgnoreCase(file.getContentType())) {
            throw new IllegalArgumentException("Le format vectoriel SVG est strictement refusé pour des raisons de sécurité.");
        }

        String contentType = file.getContentType();
        boolean isImage = contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());
        boolean isPdf = contentType != null && PDF_TYPE.equalsIgnoreCase(contentType);

        if (!isImage && !isPdf) {
            throw new IllegalArgumentException("Format de fichier non supporté. Formats acceptés : JPG, PNG, WebP et PDF.");
        }

        // 2. Contrôle de taille
        if (isImage && file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("L'image dépasse la taille maximale autorisée de 5 Mo.");
        }
        if (isPdf && file.getSize() > MAX_PDF_SIZE) {
            throw new IllegalArgumentException("Le document PDF dépasse la taille maximale autorisée de 10 Mo.");
        }

        // 3. Texte alternatif obligatoire pour les images (accessibilité)
        if (isImage && (altText == null || altText.trim().length() < 3)) {
            throw new IllegalArgumentException("Le texte alternatif (description de l'image) est obligatoire pour l'accessibilité.");
        }

        // 4. Renommage sécurisé par UUID
        String extension = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            extension = originalName.substring(dotIdx).toLowerCase();
        }
        String safeFilename = UUID.randomUUID().toString() + extension;

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path targetLocation = uploadPath.resolve(safeFilename);
        Files.copy(file.getInputStream(), targetLocation);

        String publicUrl = "/api/media/" + safeFilename;

        MediaAsset asset = MediaAsset.builder()
                .filename(safeFilename)
                .originalFilename(originalName)
                .fileType(contentType)
                .fileSize(file.getSize())
                .url(publicUrl)
                .altText(isImage ? altText.trim() : "Document PDF")
                .uploadedBy(user)
                .createdAt(LocalDateTime.now())
                .build();

        return toDto(mediaAssetRepository.save(asset));
    }

    @Transactional(readOnly = true)
    public Page<MediaAssetDto> adminGetMediaAssets(Pageable pageable) {
        return mediaAssetRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional
    public void adminDeleteMediaAsset(Long id) {
        mediaAssetRepository.findById(id).ifPresent(asset -> {
            try {
                Path filePath = Paths.get(UPLOAD_DIR).resolve(asset.getFilename());
                Files.deleteIfExists(filePath);
            } catch (Exception e) {
                log.warn("Impossible de supprimer le fichier physique {} : {}", asset.getFilename(), e.getMessage());
            }
            mediaAssetRepository.delete(asset);
        });
    }

    public Path getMediaFilePath(String filename) {
        return Paths.get(UPLOAD_DIR).resolve(filename);
    }

    private MediaAssetDto toDto(MediaAsset a) {
        return MediaAssetDto.builder()
                .id(a.getId())
                .filename(a.getFilename())
                .originalFilename(a.getOriginalFilename())
                .fileType(a.getFileType())
                .fileSize(a.getFileSize())
                .url(a.getUrl())
                .altText(a.getAltText())
                .uploadedByName(a.getUploadedBy() != null ? a.getUploadedBy().getFullName() : "Admin")
                .createdAt(a.getCreatedAt())
                .build();
    }
}
