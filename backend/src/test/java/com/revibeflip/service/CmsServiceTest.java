package com.revibeflip.service;

import com.revibeflip.dto.ContactMessageRequest;
import com.revibeflip.dto.CreatePageRequest;
import com.revibeflip.dto.FaqItemRequest;
import com.revibeflip.dto.UpdatePageRequest;
import com.revibeflip.entity.CmsPage;
import com.revibeflip.entity.PageVersion;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.AdminActionLogRepository;
import com.revibeflip.repository.CmsPageRepository;
import com.revibeflip.repository.ContactMessageRepository;
import com.revibeflip.repository.FaqItemRepository;
import com.revibeflip.repository.PageVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CmsServiceTest {

    @Mock private CmsPageRepository cmsPageRepository;
    @Mock private PageVersionRepository pageVersionRepository;
    @Mock private AdminActionLogRepository adminActionLogRepository;
    @Mock private FaqItemRepository faqItemRepository;
    @Mock private ContactMessageRepository contactMessageRepository;

    private HtmlSanitizerService htmlSanitizerService;
    private CmsPageService cmsPageService;
    private ContactService contactService;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        htmlSanitizerService = new HtmlSanitizerService();
        cmsPageService = new CmsPageService(
                cmsPageRepository,
                pageVersionRepository,
                adminActionLogRepository,
                htmlSanitizerService
        );
        contactService = new ContactService(contactMessageRepository);

        adminUser = User.builder().id(1L).email("admin@revibeflip.com").role(Role.ROLE_ADMIN).build();
        regularUser = User.builder().id(2L).email("buyer@gmail.com").role(Role.ROLE_USER).build();
    }

    @Test
    @DisplayName("Sécurité XSS : un script ou un gestionnaire d'événement injecté dans le contenu est supprimé")
    void testXssSanitization() {
        String dangerousContent = """
                <h2>Titre valide</h2>
                <script>alert('XSS Attaque!');</script>
                <p onclick="alert('hack')">Paragraphe avec événement</p>
                <img src="valid.png" onerror="alert('fail')"/>
                <a href="javascript:alert('xss')">Lien malveillant</a>
                <iframe src="https://evil.com"></iframe>
                """;

        String sanitized = htmlSanitizerService.sanitize(dangerousContent);

        assertFalse(sanitized.contains("<script>"), "Le tag <script> doit être éliminé");
        assertFalse(sanitized.contains("onclick="), "Les gestionnaires onclick doivent être éliminés");
        assertFalse(sanitized.contains("onerror="), "Les gestionnaires onerror doivent être éliminés");
        assertFalse(sanitized.contains("javascript:"), "Les protocoles javascript: doivent être éliminés");
        assertFalse(sanitized.contains("<iframe>"), "Les balises <iframe> doivent être éliminées");
        assertTrue(sanitized.contains("<h2>Titre valide</h2>"), "Les balises sûres doivent être préservées");
        assertTrue(sanitized.contains("<p>Paragraphe avec événement</p>"), "Le texte du paragraphe doit rester intact");
    }

    @Test
    @DisplayName("Un visiteur public ou rôle USER ne peut pas consulter une page en brouillon (DRAFT)")
    void testDraftPageNotVisibleToPublic() {
        CmsPage draftPage = CmsPage.builder()
                .id(10L)
                .slug("page-secrete")
                .title("Page Secrète")
                .content("<p>Contenu en cours de rédaction</p>")
                .status(PageStatus.DRAFT)
                .build();

        when(cmsPageRepository.findBySlug("page-secrete")).thenReturn(Optional.of(draftPage));

        // Visiteur anonyme (currentUser == null)
        assertThrows(IllegalArgumentException.class, () ->
                cmsPageService.getPublishedPageBySlug("page-secrete", null)
        );

        // Utilisateur non admin
        assertThrows(IllegalArgumentException.class, () ->
                cmsPageService.getPublishedPageBySlug("page-secrete", regularUser)
        );

        // Un admin peut quant à lui voir le brouillon
        var adminView = cmsPageService.getPublishedPageBySlug("page-secrete", adminUser);
        assertNotNull(adminView);
        assertEquals("Page Secrète", adminView.getTitle());
    }

    @Test
    @DisplayName("Restauration d'une version précédente d'une page")
    void testRestorePreviousVersion() {
        CmsPage page = CmsPage.builder()
                .id(5L)
                .slug("cgu")
                .title("CGU Actuelles v2")
                .content("<p>Texte v2</p>")
                .status(PageStatus.PUBLISHED)
                .build();

        PageVersion v1 = PageVersion.builder()
                .id(1L)
                .page(page)
                .versionNumber(1)
                .title("CGU Originales v1")
                .content("<p>Texte v1 historique</p>")
                .status(PageStatus.PUBLISHED)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        when(cmsPageRepository.findById(5L)).thenReturn(Optional.of(page));
        when(pageVersionRepository.findByPageIdAndVersionNumber(5L, 1)).thenReturn(Optional.of(v1));
        when(pageVersionRepository.findByPageIdOrderByVersionNumberDesc(5L)).thenReturn(List.of(v1));
        when(cmsPageRepository.save(any(CmsPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var restoredDto = cmsPageService.adminRestoreVersion(5L, 1, adminUser);

        assertEquals("CGU Originales v1", restoredDto.getTitle());
        assertEquals("<p>Texte v1 historique</p>", restoredDto.getContent());
        verify(pageVersionRepository, times(1)).save(any(PageVersion.class));
    }

    @Test
    @DisplayName("Validation du formulaire de contact et limitation anti-spam")
    void testContactMessageValidationAndRateLimit() {
        // 1. Rejet si ni email ni téléphone
        ContactMessageRequest requestNoContact = ContactMessageRequest.builder()
                .fullName("Moussa Diop")
                .subject("Question générale")
                .message("Bonjour, je souhaite un renseignement sur le séquestre.")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                contactService.submitMessage(requestNoContact, "192.168.1.10")
        );

        // 2. Rejet si dépassement de la limite anti-spam (5 envois récents depuis la même IP)
        when(contactMessageRepository.countByIpAddressAndCreatedAtAfter(eq("192.168.1.10"), any()))
                .thenReturn(5L);

        ContactMessageRequest validRequest = ContactMessageRequest.builder()
                .fullName("Moussa Diop")
                .email("moussa@gmail.com")
                .subject("Question")
                .message("Message de test valide et sécurisé.")
                .build();

        assertThrows(IllegalStateException.class, () ->
                contactService.submitMessage(validRequest, "192.168.1.10")
        );
    }
}
