package com.revibeflip.controller;

import com.revibeflip.dto.*;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.*;
import com.revibeflip.service.AdminService;
import com.revibeflip.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour l'Espace Administrateur de ReVibe FliP.
 * Tous les endpoints requièrent le rôle ROLE_ADMIN et un jeton JWT valide (Bearer).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Back-Office Administrateur", description = "Gestion globale : utilisateurs, annonces, litiges, commissions, fonds conservés et paramètres")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;
    private final com.revibeflip.service.LedgerService ledgerService;

    // ==========================================
    // 2. DASHBOARD (VUE D'ENSEMBLE)
    // ==========================================
    @GetMapping("/dashboard")
    @Operation(
            summary = "Tableau de bord administrateur (Vue d'ensemble)",
            description = "Agrège l'ensemble des métriques de la plateforme (revenus, commissions réelles, séquestre, commandes, transactions, panier moyen, entonnoir, répartition mobile money, nouveaux inscrits) avec variations calculées sur la période précédente de même durée. Fuseau horaire de référence : Africa/Dakar (UTC+0). Mise en cache courte de 30 secondes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Données du tableau de bord récupérées avec succès"),
            @ApiResponse(responseCode = "400", description = "Paramètres de période ou dates incohérentes"),
            @ApiResponse(responseCode = "401", description = "Non authentifié (Jeton JWT manquant ou expiré)"),
            @ApiResponse(responseCode = "403", description = "Accès refusé (ROLE_ADMIN obligatoire)")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<AdminDashboardDto>> getDashboardStats(
            @Parameter(description = "Période d'agrégation : '7d' (7 jours), '30d' (30 jours), '90d' (90 jours), 'month' (mois en cours), ou 'custom' (personnalisé)", example = "30d")
            @RequestParam(defaultValue = "30d") String period,
            @Parameter(description = "Date de début personnalisée au format YYYY-MM-DD (requis si period=custom)", example = "2026-10-01")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @Parameter(description = "Date de fin personnalisée au format YYYY-MM-DD (requis si period=custom)", example = "2026-10-31")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to
    ) {
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.getDashboardStats(period, from, to)));
    }

    // ==========================================
    // 3. GESTION DES UTILISATEURS (AVEC PAGINATION & GARDE-FOUS)
    // ==========================================
    @GetMapping("/users")
    @Operation(summary = "Lister les utilisateurs avec pagination et filtres", description = "Recherche multicritère par nom, prénom, téléphone, rôle et statut de suspension.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des utilisateurs"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès réservé aux administrateurs")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<UserDto>>> searchUsers(
            @Parameter(description = "Terme de recherche (nom, téléphone, email)") @RequestParam(required = false) String query,
            @Parameter(description = "Filtrer par rôle (ROLE_USER, ROLE_ADMIN)") @RequestParam(required = false) Role role,
            @Parameter(description = "Filtrer par statut de suspension") @RequestParam(required = false) Boolean isSuspended,
            @Parameter(description = "Numéro de page (0-indexé)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Nombre d'éléments par page") @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.searchUsersPage(query, role, isSuspended, pageable)));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Consulter le détail complet d'un utilisateur", description = "Retourne le profil, les annonces publiées, les achats, les ventes, les avis et les gains financiers.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Détail de l'utilisateur trouvé"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<AdminUserDetailDto>> getUserDetails(
            @Parameter(description = "ID unique de l'utilisateur") @PathVariable Long id
    ) {
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.getUserDetails(id)));
    }

    @PutMapping("/users/{id}/suspend")
    @Operation(summary = "Suspendre ou réactiver un utilisateur", description = "Applique ou lève la suspension. Protégé par garde-fous : un admin ne peut pas se suspendre lui-même ni suspendre le dernier admin actif.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut utilisateur mis à jour"),
            @ApiResponse(responseCode = "400", description = "Action interdite (auto-suspension ou violation de sécurité)"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<UserDto>> toggleSuspension(
            @Parameter(description = "ID de l'utilisateur à modifier") @PathVariable Long id,
            @Parameter(description = "true pour suspendre, false pour réactiver") @RequestParam boolean suspend,
            @AuthenticationPrincipal User admin
    ) {
        UserDto updated = adminService.toggleUserSuspension(id, suspend, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, suspend ? "Utilisateur suspendu avec succès." : "Compte utilisateur réactivé."));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Changer le rôle d'un utilisateur", description = "Permet de promouvoir un utilisateur en ROLE_ADMIN ou de le rétrograder en ROLE_USER. Un admin ne peut pas se rétrograder lui-même ni rétrograder le dernier admin actif.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rôle mis à jour"),
            @ApiResponse(responseCode = "400", description = "Rôle invalide ou auto-rétrogradation"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<UserDto>> updateUserRole(
            @Parameter(description = "ID de l'utilisateur") @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal User admin
    ) {
        UserDto updated = adminService.updateUserRole(id, request.getRole(), admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Rôle mis à jour vers : " + request.getRole().name()));
    }

    // ==========================================
    // 4. GESTION DES ANNONCES (AVEC PAGINATION)
    // ==========================================
    @GetMapping("/products")
    @Operation(summary = "Lister et modérer les annonces avec pagination", description = "Recherche et filtres par statut (ACTIVE, SOLD, INACTIVE, DRAFT), rayon et vendeur.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des annonces"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<ProductDto>>> searchProducts(
            @Parameter(description = "Recherche textuelle") @RequestParam(required = false) String query,
            @Parameter(description = "Statut de l'annonce") @RequestParam(required = false) ProductStatus status,
            @Parameter(description = "ID du rayon / catégorie") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "ID du vendeur") @RequestParam(required = false) Long sellerId,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.searchProductsPage(query, status, categoryId, sellerId, pageable)));
    }

    @PutMapping("/products/{id}/status")
    @Operation(summary = "Modifier le statut d'une annonce", description = "Permet d'activer ou de désactiver une annonce immédiatement.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut de l'annonce modifié"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Annonce non trouvée")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ProductDto>> setProductStatus(
            @Parameter(description = "ID de l'annonce") @PathVariable Long id,
            @Parameter(description = "Nouveau statut") @RequestParam ProductStatus status,
            @AuthenticationPrincipal User admin
    ) {
        ProductDto updated = adminService.setProductStatus(id, status, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Statut de l'annonce modifié en : " + status.name()));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Supprimer définitivement une annonce", description = "Supprime l'annonce du catalogue et enregistre l'action dans le journal d'audit.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce supprimée avec succès"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Annonce non trouvée")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> deleteProduct(
            @Parameter(description = "ID de l'annonce") @PathVariable Long id,
            @AuthenticationPrincipal User admin
    ) {
        adminService.deleteProduct(id, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null, "Annonce supprimée avec succès."));
    }

    // ==========================================
    // 5. GESTION DES CATÉGORIES (RAYONS)
    // ==========================================
    @PostMapping("/categories")
    @Operation(summary = "Créer un rayon / catégorie", description = "Ajoute un nouveau rayon au catalogue marketplace.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rayon créé"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Category>> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal User admin
    ) {
        Category created = adminService.createCategory(request, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(created, "Rayon créé avec succès."));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Modifier un rayon existant", description = "Met à jour le nom, slug, icône et description d'un rayon.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rayon modifié"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Rayon introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Category>> updateCategory(
            @Parameter(description = "ID du rayon") @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal User admin
    ) {
        Category updated = adminService.updateCategory(id, request, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Rayon mis à jour avec succès."));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Supprimer un rayon (avec protection anti-suppression)", description = "Bloqué si des annonces sont associées au rayon.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rayon supprimé"),
            @ApiResponse(responseCode = "400", description = "Suppression impossible (annonces associées existantes)"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Rayon introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> deleteCategory(
            @Parameter(description = "ID du rayon") @PathVariable Long id,
            @AuthenticationPrincipal User admin
    ) {
        adminService.deleteCategory(id, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null, "Rayon supprimé avec succès."));
    }

    // ==========================================
    // 6. GESTION DES COMMANDES & LIVRAISON (AVEC PAGINATION)
    // ==========================================
    @GetMapping("/orders")
    @Operation(summary = "Lister les commandes avec pagination", description = "Recherche par numéro de commande, acheteur, vendeur et filtre par statut.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des commandes"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<OrderDto>>> searchOrders(
            @Parameter(description = "Recherche textuelle") @RequestParam(required = false) String query,
            @Parameter(description = "Statut de la commande") @RequestParam(required = false) OrderStatus status,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.searchOrdersPage(query, status, pageable)));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Consulter le détail d'une commande", description = "Numéro unique, acheteur, vendeur, produit, montants détaillés, mode et adresse de livraison.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Détail de la commande"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Commande introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> getOrderDetails(
            @Parameter(description = "ID de la commande") @PathVariable Long id
    ) {
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.getOrderDetails(id)));
    }

    @PutMapping("/orders/{id}/delivery-status")
    @Operation(summary = "Mettre à jour l'étape de livraison", description = "Fait progresser l'étape : PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED avec ajout de note.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Étape de livraison mise à jour"),
            @ApiResponse(responseCode = "400", description = "Paramètre de livraison invalide"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Commande non trouvée")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> updateDeliveryStatus(
            @Parameter(description = "ID de la commande") @PathVariable Long id,
            @Parameter(description = "Nouveau statut logistique") @RequestParam DeliveryStatus deliveryStatus,
            @Parameter(description = "Note de suivi optionnelle") @RequestParam(required = false) String notes,
            @AuthenticationPrincipal User admin
    ) {
        OrderDto updated = adminService.updateOrderDeliveryStatus(id, deliveryStatus, notes, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Étape de livraison mise à jour : " + deliveryStatus.getLabel()));
    }

    // ==========================================
    // 7. GESTION DES PAIEMENTS & TRANSACTIONS (AVEC PAGINATION)
    // ==========================================
    @GetMapping("/payments")
    @Operation(summary = "Lister les paiements et transactions", description = "Décomposition financière : prix article, frais validation (1%), livraison, commission plateforme (20%) et moyen de paiement PayTech (Wave, Orange Money, Free Money).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des transactions"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<AdminPaymentDto>>> searchPayments(
            @Parameter(description = "Recherche par référence ou commande") @RequestParam(required = false) String query,
            @Parameter(description = "Moyen de paiement (WAVE, ORANGE_MONEY, FREE_MONEY)") @RequestParam(required = false) PaymentMethod method,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.searchPaymentsPage(query, method, pageable)));
    }

    // ==========================================
    // 8. SIGNALEMENTS & LITIGES (AVEC PAGINATION)
    // ==========================================
    @GetMapping("/reports")
    @Operation(summary = "Lister les signalements et litiges", description = "Motifs : annonce trompeuse, contrefaçon, arnaque, faux profil, comportement abusif, autre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des signalements"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<ReportDto>>> searchReports(
            @Parameter(description = "Statut du signalement (PENDING, RESOLVED, DISMISSED)") @RequestParam(required = false) ReportStatus status,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.searchReportsPage(status, pageable)));
    }

    @PutMapping("/reports/{id}/resolve")
    @Operation(summary = "Traiter et clôturer un signalement", description = "Applique une action disciplinaire (WARN, DEACTIVATE_LISTING, SUSPEND_USER, NONE) et consigne la note.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Signalement résolu et consigné"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Signalement non trouvé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ReportDto>> resolveReport(
            @Parameter(description = "ID du signalement") @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal User admin
    ) {
        ReportDto updated = adminService.resolveReportWithAction(
                id,
                request.getStatus(),
                request.getAction(),
                request.getAdminNotes(),
                admin
        );
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Signalement traité et consigné avec succès."));
    }

    // ==========================================
    // 10. PARAMÈTRES DE LA PLATEFORME (Point 4)
    // ==========================================
    @GetMapping("/settings")
    @Operation(summary = "Récupérer la configuration générale de la plateforme", description = "Retourne le taux de commission (20%), les frais de validation (1%), devise et contacts support.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuration récupérée"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PlatformSettingsDto>> getPlatformSettings() {
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.getPlatformSettings()));
    }

    @PutMapping("/settings")
    @Operation(summary = "Mettre à jour la configuration générale de la marketplace", description = "Permet de modifier les taux de commission et frais de validation qui sont appliqués immédiatement à toutes les opérations.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuration enregistrée"),
            @ApiResponse(responseCode = "400", description = "Taux hors bornes autorisées"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PlatformSettingsDto>> updatePlatformSettings(
            @Valid @RequestBody UpdatePlatformSettingsRequest request,
            @AuthenticationPrincipal User admin
    ) {
        PlatformSettingsDto updated = adminService.updatePlatformSettings(request, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(updated, "Paramètres de la marketplace actualisés avec succès."));
    }

    @GetMapping("/conversations/{id}/audit-view")
    @Operation(summary = "Consulter en lecture seule les messages d'une discussion liée à un litige (accès journalisé)")
    public ResponseEntity<com.revibeflip.dto.ApiResponse<List<MessageDto>>> auditViewConversation(
            @PathVariable Long id,
            @RequestParam(required = false) Long reportId,
            @AuthenticationPrincipal User admin
    ) {
        List<MessageDto> messages = adminService.auditViewConversation(id, reportId, admin);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(messages));
    }

    // ==========================================
    // 11. JOURNAL D'AUDIT ADMIN (AVEC PAGINATION)
    // ==========================================
    @GetMapping("/audit-logs")
    @Operation(summary = "Consulter le journal d'audit des actions sensibles", description = "Historique paginé de toutes les suspensions, suppressions, résolutions de litiges et modifications de rôles.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Journal d'audit paginé"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<AdminActionLogDto>>> getAuditLogs(
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(adminService.getAuditLogsPage(pageable)));
    }

    @GetMapping("/ledger")
    @Operation(summary = "Consulter le grand livre des fonds et soldes")
    public ResponseEntity<com.revibeflip.dto.ApiResponse<java.util.Map<String, Object>>> getLedger(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("balances", ledgerService.getBalancesFromLedger());
        result.put("entries", PageResponseDto.fromPage(ledgerService.getEntries(pageable)));
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(result));
    }

    @GetMapping(value = "/ledger/export", produces = "text/csv")
    @Operation(summary = "Exporter le grand livre comptable au format CSV")
    public ResponseEntity<String> exportLedgerCsv() {
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revibeflip-ledger.csv")
                .body(ledgerService.exportCsv());
    }
}
