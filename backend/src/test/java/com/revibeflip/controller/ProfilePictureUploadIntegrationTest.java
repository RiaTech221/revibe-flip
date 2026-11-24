package com.revibeflip.controller;

import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.service.storage.ImageStorageService;
import com.revibeflip.service.storage.ImageUploadService;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US-04 — Tests d'intégration et unitaires pour le téléversement de photo de profil
 * (JPG/PNG/WEBP ≤ 5 Mo), le stockage Cloud Storage et la mise à jour immédiate du profil.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ProfilePictureUploadIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private SmsProvider smsProvider;
    @MockitoBean private PaymentGateway paymentGateway;

    private static final String USER_PHONE = "+221780040001";
    private static final String OTHER_PHONE = "+221780040002";
    private static final String OTHER_EMAIL = "autre.us04@revibeflip.test";
    private static final String PASSWORD = "Password123!";

    private String authToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        User user = userRepository.findByPhone(USER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(USER_PHONE)
                        .email("initial.us04@revibeflip.test")
                        .firstName("Aminata")
                        .lastName("Diallo")
                        .city("Dakar")
                        .address("Mermoz")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .mustChangePassword(false)
                        .build())
        );
        user.setFirstName("Aminata");
        user.setLastName("Diallo");
        user.setEmail("initial.us04@revibeflip.test");
        user.setCity("Dakar");
        user.setAddress("Mermoz");
        user.setProfilePicture(null);
        user = userRepository.save(user);
        userId = user.getId();

        userRepository.findByPhone(OTHER_PHONE).orElseGet(() ->
                userRepository.save(User.builder()
                        .phone(OTHER_PHONE)
                        .email(OTHER_EMAIL)
                        .firstName("Moussa")
                        .lastName("Ndiaye")
                        .city("Thiès")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.ROLE_USER)
                        .isVerified(true)
                        .isSuspended(false)
                        .mustChangePassword(false)
                        .build())
        );

        authToken = jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getFullName());
    }

    private static byte[] createValidImageBytes(String format) throws Exception {
        BufferedImage img = new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, format, out);
        return out.toByteArray();
    }

    /**
     * Crée un fichier WebP VP8L 1x1 valide (conforme RIFF....WEBP + signature Apache Tika).
     */
    private static byte[] createValidWebpBytes() {
        // Minimal valid lossless 1x1 WebP image (RIFF header + WEBP + VP8L chunk)
        return new byte[] {
                0x52, 0x49, 0x46, 0x46, // RIFF
                0x24, 0x00, 0x00, 0x00, // file size - 8 = 36
                0x57, 0x45, 0x42, 0x50, // WEBP
                0x56, 0x50, 0x38, 0x4C, // VP8L
                0x17, 0x00, 0x00, 0x00, // chunk size = 23
                0x2F, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00  // padded byte for odd chunkSize 23
        };
    }

    @Nested
    @DisplayName("Cas valides — Téléversement JPG/PNG/WEBP ≤ 5 Mo et mise à jour immédiate du profil")
    class ValidCases {

        @Test
        @DisplayName("JPG valide (context=avatars) + mise à jour des infos personnelles → profil immédiatement mis à jour")
        void uploadValidJpgAndUpdatePersonalInfo() throws Exception {
            MockMultipartFile jpgFile = new MockMultipartFile(
                    "file", "avatar.jpg", "image/jpeg", createValidImageBytes("jpg")
            );

            MvcResult uploadResult = mockMvc.perform(multipart("/api/uploads")
                            .file(jpgFile)
                            .param("context", "avatars")
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isString())
                    .andReturn();

            Matcher m = Pattern.compile("\"data\"\\s*:\\s*\"([^\"]+)\"")
                    .matcher(uploadResult.getResponse().getContentAsString());
            assertThat(m.find()).isTrue();
            String uploadedUrl = m.group(1);
            assertThat(uploadedUrl).startsWith("/api/uploads/avatars/").endsWith(".jpg");

            String updateBody = String.format("""
                    {
                      "firstName": "Fatou",
                      "lastName": "Sarr",
                      "email": "fatou.sarr.us04@revibeflip.test",
                      "city": "Saint-Louis",
                      "address": "Sor, Rue 12",
                      "profilePicture": "%s"
                    }
                    """, uploadedUrl);

            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.firstName").value("Fatou"))
                    .andExpect(jsonPath("$.data.lastName").value("Sarr"))
                    .andExpect(jsonPath("$.data.fullName").value("Fatou Sarr"))
                    .andExpect(jsonPath("$.data.email").value("fatou.sarr.us04@revibeflip.test"))
                    .andExpect(jsonPath("$.data.city").value("Saint-Louis"))
                    .andExpect(jsonPath("$.data.address").value("Sor, Rue 12"))
                    .andExpect(jsonPath("$.data.profilePicture").value(uploadedUrl));

            // Vérifie la persistance immédiate via /api/auth/me et le profil public /api/users/{id}
            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.fullName").value("Fatou Sarr"))
                    .andExpect(jsonPath("$.data.profilePicture").value(uploadedUrl));

            mockMvc.perform(get("/api/users/" + userId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.profilePicture").value(uploadedUrl));
        }

        @Test
        @DisplayName("PNG valide via POST /api/users/profile/picture → photo stockée et profil mis à jour immédiatement")
        void uploadValidPngDirectlyUpdatesProfile() throws Exception {
            MockMultipartFile pngFile = new MockMultipartFile(
                    "file", "avatar.png", "image/png", createValidImageBytes("png")
            );

            mockMvc.perform(multipart("/api/users/profile/picture")
                            .file(pngFile)
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.profilePicture").isNotEmpty());

            User updated = userRepository.findById(userId).orElseThrow();
            assertThat(updated.getProfilePicture())
                    .isNotNull()
                    .startsWith("/api/uploads/avatars/")
                    .endsWith(".png");
        }

        @Test
        @DisplayName("WEBP valide via POST /api/uploads?context=avatars → accepté et assaini")
        void uploadValidWebpSucceeds() throws Exception {
            MockMultipartFile webpFile = new MockMultipartFile(
                    "file", "avatar.webp", "image/webp", createValidWebpBytes()
            );

            mockMvc.perform(multipart("/api/uploads")
                            .file(webpFile)
                            .param("context", "avatars")
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.startsWith("/api/uploads/avatars/")))
                    .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.endsWith(".webp")));
        }

        @Test
        @DisplayName("URL Cloud Storage (Cloudinary HTTPS) acceptée dans PUT /api/users/profile")
        void cloudStorageUrlAcceptedInProfileUpdate() throws Exception {
            String cloudinaryUrl = "https://res.cloudinary.com/revibeflip/image/upload/v1700000000/revibeflip/avatars/avatar-1.webp";
            String updateBody = String.format("""
                    {
                      "firstName": "Aminata",
                      "lastName": "Diallo",
                      "email": "",
                      "city": "Dakar",
                      "address": "Plateau",
                      "profilePicture": "%s"
                    }
                    """, cloudinaryUrl);

            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.profilePicture").value(cloudinaryUrl))
                    .andExpect(jsonPath("$.data.email").doesNotExist());
        }

        @Test
        @DisplayName("Délégation Cloud Storage — ImageUploadService stocke dans le dossier avatars via ImageStorageService")
        void imageUploadServiceDelegatesToCloudStorage() throws Exception {
            ImageStorageService cloudStorage = mock(ImageStorageService.class);
            String expectedCloudUrl = "https://res.cloudinary.com/demo/image/upload/v1/revibeflip/avatars/cloud-pic.png";
            when(cloudStorage.normalizeContext("avatars")).thenReturn("avatars");
            when(cloudStorage.store(any(byte[].class), eq("avatars"), eq(".png"), eq("image/png")))
                    .thenReturn(expectedCloudUrl);

            ImageUploadService service = new ImageUploadService(cloudStorage);
            MockMultipartFile pngFile = new MockMultipartFile(
                    "file", "profil.png", "image/png", createValidImageBytes("png")
            );

            String resultUrl = service.uploadImage(pngFile, "avatars");

            assertThat(resultUrl).isEqualTo(expectedCloudUrl);
            verify(cloudStorage).store(any(byte[].class), eq("avatars"), eq(".png"), eq("image/png"));
        }
    }

    @Nested
    @DisplayName("Cas invalides — Refus des formats interdits, tailles > 5 Mo, fichiers falsifiés et URLs non autorisées")
    class InvalidCases {

        @Test
        @DisplayName("Fichier > 5 Mo refusé (400 Bad Request) sans appel au stockage")
        void rejectsFileExceeding5MB() throws Exception {
            byte[] oversized = new byte[(int) ImageUploadService.MAX_IMAGE_SIZE_BYTES + 1];
            MockMultipartFile bigFile = new MockMultipartFile(
                    "file", "huge.jpg", "image/jpeg", oversized
            );

            mockMvc.perform(multipart("/api/uploads")
                            .file(bigFile)
                            .param("context", "avatars")
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("5 Mo")));

            // Vérifie aussi au niveau service que le Cloud Storage n'est jamais invoqué
            ImageStorageService cloudStorage = mock(ImageStorageService.class);
            ImageUploadService service = new ImageUploadService(cloudStorage);
            org.junit.jupiter.api.Assertions.assertThrows(
                    IllegalArgumentException.class,
                    () -> service.uploadImage(bigFile, "avatars")
            );
            verify(cloudStorage, never()).store(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Fichier vide refusé (400 Bad Request)")
        void rejectsEmptyFile() throws Exception {
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file", "empty.png", "image/png", new byte[0]
            );

            mockMvc.perform(multipart("/api/users/profile/picture")
                            .file(emptyFile)
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Formats non autorisés (GIF, SVG, PDF) refusés (400 Bad Request)")
        void rejectsUnsupportedFormats() throws Exception {
            MockMultipartFile gifFile = new MockMultipartFile(
                    "file", "anim.gif", "image/gif", "GIF89a......".getBytes(StandardCharsets.US_ASCII)
            );
            MockMultipartFile svgFile = new MockMultipartFile(
                    "file", "xss.svg", "image/svg+xml", "<svg onload=alert(1)></svg>".getBytes(StandardCharsets.UTF_8)
            );
            MockMultipartFile pdfFile = new MockMultipartFile(
                    "file", "doc.pdf", "application/pdf", "%PDF-1.4 sample content".getBytes(StandardCharsets.US_ASCII)
            );

            for (MockMultipartFile invalid : new MockMultipartFile[] { gifFile, svgFile, pdfFile }) {
                mockMvc.perform(multipart("/api/uploads")
                                .file(invalid)
                                .param("context", "avatars")
                                .header("Authorization", "Bearer " + authToken))
                        .andExpect(status().isBadRequest())
                        .andExpect(jsonPath("$.success").value(false));
            }
        }

        @Test
        @DisplayName("Fichier falsifié (script SVG/HTML renommé en .jpg avec MIME image/jpeg) refusé (400 Bad Request)")
        void rejectsDisguisedSvgAsJpeg() throws Exception {
            MockMultipartFile spoofed = new MockMultipartFile(
                    "file",
                    "fake.jpg",
                    "image/jpeg",
                    "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>".getBytes(StandardCharsets.UTF_8)
            );

            mockMvc.perform(multipart("/api/users/profile/picture")
                            .file(spoofed)
                            .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));

            User untouched = userRepository.findById(userId).orElseThrow();
            assertThat(untouched.getProfilePicture()).isNull();
        }

        @Test
        @DisplayName("Upload sans authentification refusé (401 Unauthorized)")
        void rejectsUnauthenticatedUpload() throws Exception {
            MockMultipartFile pngFile = new MockMultipartFile(
                    "file", "avatar.png", "image/png", createValidImageBytes("png")
            );

            mockMvc.perform(multipart("/api/users/profile/picture").file(pngFile))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("URL de photo de profil non autorisée refusée dans PUT /api/users/profile (400 Bad Request)")
        void rejectsUntrustedProfilePictureUrl() throws Exception {
            String maliciousBody = """
                    {
                      "firstName": "Aminata",
                      "lastName": "Diallo",
                      "profilePicture": "https://evil.example.com/tracker.jpg"
                    }
                    """;

            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(maliciousBody))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Email déjà utilisé par un autre compte refusé (409 Conflict)")
        void rejectsDuplicateEmail() throws Exception {
            String duplicateBody = String.format("""
                    {
                      "firstName": "Aminata",
                      "lastName": "Diallo",
                      "email": "%s"
                    }
                    """, OTHER_EMAIL);

            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(duplicateBody))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Prénom vide ou email mal formé refusé (400 Bad Request)")
        void rejectsInvalidProfileFields() throws Exception {
            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"firstName\": \"   \", \"lastName\": \"Diallo\"}"))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(put("/api/users/profile")
                            .header("Authorization", "Bearer " + authToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"firstName\": \"Aminata\", \"email\": \"not-an-email\"}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
