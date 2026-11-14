package com.revibeflip.security;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Validation cryptographique/binaire (magic bytes) des fichiers uploadés et suppression des métadonnées EXIF.
 */
public final class SafeMediaService {

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
            return DetectedType.PDF;
        }

        throw new IllegalArgumentException("Signature binaire du fichier non reconnue (formats acceptés : JPG, PNG, WebP"
                + (allowPdf ? ", PDF" : "") + ").");
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
            String format = type == DetectedType.PNG ? "png" : "jpg";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, format, out);
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
