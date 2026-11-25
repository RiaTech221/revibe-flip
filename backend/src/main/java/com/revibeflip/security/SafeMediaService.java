package com.revibeflip.security;

import org.apache.tika.Tika;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;

/**
 * Validation cryptographique/binaire (magic bytes) des fichiers uploadés et suppression des métadonnées EXIF.
 */
public final class SafeMediaService {

    private static final Tika TIKA = new Tika();
    private static final Set<String> ALLOWED_TIKA_IMAGE_MIMES = Set.of("image/jpeg", "image/png", "image/webp");

    private SafeMediaService() {}

    public enum DetectedType {
        JPEG(".jpg", "image/jpeg"),
        PNG(".png", "image/png"),
        WEBP(".webp", "image/webp"),
        PDF(".pdf", "application/pdf");

        public final String extension;
        public final String mimeType;

        DetectedType(String extension, String mimeType) {
            this.extension = extension;
            this.mimeType = mimeType;
        }
    }

    public static DetectedType detectType(byte[] data, boolean allowPdf) {
        if (data == null || data.length < 12) {
            throw new IllegalArgumentException("Fichier invalide ou vide.");
        }

        // Refus explicite des contenus SVG/XML/HTML déguisés
        String head = new String(data, 0, Math.min(data.length, 256), StandardCharsets.UTF_8).toLowerCase();
        if (head.contains("<svg") || head.contains("<?xml") || head.contains("<html") || head.contains("<script")) {
            throw new IllegalArgumentException("Les fichiers SVG/XML/HTML sont strictement refusés.");
        }

        // JPEG: FF D8 FF
        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            return DetectedType.JPEG;
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((data[0] & 0xFF) == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47
                && data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A) {
            return DetectedType.PNG;
        }

        // WebP: RIFF....WEBP
        if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return DetectedType.WEBP;
        }

        // PDF: %PDF-
        if (allowPdf && data[0] == '%' && data[1] == 'P' && data[2] == 'D' && data[3] == 'F' && data[4] == '-') {
            String tikaMime = TIKA.detect(data);
            if (!"application/pdf".equalsIgnoreCase(tikaMime)) {
                throw new IllegalArgumentException("Signature MIME Apache Tika invalide pour le document PDF : " + tikaMime);
            }
            return DetectedType.PDF;
        }

        throw new IllegalArgumentException("Signature binaire du fichier non reconnue (formats acceptés : JPG, PNG, WebP"
                + (allowPdf ? ", PDF" : "") + ").");
    }

    /**
     * Vérifie que le type MIME détecté par Apache Tika correspond aux formats d'images autorisés.
     */
    public static void verifyImageWithTika(byte[] data, DetectedType expectedType) {
        String detectedMime = TIKA.detect(data);
        if (!ALLOWED_TIKA_IMAGE_MIMES.contains(detectedMime.toLowerCase())
                || !expectedType.mimeType.equalsIgnoreCase(detectedMime)) {
            throw new IllegalArgumentException("Type MIME détecté par Apache Tika non autorisé : " + detectedMime);
        }
    }

    /**
     * Liste blanche stricte des URLs d'images autorisées en base :
     * chemins locaux (/api/uploads/..., /api/media/...) ou HTTPS Cloudinary (res.cloudinary.com).
     */
    public static boolean isAllowedImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String trimmed = url.trim();
        if (trimmed.contains("..") || trimmed.contains("\\") || trimmed.contains("\r") || trimmed.contains("\n")) {
            return false;
        }
        if (trimmed.startsWith("/api/uploads/") || trimmed.startsWith("/api/media/") || trimmed.startsWith("/uploads/")) {
            return !trimmed.startsWith("//");
        }
        try {
            URI uri = URI.create(trimmed);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && "res.cloudinary.com".equalsIgnoreCase(uri.getHost())
                    && uri.getUserInfo() == null
                    && uri.getPath() != null
                    && !uri.getPath().isBlank();
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * Supprime les métadonnées EXIF/XMP des images avant stockage.
     */
    public static byte[] sanitizeImage(byte[] rawBytes, DetectedType type) throws IOException {
        if (type == DetectedType.JPEG || type == DetectedType.PNG) {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(rawBytes));
            if (image == null) {
                throw new IllegalArgumentException("Image corrompue ou illisible.");
            }
            BufferedImage toWrite = image;
            if (type == DetectedType.JPEG && image.getColorModel().hasAlpha()) {
                toWrite = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
                java.awt.Graphics2D g = toWrite.createGraphics();
                try {
                    g.setColor(java.awt.Color.WHITE);
                    g.fillRect(0, 0, image.getWidth(), image.getHeight());
                    g.drawImage(image, 0, 0, null);
                } finally {
                    g.dispose();
                }
            }
            String format = type == DetectedType.PNG ? "png" : "jpg";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(toWrite, format, out) || out.size() == 0) {
                throw new IllegalArgumentException("Impossible de traiter cette image.");
            }
            return out.toByteArray();
        }
        if (type == DetectedType.WEBP) {
            return stripWebpMetadataChunks(rawBytes);
        }
        return rawBytes;
    }

    private static byte[] stripWebpMetadataChunks(byte[] data) throws IOException {
        // Supprime les chunks RIFF EXIF et XMP tout en recalculant la taille RIFF
        ByteArrayOutputStream payload = new ByteArrayOutputStream();
        int offset = 12;
        while (offset + 8 <= data.length) {
            String fourCc = new String(data, offset, 4, StandardCharsets.US_ASCII);
            int chunkSize = (data[offset + 4] & 0xFF)
                    | ((data[offset + 5] & 0xFF) << 8)
                    | ((data[offset + 6] & 0xFF) << 16)
                    | ((data[offset + 7] & 0xFF) << 24);
            if (chunkSize < 0 || offset + 8 + chunkSize > data.length) {
                throw new IllegalArgumentException("Fichier WebP invalide.");
            }
            int paddedSize = chunkSize + (chunkSize & 1);
            int nextOffset = Math.min(data.length, offset + 8 + paddedSize);
            if (!"EXIF".equals(fourCc) && !"XMP ".equals(fourCc)) {
                payload.write(data, offset, nextOffset - offset);
            }
            offset = nextOffset;
        }
        byte[] chunks = payload.toByteArray();
        int riffSize = 4 + chunks.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream(12 + chunks.length);
        out.write(Arrays.copyOfRange(data, 0, 4)); // RIFF
        out.write(riffSize & 0xFF);
        out.write((riffSize >> 8) & 0xFF);
        out.write((riffSize >> 16) & 0xFF);
        out.write((riffSize >> 24) & 0xFF);
        out.write(Arrays.copyOfRange(data, 8, 12)); // WEBP
        out.write(chunks);
        return out.toByteArray();
    }
}
