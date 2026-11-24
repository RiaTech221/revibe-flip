package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CollaboratorDto;
import com.revibeflip.dto.CreateCollaboratorRequest;
import com.revibeflip.dto.PageResponseDto;
import com.revibeflip.dto.UpdateCollaboratorPermissionsRequest;
import com.revibeflip.entity.User;
import com.revibeflip.security.PaginationValidator;
import com.revibeflip.service.CollaboratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour la gestion des collaborateurs du Back-Office (US-36).
 *
 * <p>Strictement réservé aux administrateurs (ROLE_ADMIN).
 * Permet d'ajouter, modifier les permissions, suspendre et retirer des collaborateurs.
 */
@RestController
@RequestMapping({"/api/admin/collaborators", "/api/v1/admin/collaborators"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Back-Office Collaborateurs", description = "Gestion des comptes collaborateurs et attribution fine des permissions par module (US-36)")
@SecurityRequirement(name = "bearerAuth")
public class AdminCollaboratorController {

    private final CollaboratorService collaboratorService;

    @GetMapping
    @Operation(summary = "Lister les collaborateurs du Back-Office", description = "Recherche multicritère avec pagination et statut de suspension.")
    public ResponseEntity<ApiResponse<PageResponseDto<CollaboratorDto>>> getCollaborators(
            @Parameter(description = "Recherche textuelle (nom, prénom, téléphone, email)") @RequestParam(required = false) String query,
            @Parameter(description = "Filtrer par statut de suspension") @RequestParam(required = false) Boolean isSuspended,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size,
            @Parameter(description = "Champ de tri") @RequestParam(required = false) String sortBy,
            @Parameter(description = "Direction du tri (asc/desc)") @RequestParam(required = false) String sortDir
    ) {
        Pageable pageable = PaginationValidator.validateAndCreate(
                page, size, sortBy, sortDir, PaginationValidator.USER_SORT_FIELDS, "createdAt", Sort.Direction.DESC
        );
        return ResponseEntity.ok(ApiResponse.ok(collaboratorService.getCollaborators(query, isSuspended, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un collaborateur avec ses permissions")
    public ResponseEntity<ApiResponse<CollaboratorDto>> getCollaborator(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(collaboratorService.getCollaborator(id)));
    }

    @PostMapping
    @Operation(summary = "Ajouter un collaborateur avec attribution de permissions", description = "Crée un compte avec le rôle ROLE_COLLABORATOR et les permissions de modules cochées.")
    public ResponseEntity<ApiResponse<CollaboratorDto>> createCollaborator(
            @Valid @RequestBody CreateCollaboratorRequest request,
            @AuthenticationPrincipal User admin
    ) {
        CollaboratorDto created = collaboratorService.createCollaborator(request, admin);
        return ResponseEntity.ok(ApiResponse.ok(created, "Compte collaborateur créé avec succès."));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier les informations et les permissions d'un collaborateur", description = "Met à jour immédiatement les permissions accordées au collaborateur.")
    public ResponseEntity<ApiResponse<CollaboratorDto>> updateCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCollaboratorPermissionsRequest request,
            @AuthenticationPrincipal User admin
    ) {
        CollaboratorDto updated = collaboratorService.updateCollaborator(id, request, admin);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Permissions du collaborateur actualisées avec succès."));
    }

    @PutMapping("/{id}/suspend")
    @Operation(summary = "Suspendre ou réactiver un collaborateur", description = "La suspension révoque immédiatement tous les jetons actifs du collaborateur.")
    public ResponseEntity<ApiResponse<CollaboratorDto>> toggleSuspension(
            @PathVariable Long id,
            @RequestParam boolean suspend,
            @AuthenticationPrincipal User admin
    ) {
        CollaboratorDto updated = collaboratorService.toggleSuspension(id, suspend, admin);
        return ResponseEntity.ok(ApiResponse.ok(updated, suspend ? "Collaborateur suspendu avec succès." : "Collaborateur réactivé avec succès."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Retirer / révoquer un collaborateur")
    public ResponseEntity<ApiResponse<Void>> deleteCollaborator(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin
    ) {
        collaboratorService.deleteCollaborator(id, admin);
        return ResponseEntity.ok(ApiResponse.ok(null, "Collaborateur retiré avec succès."));
    }
}
