package com.revibeflip.service;

import com.revibeflip.dto.CmsPageDto;
import com.revibeflip.dto.CreatePageRequest;
import com.revibeflip.dto.PageVersionDto;
import com.revibeflip.dto.UpdatePageRequest;
import com.revibeflip.entity.AdminActionLog;
import com.revibeflip.entity.CmsPage;
import com.revibeflip.entity.PageVersion;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.AdminActionLogRepository;
import com.revibeflip.repository.CmsPageRepository;
import com.revibeflip.repository.PageVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service de gestion de contenu pour les pages institutionnelles avec historique de versionnement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CmsPageService {

    private final CmsPageRepository cmsPageRepository;
    private final PageVersionRepository pageVersionRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final HtmlSanitizerService htmlSanitizerService;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile(
            "(\\[\\s*À\\s*COMPLÉTER|\\bTODO\\b|\\bFIXME\\b|\\blorem\\s+ipsum\\b)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private void validateNoPlaceholdersWhenPublished(PageStatus status, String content) {
        if (PageStatus.PUBLISHED.equals(status) && content != null && PLACEHOLDER_PATTERN.matcher(content).find()) {
            throw new IllegalArgumentException(
                    "Impossible de publier une page contenant des mentions à compléter ou placeholders."
            );
        }
    }

    // --- LECTURE PUBLIQUE ---

    @Transactional(readOnly = true)
    public CmsPageDto getPublishedPageBySlug(String slug, User currentUser) {
        boolean isAdmin = currentUser != null && Role.ROLE_ADMIN.equals(currentUser.getRole());

        CmsPage page = cmsPageRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("La page demandée n'existe pas."));

        if (!PageStatus.PUBLISHED.equals(page.getStatus()) && !isAdmin) {
            throw new IllegalArgumentException("Cette page est actuellement en cours de rédaction (brouillon).");
        }

        return toDto(page);
    }

    @Transactional(readOnly = true)
    public List<CmsPageDto> getPublishedPagesForFooter(FooterColumn column) {
        return cmsPageRepository.findByShowInFooterTrueAndStatusAndFooterColumnOrderBySortOrderAscTitleAsc(
                PageStatus.PUBLISHED, column
        ).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CmsPageDto> getAllPublishedPages() {
        return cmsPageRepository.findByStatusOrderBySortOrderAscTitleAsc(PageStatus.PUBLISHED)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // --- GESTION ADMINISTRATEUR ---

    @Transactional(readOnly = true)
    public Page<CmsPageDto> adminGetPages(String search, PageStatus status, Pageable pageable) {
        Page<CmsPage> page;
        if (search != null && !search.isBlank()) {
            if (status != null) {
                page = cmsPageRepository.findByStatusAndTitleContainingIgnoreCase(status, search.trim(), pageable);
            } else {
                page = cmsPageRepository.findByTitleContainingIgnoreCaseOrSlugContainingIgnoreCase(
                        search.trim(), search.trim(), pageable
                );
            }
        } else if (status != null) {
            page = cmsPageRepository.findByStatusAndTitleContainingIgnoreCase(status, "", pageable);
        } else {
            page = cmsPageRepository.findAll(pageable);
        }
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public CmsPageDto adminGetPageById(Long id) {
        CmsPage page = cmsPageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Page introuvable."));
        return toDto(page);
    }

    @Transactional
    public CmsPageDto adminCreatePage(CreatePageRequest request, User admin) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? toSlug(request.getSlug())
                : toSlug(request.getTitle());

        if (cmsPageRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        String sanitizedContent = htmlSanitizerService.sanitize(request.getContent());
        PageStatus targetStatus = request.getStatus() != null ? request.getStatus() : PageStatus.PUBLISHED;
        validateNoPlaceholdersWhenPublished(targetStatus, sanitizedContent);

        CmsPage page = CmsPage.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .content(sanitizedContent)
                .status(request.getStatus() != null ? request.getStatus() : PageStatus.PUBLISHED)
                .showInFooter(request.getShowInFooter() != null ? request.getShowInFooter() : true)
                .footerColumn(request.getFooterColumn() != null ? request.getFooterColumn() : FooterColumn.HELP)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isSystemPage(false)
                .pdfUrl(request.getPdfUrl())
                .updatedBy(admin)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CmsPage savedPage = cmsPageRepository.save(page);

        // Créer version 1
        PageVersion v1 = PageVersion.builder()
                .page(savedPage)
                .versionNumber(1)
                .title(savedPage.getTitle())
                .content(savedPage.getContent())
                .pdfUrl(savedPage.getPdfUrl())
                .status(savedPage.getStatus())
                .changeSummary("Création initiale de la page")
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .build();
        pageVersionRepository.save(v1);

        logAdminAction(admin, "PAGE_CREATE", "CMS_PAGE", savedPage.getId().toString(),
                "Création de la page '" + savedPage.getTitle() + "' (" + savedPage.getSlug() + ")");

        return toDto(savedPage);
    }

    @Transactional
    public CmsPageDto adminUpdatePage(Long id, UpdatePageRequest request, User admin) {
        CmsPage page = cmsPageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Page introuvable."));

        // Protection des pages légales essentielles contre la dépublication intempestive
        if (Boolean.TRUE.equals(page.getIsSystemPage()) && PageStatus.DRAFT.equals(request.getStatus())) {
            log.warn("Tentative de dépublication d'une page légale système (id: {}) par admin {}", id, admin.getEmail());
        }

        String sanitizedContent = htmlSanitizerService.sanitize(request.getContent());
        PageStatus targetStatus = request.getStatus() != null ? request.getStatus() : page.getStatus();
        validateNoPlaceholdersWhenPublished(targetStatus, sanitizedContent);

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String newSlug = toSlug(request.getSlug());
            if (!newSlug.equals(page.getSlug())) {
                if (Boolean.TRUE.equals(page.getIsSystemPage())) {
                    throw new IllegalArgumentException("L'adresse URL d'une page système ne peut pas être modifiée.");
                }
                if (cmsPageRepository.existsBySlug(newSlug)) {
                    throw new IllegalArgumentException("Cette adresse URL (slug) est déjà utilisée par une autre page.");
                }
                page.setSlug(newSlug);
            }
        }

        page.setTitle(request.getTitle().trim());
        page.setContent(sanitizedContent);
        if (request.getStatus() != null) page.setStatus(request.getStatus());
        if (request.getShowInFooter() != null) page.setShowInFooter(request.getShowInFooter());
        if (request.getFooterColumn() != null) page.setFooterColumn(request.getFooterColumn());
        if (request.getSortOrder() != null) page.setSortOrder(request.getSortOrder());
        page.setPdfUrl(request.getPdfUrl());
        page.setUpdatedBy(admin);
        page.setUpdatedAt(LocalDateTime.now());

        CmsPage savedPage = cmsPageRepository.save(page);

        // Calcul du prochain numéro de version
        List<PageVersion> versions = pageVersionRepository.findByPageIdOrderByVersionNumberDesc(page.getId());
        int nextVersionNumber = versions.isEmpty() ? 1 : (versions.get(0).getVersionNumber() + 1);

        PageVersion newVersion = PageVersion.builder()
                .page(savedPage)
                .versionNumber(nextVersionNumber)
                .title(savedPage.getTitle())
                .content(savedPage.getContent())
                .pdfUrl(savedPage.getPdfUrl())
                .status(savedPage.getStatus())
                .changeSummary(request.getChangeSummary() != null && !request.getChangeSummary().isBlank()
                        ? request.getChangeSummary().trim()
                        : "Modification v" + nextVersionNumber)
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .build();
        pageVersionRepository.save(newVersion);

        logAdminAction(admin, "PAGE_UPDATE", "CMS_PAGE", savedPage.getId().toString(),
                "Mise à jour v" + nextVersionNumber + " de '" + savedPage.getTitle() + "'");

        return toDto(savedPage);
    }

    @Transactional(readOnly = true)
    public List<PageVersionDto> adminGetPageVersions(Long pageId) {
        return pageVersionRepository.findByPageIdOrderByVersionNumberDesc(pageId)
                .stream().map(this::toVersionDto).collect(Collectors.toList());
    }

    @Transactional
    public CmsPageDto adminRestoreVersion(Long pageId, Integer versionNumber, User admin) {
        CmsPage page = cmsPageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Page introuvable."));

        PageVersion versionToRestore = pageVersionRepository.findByPageIdAndVersionNumber(pageId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException("Version introuvable."));

        page.setTitle(versionToRestore.getTitle());
        page.setContent(versionToRestore.getContent());
        page.setPdfUrl(versionToRestore.getPdfUrl());
        page.setUpdatedBy(admin);
        page.setUpdatedAt(LocalDateTime.now());

        CmsPage savedPage = cmsPageRepository.save(page);

        List<PageVersion> versions = pageVersionRepository.findByPageIdOrderByVersionNumberDesc(page.getId());
        int nextVersionNumber = versions.isEmpty() ? 1 : (versions.get(0).getVersionNumber() + 1);

        PageVersion restoreLogVersion = PageVersion.builder()
                .page(savedPage)
                .versionNumber(nextVersionNumber)
                .title(savedPage.getTitle())
                .content(savedPage.getContent())
                .pdfUrl(savedPage.getPdfUrl())
                .status(savedPage.getStatus())
                .changeSummary("Restauration depuis la version " + versionNumber)
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .build();
        pageVersionRepository.save(restoreLogVersion);

        logAdminAction(admin, "PAGE_RESTORE", "CMS_PAGE", savedPage.getId().toString(),
                "Restauration de la version " + versionNumber + " pour '" + savedPage.getTitle() + "'");

        return toDto(savedPage);
    }

    @Transactional
    public void adminDeletePage(Long id, User admin, boolean force) {
        CmsPage page = cmsPageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Page introuvable."));

        if (Boolean.TRUE.equals(page.getIsSystemPage())) {
            throw new IllegalStateException("Les pages légales du système (CGU, Confidentialité, Mentions Légales) ne peuvent pas être supprimées.");
        }

        if (Boolean.TRUE.equals(page.getShowInFooter()) && !force) {
            throw new IllegalStateException("Cette page est actuellement affichée dans le footer. Confirmez explicitement pour la supprimer.");
        }

        logAdminAction(admin, "PAGE_DELETE", "CMS_PAGE", page.getId().toString(),
                "Suppression de la page '" + page.getTitle() + "' (" + page.getSlug() + ")");

        cmsPageRepository.delete(page);
    }

    // --- UTILITAIRES ---

    public static String toSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input.trim().toLowerCase(Locale.FRENCH)).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.replaceAll("-+", "-").replaceAll("^-|-$", "");
    }

    private void logAdminAction(User admin, String actionType, String targetType, String targetId, String details) {
        try {
            adminActionLogRepository.save(AdminActionLog.builder()
                    .admin(admin)
                    .actionType(actionType)
                    .targetType(targetType)
                    .targetId(targetId)
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Impossible d'enregistrer l'audit log : {}", e.getMessage());
        }
    }

    private CmsPageDto toDto(CmsPage p) {
        List<PageVersion> versions = p.getVersions();
        int currentVersion = versions == null || versions.isEmpty() ? 1 : versions.get(0).getVersionNumber();

        return CmsPageDto.builder()
                .id(p.getId())
                .slug(p.getSlug())
                .title(p.getTitle())
                .content(p.getContent())
                .status(p.getStatus())
                .showInFooter(p.getShowInFooter())
                .footerColumn(p.getFooterColumn())
                .sortOrder(p.getSortOrder())
                .isSystemPage(p.getIsSystemPage())
                .pdfUrl(p.getPdfUrl())
                .updatedByName(p.getUpdatedBy() != null ? p.getUpdatedBy().getFullName() : "Admin")
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .currentVersion(currentVersion)
                .build();
    }

    private PageVersionDto toVersionDto(PageVersion v) {
        return PageVersionDto.builder()
                .id(v.getId())
                .pageId(v.getPage() != null ? v.getPage().getId() : null)
                .versionNumber(v.getVersionNumber())
                .title(v.getTitle())
                .content(v.getContent())
                .pdfUrl(v.getPdfUrl())
                .status(v.getStatus())
                .changeSummary(v.getChangeSummary())
                .createdByName(v.getCreatedBy() != null ? v.getCreatedBy().getFullName() : "Admin")
                .createdAt(v.getCreatedAt())
                .build();
    }
}
