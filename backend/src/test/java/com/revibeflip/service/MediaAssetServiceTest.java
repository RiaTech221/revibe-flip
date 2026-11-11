package com.revibeflip.service;

import com.revibeflip.entity.MediaAsset;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.MediaAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaAssetServiceTest {

    @Mock private MediaAssetRepository mediaAssetRepository;

    private MediaAssetService mediaAssetService;
    private User adminUser;

    @BeforeEach
    void setUp() {
        mediaAssetService = new MediaAssetService(mediaAssetRepository);
        adminUser = User.builder().id(1L).email("admin@revibeflip.com").role(Role.ROLE_ADMIN).build();
    }

    @Test
    @DisplayName("Sécurité : Le format SVG est strictement refusé pour prévenir les attaques XSS par vecteur")
    void testSvgRejection() {
        MockMultipartFile svgFile = new MockMultipartFile(
                "file",
                "malicious.svg",
                "image/svg+xml",
                "<svg onload=\"alert('xss')\"></svg>".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                mediaAssetService.uploadMedia(svgFile, "Logo SVG", adminUser)
        );

        assertTrue(ex.getMessage().contains("SVG est strictement refusé"));
    }

    @Test
    @DisplayName("Accessibilité : Le texte alternatif (altText) est obligatoire pour les images")
    void testAltTextMandatoryForImages() {
        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                new byte[1024]
        );

        // Sans alt text
        assertThrows(IllegalArgumentException.class, () ->
                mediaAssetService.uploadMedia(imageFile, "", adminUser)
        );

        assertThrows(IllegalArgumentException.class, () ->
                mediaAssetService.uploadMedia(imageFile, "ab", adminUser)
        );
    }

    @Test
    @DisplayName("Upload valide : une image JPG avec altText est renommée et persistée avec succès")
    void testValidImageUpload() throws IOException {
        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "robe-wax.jpg",
                "image/jpeg",
                new byte[2048]
        );

        when(mediaAssetRepository.save(any(MediaAsset.class))).thenAnswer(i -> {
            MediaAsset a = i.getArgument(0);
            a.setId(99L);
            return a;
        });

        var res = mediaAssetService.uploadMedia(imageFile, "Robe wax Woodin Dakar", adminUser);

        assertNotNull(res);
        assertEquals("Robe wax Woodin Dakar", res.getAltText());
        assertEquals("image/jpeg", res.getFileType());
        assertTrue(res.getFilename().endsWith(".jpg"));
        assertNotEquals("robe-wax.jpg", res.getFilename(), "Le nom doit être sécurisé et renommé");
    }
}
