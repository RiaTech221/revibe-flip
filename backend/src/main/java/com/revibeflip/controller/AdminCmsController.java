package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ContactMessageStatus;
import com.revibeflip.entity.enums.PageStatus;
import com.revibeflip.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/cms")
@PreAuthorize("hasRole('ADMIN')")
/**
 * Contrôleur d'administration pour la gestion des contenus CMS de ReVibe FliP.
 * Permet la création, l'édition, le versionnement et la publication des pages légales, de la FAQ et des bannières.
 */
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Administration - Contenus & Pages", description = "Gestion éditoriale du site : Pages, FAQ, Footer, Réseaux Sociaux, Bandeaux et Médias")
public class AdminCmsController {

    private final CmsPageService cmsPageService;
    private final FaqService faqService;
    private final ContentSettingService contentSettingService;
    private final ContactService contactService;
    private final MediaAssetService mediaAssetService;

    // --- 1. GESTION DES PAGES ---

    @Operation(summary = "Lister les pages (avec recherche, filtre statut et pagination)")
    @GetMapping("/pages")
    public ResponseEntity<ApiResponse<PageResponseDto<CmsPageDto>>> getPages(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PageStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Page<CmsPageDto> result = cmsPageService.adminGetPages(
                search, status, PageRequest.of(page, size, Sort.by("sortOrder").ascending().and(Sort.by("updatedAt").descending()))
        );
        return ResponseEntity.ok(ApiResponse.ok(PageResponseDto.fromPage(result)));
    }

    @Operation(summary = "Détail d'une page par son ID")
    @GetMapping("/pages/{id}")
    public ResponseEntity<ApiResponse<CmsPageDto>> getPageById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(cmsPageService.adminGetPageById(id)));
    }

    @Operation(summary = "Créer une nouvelle page")
    @PostMapping("/pages")
    public ResponseEntity<ApiResponse<CmsPageDto>> createPage(
            @Valid @RequestBody CreatePageRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                cmsPageService.adminCreatePage(request, admin),
                "Page créée avec succès."
        ));
    }

    @Operation(summary = "Modifier une page (crée une nouvelle version)")
    @PutMapping("/pages/{id}")
    public ResponseEntity<ApiResponse<CmsPageDto>> updatePage(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePageRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                cmsPageService.adminUpdatePage(id, request, admin),
                "Page mise à jour avec succès."
        ));
    }

    @Operation(summary = "Supprimer une page")
    @DeleteMapping("/pages/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force,
            @AuthenticationPrincipal User admin
    ) {
        cmsPageService.adminDeletePage(id, admin, force);
        return ResponseEntity.ok(ApiResponse.ok(null, "Page supprimée avec succès."));
    }

    @Operation(summary = "Historique des versions d'une page")
    @GetMapping("/pages/{id}/versions")
    public ResponseEntity<ApiResponse<List<PageVersionDto>>> getPageVersions(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(cmsPageService.adminGetPageVersions(id)));
    }

    @Operation(summary = "Restaurer une version antérieure d'une page")
    @PostMapping("/pages/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<ApiResponse<CmsPageDto>> restoreVersion(
            @PathVariable Long id,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                cmsPageService.adminRestoreVersion(id, versionNumber, admin),
                "Version " + versionNumber + " restaurée avec succès."
        ));
    }

    // --- 2. GESTION DE LA FAQ ---

    @Operation(summary = "Lister toutes les questions FAQ")
    @GetMapping("/faq")
    public ResponseEntity<ApiResponse<List<FaqItemDto>>> getFaq() {
        return ResponseEntity.ok(ApiResponse.ok(faqService.adminGetAllFaqItems()));
    }

    @Operation(summary = "Ajouter une question FAQ")
    @PostMapping("/faq")
    public ResponseEntity<ApiResponse<FaqItemDto>> createFaq(
            @Valid @RequestBody FaqItemRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                faqService.adminCreateFaqItem(request, admin),
                "Question FAQ ajoutée avec succès."
        ));
    }

    @Operation(summary = "Modifier une question FAQ")
    @PutMapping("/faq/{id}")
    public ResponseEntity<ApiResponse<FaqItemDto>> updateFaq(
            @PathVariable Long id,
            @Valid @RequestBody FaqItemRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                faqService.adminUpdateFaqItem(id, request, admin),
                "Question FAQ modifiée avec succès."
        ));
    }

    @Operation(summary = "Supprimer une question FAQ")
    @DeleteMapping("/faq/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin
    ) {
        faqService.adminDeleteFaqItem(id, admin);
        return ResponseEntity.ok(ApiResponse.ok(null, "Question FAQ supprimée."));
    }

    // --- 3. FOOTER & RÉSEAUX SOCIAUX ---

    @Operation(summary = "Configuration du footer et réseaux sociaux")
    @GetMapping("/footer")
    public ResponseEntity<ApiResponse<FooterConfigDto>> getFooter() {
        return ResponseEntity.ok(ApiResponse.ok(contentSettingService.getFooterConfig()));
    }

    @Operation(summary = "Modifier la configuration du footer et réseaux sociaux")
    @PutMapping("/footer")
    public ResponseEntity<ApiResponse<FooterConfigDto>> updateFooter(
            @RequestBody UpdateFooterConfigRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                contentSettingService.adminUpdateFooterConfig(request, admin),
                "Configuration du footer mise à jour avec succès."
        ));
    }

    // --- 4. BANDEAU D'ANNONCE ---

    @Operation(summary = "Récupérer la configuration du bandeau d'annonce")
    @GetMapping("/announcement")
    public ResponseEntity<ApiResponse<AnnouncementBannerDto>> getAnnouncement() {
        return ResponseEntity.ok(ApiResponse.ok(contentSettingService.getAnnouncementBanner()));
    }

    @Operation(summary = "Mettre à jour le bandeau d'annonce")
    @PutMapping("/announcement")
    public ResponseEntity<ApiResponse<AnnouncementBannerDto>> updateAnnouncement(
            @RequestBody UpdateAnnouncementRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                contentSettingService.adminUpdateAnnouncement(request, admin),
                "Bandeau d'annonce mis à jour."
        ));
    }

    // --- 5. MESSAGES DE CONTACT ---

    @Operation(summary = "Consulter les messages de contact des utilisateurs")
    @GetMapping("/contact-messages")
    public ResponseEntity<ApiResponse<PageResponseDto<ContactMessageDto>>> getContactMessages(
            @RequestParam(required = false) ContactMessageStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Page<ContactMessageDto> result = contactService.adminGetMessages(
                status, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok(PageResponseDto.fromPage(result)));
    }

    @Operation(summary = "Changer le statut d'un message de contact (nouveau / traité) et ajouter une note interne")
    @PutMapping("/contact-messages/{id}")
    public ResponseEntity<ApiResponse<ContactMessageDto>> updateContactMessageStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateContactMessageStatusRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                contactService.adminUpdateStatus(id, request, admin),
                "Message de contact mis à jour."
        ));
    }

    // --- 6. MÉDIATHÈQUE ---

    @Operation(summary = "Lister les médias téléversés")
    @GetMapping("/media")
    public ResponseEntity<ApiResponse<PageResponseDto<MediaAssetDto>>> getMediaAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<MediaAssetDto> result = mediaAssetService.adminGetMediaAssets(
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok(PageResponseDto.fromPage(result)));
    }

    @Operation(summary = "Téléverser un nouveau média (JPG, PNG, WebP ou PDF; SVG strictement refusé)")
    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaAssetDto>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "altText", required = false) String altText,
            @AuthenticationPrincipal User admin
    ) throws IOException {
        MediaAssetDto asset = mediaAssetService.uploadMedia(file, altText, admin);
        return ResponseEntity.ok(ApiResponse.ok(asset, "Média téléversé avec succès."));
    }

    @Operation(summary = "Supprimer un média")
    @DeleteMapping("/media/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(@PathVariable Long id) {
        mediaAssetService.adminDeleteMediaAsset(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Média supprimé avec succès."));
    }
}
