package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contenus & Pages Publiques", description = "Endpoints publics pour le footer, les pages dynamiques, la FAQ et le contact")
public class PublicContentController {

    private final ContentSettingService contentSettingService;
    private final CmsPageService cmsPageService;
    private final FaqService faqService;
    private final ContactService contactService;
    private final MediaAssetService mediaAssetService;

    @Operation(summary = "Récupérer la configuration dynamique du footer (liens, réseaux sociaux, support, mentions)")
    @GetMapping("/api/content/footer")
    public ResponseEntity<ApiResponse<FooterConfigDto>> getFooterConfig() {
        return ResponseEntity.ok(ApiResponse.ok(contentSettingService.getFooterConfig()));
    }

    @Operation(summary = "Récupérer le bandeau d'annonce actif")
    @GetMapping("/api/content/announcement")
    public ResponseEntity<ApiResponse<AnnouncementBannerDto>> getAnnouncementBanner() {
        return ResponseEntity.ok(ApiResponse.ok(contentSettingService.getAnnouncementBanner()));
    }

    @Operation(summary = "Lister toutes les pages publiées")
    @GetMapping("/api/pages")
    public ResponseEntity<ApiResponse<List<CmsPageDto>>> getAllPages() {
        return ResponseEntity.ok(ApiResponse.ok(cmsPageService.getAllPublishedPages()));
    }

    @Operation(summary = "Afficher une page par son adresse (slug)")
    @GetMapping("/api/pages/{slug}")
    public ResponseEntity<ApiResponse<CmsPageDto>> getPageBySlug(
            @PathVariable String slug,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.ok(cmsPageService.getPublishedPageBySlug(slug, currentUser)));
    }

    @Operation(summary = "Lister toutes les questions de la FAQ publiées")
    @GetMapping("/api/faq")
    public ResponseEntity<ApiResponse<List<FaqItemDto>>> getFaqItems() {
        return ResponseEntity.ok(ApiResponse.ok(faqService.getPublishedFaqItems()));
    }

    @Operation(summary = "Envoyer un message de contact au support (avec limitation anti-spam par IP)")
    @PostMapping("/api/contact")
    public ResponseEntity<ApiResponse<ContactMessageDto>> submitContact(
            @Valid @RequestBody ContactMessageRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        ContactMessageDto result = contactService.submitMessage(request, clientIp);
        return ResponseEntity.ok(ApiResponse.ok(result, "Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais."));
    }

    @Operation(summary = "Télécharger ou visualiser un média (image ou PDF)")
    @GetMapping("/api/media/{filename:.+}")
    public ResponseEntity<Resource> serveMedia(@PathVariable String filename) {
        try {
            Path file = mediaAssetService.getMediaFilePath(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                String lower = filename.toLowerCase();
                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (lower.endsWith(".png")) contentType = "image/png";
                else if (lower.endsWith(".webp")) contentType = "image/webp";
                else if (lower.endsWith(".pdf")) contentType = "application/pdf";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
