package com.revibeflip.service.storage;

import com.revibeflip.security.SafeMediaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Implémentation Cloudinary de {@link ImageStorageService} activée lorsque
 * {@code STORAGE_PROVIDER=cloudinary} ({@code revibeflip.storage.provider=cloudinary}).
 */
@Service
@ConditionalOnProperty(name = "revibeflip.storage.provider", havingValue = "cloudinary")
public class CloudinaryImageStorageService implements ImageStorageService {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String baseFolder;
    private final RestTemplate restTemplate;

    public CloudinaryImageStorageService(
            @Value("${revibeflip.storage.cloudinary.cloud-name:}") String cloudName,
            @Value("${revibeflip.storage.cloudinary.api-key:}") String apiKey,
            @Value("${revibeflip.storage.cloudinary.api-secret:}") String apiSecret,
            @Value("${revibeflip.storage.cloudinary.base-folder:revibeflip}") String baseFolder) {
        this.cloudName = requireNonBlank(cloudName, "CLOUDINARY_CLOUD_NAME");
        this.apiKey = requireNonBlank(apiKey, "CLOUDINARY_API_KEY");
        this.apiSecret = requireNonBlank(apiSecret, "CLOUDINARY_API_SECRET");
        this.baseFolder = (baseFolder == null || baseFolder.isBlank()) ? "revibeflip" : baseFolder.trim();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    @SuppressWarnings("unchecked")
    public String store(byte[] cleanBytes, String context, String extension, String mimeType) throws IOException {
        String safeContext = normalizeContext(context);
        String folder = baseFolder + "/" + safeContext;
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String signature = signParams("folder=" + folder + "&timestamp=" + timestamp + apiSecret);

        String filename = UUID.randomUUID() + extension;
        ByteArrayResource fileResource = new ByteArrayResource(cleanBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("api_key", apiKey);
        body.add("timestamp", timestamp);
        body.add("folder", folder);
        body.add("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        String uploadUrl = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
        ResponseEntity<Map> response = restTemplate.postForEntity(uploadUrl, new HttpEntity<>(body, headers), Map.class);
        Map<String, Object> payload = response.getBody();
        if (payload == null || !(payload.get("secure_url") instanceof String secureUrl)) {
            throw new IOException("Réponse Cloudinary invalide (secure_url manquant).");
        }
        if (!SafeMediaService.isAllowedImageUrl(secureUrl)) {
            throw new IOException("URL Cloudinary retournée non conforme à la liste blanche.");
        }
        return secureUrl;
    }

    private static String signParams(String toSign) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(toSign.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Algorithme SHA-1 indisponible", ex);
        }
    }

    private static String requireNonBlank(String value, String envName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Variable d'environnement obligatoire manquante pour Cloudinary : " + envName);
        }
        return value.trim();
    }
}
