package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.UpdateProfileRequest;
import com.revibeflip.dto.UserDto;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Profils Utilisateurs", description = "Consultation et modification du profil utilisateur")
public class UserController {

    private final UserRepository userRepository;

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
            @AuthenticationPrincipal User currentUser
    ) {
        if (request.getFirstName() != null) currentUser.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) currentUser.setLastName(request.getLastName().trim());
        if (request.getEmail() != null) currentUser.setEmail(request.getEmail().trim().toLowerCase());
        if (request.getAddress() != null) currentUser.setAddress(request.getAddress().trim());
        if (request.getCity() != null) currentUser.setCity(request.getCity().trim());
        if (request.getProfilePicture() != null) currentUser.setProfilePicture(request.getProfilePicture().trim());

        User saved = userRepository.save(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(saved), "Profil mis à jour avec succès."));
    }
}
