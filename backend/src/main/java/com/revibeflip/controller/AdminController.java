package com.revibeflip.controller;

import com.revibeflip.dto.AdminDashboardDto;
import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.ReportDto;
import com.revibeflip.dto.UserDto;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.ReportStatus;
import com.revibeflip.service.AdminService;
import com.revibeflip.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Back-Office Administrateur", description = "Gestion des utilisateurs, annonces, litiges, commissions et statistiques")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Statistiques et indicateurs clés du tableau de bord admin")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    @Operation(summary = "Rechercher et lister les utilisateurs")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.searchUsers(query)));
    }

    @PutMapping("/users/{id}/suspend")
    @Operation(summary = "Suspendre ou réactiver un utilisateur")
    public ResponseEntity<ApiResponse<UserDto>> toggleSuspension(
            @PathVariable Long id,
            @RequestParam boolean suspend
    ) {
        UserDto updated = adminService.toggleUserSuspension(id, suspend);
        return ResponseEntity.ok(ApiResponse.ok(updated, suspend ? "Utilisateur suspendu." : "Utilisateur réactivé."));
    }

    @GetMapping("/products")
    @Operation(summary = "Recherche et modération de l'ensemble des annonces")
    public ResponseEntity<ApiResponse<List<ProductDto>>> searchProducts(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.adminSearchProducts(query)));
    }

    @PutMapping("/products/{id}/status")
    @Operation(summary = "Changer le statut d'une annonce (ACTIVE, INACTIVE, etc.)")
    public ResponseEntity<ApiResponse<ProductDto>> setProductStatus(
            @PathVariable Long id,
            @RequestParam ProductStatus status
    ) {
        ProductDto updated = adminService.setProductStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Statut de l'annonce mis à jour."));
    }

    @GetMapping("/reports")
    @Operation(summary = "Lister les signalements et litiges")
    public ResponseEntity<ApiResponse<List<ReportDto>>> getAllReports() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAllReports()));
    }

    @PutMapping("/reports/{id}/resolve")
    @Operation(summary = "Traiter et clôturer un signalement")
    public ResponseEntity<ApiResponse<ReportDto>> resolveReport(
            @PathVariable Long id,
            @RequestParam ReportStatus status,
            @RequestParam(required = false) String adminNotes
    ) {
        ReportDto updated = reportService.resolveReport(id, status, adminNotes);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Signalement traité."));
    }

    @PostMapping("/categories")
    @Operation(summary = "Créer une nouvelle catégorie")
    public ResponseEntity<ApiResponse<Category>> createCategory(
            @RequestParam String name,
            @RequestParam String slug,
            @RequestParam(required = false) String icon,
            @RequestParam(required = false) String description
    ) {
        Category created = adminService.createCategory(name, slug, icon, description);
        return ResponseEntity.ok(ApiResponse.ok(created, "Catégorie créée."));
    }
}
