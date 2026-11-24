package com.revibeflip.service;

import com.revibeflip.dto.CollaboratorDto;
import com.revibeflip.dto.CreateCollaboratorRequest;
import com.revibeflip.dto.PageResponseDto;
import com.revibeflip.dto.UpdateCollaboratorPermissionsRequest;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AdminPermission;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Service métier de gestion des comptes collaborateurs du Back-Office (US-36).
 *
 * <p>Permet à un administrateur d'ajouter, modifier, suspendre et révoquer
 * des collaborateurs avec attribution fine de permissions par module.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CollaboratorService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AdminService adminService;

    @Transactional(readOnly = true)
    public PageResponseDto<CollaboratorDto> getCollaborators(String query, Boolean isSuspended, Pageable pageable) {
        Page<User> page = userRepository.searchUsersPage(query, Role.ROLE_COLLABORATOR, isSuspended, pageable);
        return PageResponseDto.fromPage(page.map(CollaboratorDto::fromEntity));
    }

    @Transactional(readOnly = true)
    public CollaboratorDto getCollaborator(Long id) {
        User user = findCollaboratorOrThrow(id);
        return CollaboratorDto.fromEntity(user);
    }

    @Transactional
    public CollaboratorDto createCollaborator(CreateCollaboratorRequest request, User admin) {
        String phone = request.getCleanPhone() != null ? request.getCleanPhone() : request.getPhone().trim();
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Un compte existe déjà avec ce numéro de téléphone : " + phone);
        }

        String email = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim().toLowerCase()
                : null;
        if (email != null && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un compte existe déjà avec cette adresse e-mail : " + email);
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword().trim()
                : "Collab@" + UUID.randomUUID().toString().substring(0, 8);

        Set<AdminPermission> permissions = request.getPermissions() != null
                ? new HashSet<>(request.getPermissions())
                : new HashSet<>();

        User collaborator = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(phone)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.ROLE_COLLABORATOR)
                .isVerified(true)
                .isSuspended(false)
                .mustChangePassword(true)
                .adminPermissions(permissions)
                .build();

        User saved = userRepository.save(collaborator);

        adminService.logAdminAction(
                admin,
                "COLLABORATOR_CREATE",
                "COLLABORATOR",
                String.valueOf(saved.getId()),
                "Création du compte collaborateur : " + saved.getFullName() + " (" + saved.getPhone() + ") avec permissions: " + permissions
        );

        CollaboratorDto dto = CollaboratorDto.fromEntity(saved);
        dto.setInitialPassword(rawPassword);
        return dto;
    }

    @Transactional
    public CollaboratorDto updateCollaborator(Long id, UpdateCollaboratorPermissionsRequest request, User admin) {
        User collaborator = findCollaboratorOrThrow(id);

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            collaborator.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            collaborator.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null) {
            String email = request.getEmail().trim().toLowerCase();
            if (!email.isEmpty() && !email.equals(collaborator.getEmail()) && userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Cette adresse e-mail est déjà utilisée : " + email);
            }
            collaborator.setEmail(email.isEmpty() ? null : email);
        }

        if (request.getPermissions() != null) {
            collaborator.setAdminPermissions(new HashSet<>(request.getPermissions()));
        }

        User saved = userRepository.save(collaborator);

        adminService.logAdminAction(
                admin,
                "COLLABORATOR_UPDATE_PERMISSIONS",
                "COLLABORATOR",
                String.valueOf(saved.getId()),
                "Mise à jour des permissions pour " + saved.getFullName() + " : " + saved.getAdminPermissions()
        );

        return CollaboratorDto.fromEntity(saved);
    }

    @Transactional
    public CollaboratorDto toggleSuspension(Long id, boolean suspend, User admin) {
        User collaborator = findCollaboratorOrThrow(id);

        collaborator.setIsSuspended(suspend);
        User saved = userRepository.save(collaborator);

        if (suspend) {
            refreshTokenService.revokeAllForUser(saved);
        }

        adminService.logAdminAction(
                admin,
                suspend ? "COLLABORATOR_SUSPEND" : "COLLABORATOR_REACTIVATE",
                "COLLABORATOR",
                String.valueOf(saved.getId()),
                (suspend ? "Suspension" : "Réactivation") + " du compte collaborateur : " + saved.getFullName()
        );

        return CollaboratorDto.fromEntity(saved);
    }

    @Transactional
    public void deleteCollaborator(Long id, User admin) {
        User collaborator = findCollaboratorOrThrow(id);
        refreshTokenService.revokeAllForUser(collaborator);

        adminService.logAdminAction(
                admin,
                "COLLABORATOR_DELETE",
                "COLLABORATOR",
                String.valueOf(id),
                "Retrait du collaborateur : " + collaborator.getFullName() + " (" + collaborator.getPhone() + ")"
        );

        try {
            userRepository.delete(collaborator);
            userRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            log.info("Suppression physique impossible en raison de contraintes relationnelles, désactivation du collaborateur ID: {}", id);
            collaborator.setAdminPermissions(Collections.emptySet());
            collaborator.setRole(Role.ROLE_USER);
            collaborator.setIsSuspended(true);
            collaborator.setEmail(null);
            collaborator.setFirstName("Collaborateur");
            collaborator.setLastName("Supprimé");
            collaborator.setPhone("DELETED-" + collaborator.getId() + "-" + UUID.randomUUID().toString().substring(0, 8));
            userRepository.save(collaborator);
        }
    }

    private User findCollaboratorOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaborateur introuvable avec l'identifiant : " + id));

        if (user.getRole() != Role.ROLE_COLLABORATOR) {
            throw new IllegalArgumentException("L'utilisateur ciblé n'a pas le statut de collaborateur.");
        }
        return user;
    }
}
