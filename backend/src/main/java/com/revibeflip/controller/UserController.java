package com.revibeflip.controller;

import com.revibeflip.dto.AddressDto;
import com.revibeflip.dto.AddressRequest;
import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.PersonalDashboardDto;
import com.revibeflip.dto.UpdateProfileRequest;
import com.revibeflip.dto.PublicUserDto;
import com.revibeflip.dto.UserDto;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.SafeMediaService;
import com.revibeflip.service.AddressService;
import com.revibeflip.service.PersonalDashboardService;
import com.revibeflip.service.RefreshTokenService;
import com.revibeflip.service.storage.ImageUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Contrôleur REST de gestion du profil personnel et des adresses de livraison.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Profils Utilisateurs", description = "Consultation, modification du profil et gestion du carnet d'adresses")
public class UserController {

    private final UserRepository userRepository;
    private final AddressService addressService;
    private final RefreshTokenService refreshTokenService;
    private final ImageUploadService imageUploadService;
    private final PersonalDashboardService personalDashboardService;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @GetMapping("/me/dashboard")
    @Operation(summary = "Consulter mon tableau de bord personnel (commandes ; annonces, note et avis réservés aux vendeurs)")
    public ResponseEntity<ApiResponse<PersonalDashboardDto>> getMyPersonalDashboard(
            @RequestParam(defaultValue = "0") int purchasesPage,
            @RequestParam(defaultValue = "0") int salesPage,
            @RequestParam(defaultValue = "0") int listingsPage,
            @RequestParam(defaultValue = "0") int reviewsPage,
            @RequestParam(defaultValue = "6") int size,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        PersonalDashboardDto dashboard = personalDashboardService.getPersonalDashboard(
                currentUser, purchasesPage, salesPage, listingsPage, reviewsPage, size
        );
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le profil public d'un utilisateur")
    public ResponseEntity<ApiResponse<PublicUserDto>> getUserProfile(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getIsSuspended())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Utilisateur non trouvé"));
        }
        return ResponseEntity.ok(ApiResponse.ok(PublicUserDto.fromEntity(user)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Mettre à jour mes informations de profil")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);

        if (request.getFirstName() != null) {
            String trimmed = request.getFirstName().trim();
            if (trimmed.isEmpty()) {
                throw new IllegalArgumentException("Le prénom ne peut pas être vide.");
            }
            currentUser.setFirstName(trimmed);
        }
        if (request.getLastName() != null) {
            String trimmed = request.getLastName().trim();
            if (trimmed.isEmpty()) {
                throw new IllegalArgumentException("Le nom ne peut pas être vide.");
            }
            currentUser.setLastName(trimmed);
        }
        if (request.getEmail() != null) {
            String normalizedEmail = request.getEmail().trim().toLowerCase();
            if (normalizedEmail.isEmpty()) {
                currentUser.setEmail(null);
            } else {
                Optional<User> existing = userRepository.findByEmail(normalizedEmail);
                if (existing.isPresent() && !existing.get().getId().equals(currentUser.getId())) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(ApiResponse.error("Cette adresse email est déjà utilisée par un autre compte."));
                }
                currentUser.setEmail(normalizedEmail);
            }
        }
        if (request.getAddress() != null) {
            String trimmed = request.getAddress().trim();
            currentUser.setAddress(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getCity() != null) {
            String trimmed = request.getCity().trim();
            currentUser.setCity(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getProfilePicture() != null) {
            String trimmed = request.getProfilePicture().trim();
            if (trimmed.isEmpty()) {
                currentUser.setProfilePicture(null);
            } else {
                if (!SafeMediaService.isAllowedImageUrl(trimmed)) {
                    throw new IllegalArgumentException("URL de photo de profil non autorisée.");
                }
                currentUser.setProfilePicture(trimmed);
            }
        }

        User saved = userRepository.save(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(saved), "Profil mis à jour avec succès."));
    }

    @PostMapping(value = "/profile/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Téléverser et enregistrer immédiatement ma photo de profil (JPG/PNG/WebP ≤ 5 Mo)")
    public ResponseEntity<ApiResponse<UserDto>> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);
        try {
            String fileUrl = imageUploadService.uploadImage(file, "avatars");
            currentUser.setProfilePicture(fileUrl);
            User saved = userRepository.save(currentUser);
            return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(saved), "Photo de profil mise à jour avec succès."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IOException ex) {
            log.error("Erreur lors du téléversement de la photo de profil", ex);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Impossible d'enregistrer la photo de profil."));
        }
    }

    // ==========================================
    // CARNET D'ADRESSES CLIENT (ACHETEUR)
    // ==========================================

    @GetMapping("/addresses")
    @Operation(summary = "Lister les adresses de livraison enregistrées")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getMyAddresses(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(addressService.getMyAddresses(user)));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Ajouter une nouvelle adresse de livraison")
    public ResponseEntity<ApiResponse<AddressDto>> createAddress(
            @Valid @RequestBody AddressRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        AddressDto created = addressService.createAddress(user, request);
        return ResponseEntity.ok(ApiResponse.ok(created, "Adresse enregistrée avec succès."));
    }

    @PutMapping("/addresses/{id}")
    @Operation(summary = "Modifier une adresse de livraison")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        AddressDto updated = addressService.updateAddress(user, id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Adresse mise à jour avec succès."));
    }

    @DeleteMapping("/addresses/{id}")
    @Operation(summary = "Supprimer une adresse de livraison")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        addressService.deleteAddress(user, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Adresse supprimée avec succès."));
    }

    @PutMapping("/addresses/{id}/default")
    @Operation(summary = "Définir une adresse comme adresse par défaut")
    public ResponseEntity<ApiResponse<AddressDto>> setDefaultAddress(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        AddressDto def = addressService.setDefaultAddress(user, id);
        return ResponseEntity.ok(ApiResponse.ok(def, "Adresse définie par défaut."));
    }

    @GetMapping("/me/export")
    @Operation(summary = "Exporter mes données personnelles (RGPD / Protection des données)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportMyData(Authentication authentication) {
        User user = resolveUser(authentication);
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("exportedAt", LocalDateTime.now().toString());
        export.put("profile", UserDto.fromEntity(user));
        export.put("addresses", addressService.getMyAddresses(user));
        return ResponseEntity.ok(ApiResponse.ok(export, "Export des données personnelles généré."));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Supprimer / anonymiser mon compte en conservant les écritures comptables légales")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(Authentication authentication) {
        User user = resolveUser(authentication);
        String anonSuffix = UUID.randomUUID().toString().substring(0, 8);
        user.setFirstName("Utilisateur");
        user.setLastName("Supprimé");
        user.setPhone("DELETED-" + user.getId() + "-" + anonSuffix);
        user.setEmail(null);
        user.setAddress(null);
        user.setProfilePicture(null);
        user.setIsSuspended(true);
        user.setOtpCode(null);
        user.setResetOtpCode(null);
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Compte anonymisé et sessions révoquées."));
    }
}
