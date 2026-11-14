package com.revibeflip.service.storage;

import com.revibeflip.security.SafeMediaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageStorageAndWhitelistTests {

    @TempDir
    Path tempDir;

    @Test
    void localStorageStoresInContextFolderAndReturnsWhitelistedPath() throws Exception {
        LocalImageStorageService service = new LocalImageStorageService(tempDir.toString());
        byte[] pngBytes = createValidPng();

        String url = service.store(pngBytes, "products", ".png", "image/png");

        assertTrue(url.startsWith("/api/uploads/products/"));
        assertTrue(url.endsWith(".png"));
        assertTrue(SafeMediaService.isAllowedImageUrl(url));

        String filename = url.substring("/api/uploads/products/".length());
        assertTrue(Files.exists(tempDir.resolve("products").resolve(filename)));
    }

    @Test
    void rejectsInvalidStorageContext() {
        LocalImageStorageService service = new LocalImageStorageService(tempDir.toString());
        assertThrows(IllegalArgumentException.class, () -> service.normalizeContext("../etc"));
        assertThrows(IllegalArgumentException.class, () -> service.normalizeContext("unknown"));
        assertEquals("products", service.normalizeContext(null));
    }

    @Test
    void urlWhitelistAllowsOnlyLocalAndHttpsCloudinary() {
        assertTrue(SafeMediaService.isAllowedImageUrl("/api/uploads/products/abc.jpg"));
        assertTrue(SafeMediaService.isAllowedImageUrl("/api/media/abc.webp"));
        assertTrue(SafeMediaService.isAllowedImageUrl("https://res.cloudinary.com/demo/image/upload/v1/revibeflip/products/a.jpg"));

        assertFalse(SafeMediaService.isAllowedImageUrl("http://res.cloudinary.com/demo/image/upload/a.jpg"));
        assertFalse(SafeMediaService.isAllowedImageUrl("https://evil.example.com/a.jpg"));
        assertFalse(SafeMediaService.isAllowedImageUrl("javascript:alert(1)"));
        assertFalse(SafeMediaService.isAllowedImageUrl("/api/uploads/../secret.png"));
    }

    @Test
    void tikaAndMagicBytesVerifyValidPng() throws Exception {
        byte[] pngBytes = createValidPng();
        SafeMediaService.DetectedType detected = SafeMediaService.detectType(pngBytes, false);
        assertEquals(SafeMediaService.DetectedType.PNG, detected);
        SafeMediaService.verifyImageWithTika(pngBytes, detected);
    }

    private byte[] createValidPng() throws Exception {
        BufferedImage img = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }
}
