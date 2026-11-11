package com.revibeflip.controller;

import com.revibeflip.dto.AddressDto;
import com.revibeflip.dto.AddressRequest;
import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.UpdateProfileRequest;
import com.revibeflip.dto.UserDto;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Profils Utilisateurs", description = "Consultation, modification du profil et gestion du carnet d'adresses")
public class UserController {

    private final UserRepository userRepository;
    private final AddressService addressService;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le profil public d'un utilisateur")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Mettre à jour mes informations de profil")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        User currentUser = resolveUser(authentication);

        if (request.getFirstName() != null) currentUser.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) currentUser.setLastName(request.getLastName().trim());
        if (request.getEmail() != null) currentUser.setEmail(request.getEmail().trim().toLowerCase());
        if (request.getAddress() != null) currentUser.setAddress(request.getAddress().trim());
        if (request.getCity() != null) currentUser.setCity(request.getCity().trim());
        if (request.getProfilePicture() != null) currentUser.setProfilePicture(request.getProfilePicture().trim());

        User saved = userRepository.save(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(saved), "Profil mis à jour avec succès."));
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
}
