package com.revibeflip.controller;

import com.revibeflip.dto.ChatMessageDto;
import com.revibeflip.dto.ConversationSummaryDto;
import com.revibeflip.dto.NotificationDto;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.PageResponseDto;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.ReportReviewRequest;
import com.revibeflip.dto.ReviewDto;
import com.revibeflip.dto.SellerDashboardDto;
import com.revibeflip.dto.SellerProductRequest;
import com.revibeflip.dto.SellerProfileDto;
import com.revibeflip.dto.SellerTransactionDto;
import com.revibeflip.dto.SellerTransactionSummaryDto;
import com.revibeflip.dto.SendMessageRequest;
import com.revibeflip.dto.UpdateSellerProfileRequest;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.SellerService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@Tag(name = "Espace Vendeur", description = "Endpoints réservés aux membres vendeurs pour gérer leurs annonces, commandes, transactions, avis et messagerie")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class SellerController {

    private final SellerService sellerService;
    private final UserRepository userRepository;

    private User resolveSeller(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Utilisateur non authentifié");
        }
        if (authentication.getPrincipal() instanceof User user) {
            return user;
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Vendeur introuvable pour l'identifiant: " + authentication.getName()));
    }

    // ==========================================
    // 1. PROFIL VENDEUR
    // ==========================================
    @GetMapping("/profile")
    @Operation(summary = "Consulter son profil vendeur", description = "Retourne les informations du profil vendeur ainsi que ses statistiques (annonces, ventes, note moyenne).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil vendeur récupéré avec succès"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<SellerProfileDto>> getProfile(
            Authentication authentication
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerProfile(seller)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Modifier son profil vendeur", description = "Permet de mettre à jour son nom, prénom, email, ville, adresse et photo de profil.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil mis à jour"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<SellerProfileDto>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateSellerProfileRequest request
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.updateSellerProfile(seller, request), "Profil mis à jour avec succès."));
    }

    // ==========================================
    // 2. DASHBOARD VENDEUR
    // ==========================================
    @GetMapping("/dashboard")
    @Operation(summary = "Tableau de bord vendeur complet", description = "Données strictement isolées au vendeur connecté, calculées selon le fuseau Africa/Dakar avec variations vs période précédente. Périodes : 7d, 30d, 90d, month, custom.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statistiques dashboard récupérées"),
            @ApiResponse(responseCode = "400", description = "Requête invalide"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<SellerDashboardDto>> getDashboard(
            Authentication authentication,
            @Parameter(description = "Période temporelle (7d, 30d, 90d, month, custom)")
            @RequestParam(required = false, defaultValue = "30d") String period,
            @Parameter(description = "Date début personnalisée (YYYY-MM-DD)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @Parameter(description = "Date fin personnalisée (YYYY-MM-DD)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerDashboard(seller, period, from, to)));
    }

    // ==========================================
    // 3. GESTION DES ANNONCES (AVEC VÉRIFICATION DE PROPRIÉTÉ)
    // ==========================================
    @GetMapping("/products")
    @Operation(summary = "Mes annonces avec pagination et filtres", description = "Recherche par mot-clé et filtrage par statut (ACTIVE, SOLD, INACTIVE, DRAFT).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des annonces"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<ProductDto>>> getProducts(
            Authentication authentication,
            @Parameter(description = "Recherche textuelle") @RequestParam(required = false) String query,
            @Parameter(description = "Filtrer par statut") @RequestParam(required = false) ProductStatus status,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Nombre d'annonces par page") @RequestParam(defaultValue = "10") int size
    ) {
        User seller = resolveSeller(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerProducts(seller, query, status, pageable)));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Détail d'une annonce vendeur", description = "Retourne l'annonce si l'utilisateur en est bien le propriétaire.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Détail de l'annonce"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé (non propriétaire)"),
            @ApiResponse(responseCode = "404", description = "Annonce non trouvée")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ProductDto>> getProductById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerProductById(seller, id)));
    }

    @PostMapping("/products")
    @Operation(summary = "Créer une nouvelle annonce", description = "Enregistrement en brouillon (DRAFT) ou publication directe (ACTIVE) avec photos multiples.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Annonce créée avec succès"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Compte suspendu")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ProductDto>> createProduct(
            Authentication authentication,
            @Valid @RequestBody SellerProductRequest request
    ) {
        User seller = resolveSeller(authentication);
        ProductDto created = sellerService.createProduct(seller, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(com.revibeflip.dto.ApiResponse.ok(created, "Annonce enregistrée avec succès."));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Modifier une annonce", description = "Modification des informations. Bloqué si une commande est en cours de traitement.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce mise à jour"),
            @ApiResponse(responseCode = "400", description = "Modification refusée (commande en cours)"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Non propriétaire ou compte suspendu"),
            @ApiResponse(responseCode = "404", description = "Annonce non trouvée")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ProductDto>> updateProduct(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SellerProductRequest request
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.updateProduct(seller, id, request), "Annonce modifiée avec succès."));
    }

    @PutMapping("/products/{id}/status")
    @Operation(summary = "Activer ou désactiver une annonce", description = "Permet de basculer entre ACTIVE et INACTIVE.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut modifié"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ProductDto>> toggleStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam ProductStatus status
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.toggleProductStatus(seller, id, status), "Statut de l'annonce mis à jour."));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Supprimer une annonce", description = "Suppression définitive. Bloqué si une commande est rattachée à cette annonce.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Annonce supprimée"),
            @ApiResponse(responseCode = "400", description = "Suppression impossible (commande en cours)"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> deleteProduct(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        sellerService.deleteProduct(seller, id);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null, "Annonce supprimée avec succès."));
    }

    // ==========================================
    // 4. RÉCEPTION ET TRAITEMENT DES COMMANDES
    // ==========================================
    @GetMapping("/orders")
    @Operation(summary = "Mes commandes reçues en tant que vendeur", description = "Liste paginée des commandes avec recherche par numéro et filtre par statut.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des commandes"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<OrderDto>>> getOrders(
            Authentication authentication,
            @Parameter(description = "Recherche par numéro de commande") @RequestParam(required = false) String query,
            @Parameter(description = "Statut de la commande") @RequestParam(required = false) OrderStatus status,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Nombre par page") @RequestParam(defaultValue = "10") int size
    ) {
        User seller = resolveSeller(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerOrders(seller, query, status, pageable)));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Détail d'une commande reçue", description = "Vérifie que l'utilisateur est bien le vendeur associé à cette commande.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Détail de la commande"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Non autorisé (vendeur distinct)")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> getOrderById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerOrderById(seller, id)));
    }

    @PutMapping("/orders/{id}/accept")
    @Operation(summary = "Accepter une commande", description = "Confirme la commande reçue et informe l'acheteur.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Commande acceptée"),
            @ApiResponse(responseCode = "400", description = "Action non permise sur ce statut"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> acceptOrder(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.acceptOrder(seller, id), "Commande acceptée avec succès."));
    }

    @PutMapping("/orders/{id}/refuse")
    @Operation(summary = "Refuser ou annuler une commande", description = "Annule la commande et enclenche le remboursement sous séquestre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Commande refusée et remboursée"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> refuseOrder(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) String reason
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.refuseOrder(seller, id, reason), "Commande refusée. Les fonds sont débloqués pour l'acheteur."));
    }

    @PutMapping("/orders/{id}/ready-for-pickup")
    @Operation(summary = "Marquer le colis comme préparé / remis pour la livraison", description = "Fait progresser l'étape de livraison de PENDING vers PICKED_UP.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Étape de livraison mise à jour (PICKED_UP)"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<OrderDto>> markReadyForPickup(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.markReadyForPickup(seller, id), "Colis marqué comme préparé et remis au transporteur."));
    }

    // ==========================================
    // 5. TRANSACTIONS ET GAINS DU VENDEUR
    // ==========================================
    @GetMapping("/transactions")
    @Operation(summary = "Historique financier de mes ventes", description = "Décomposition : prix article, frais validation (1%), livraison, commission plateforme (20%) et net vendeur (80%). Note : simulation interne du séquestre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des transactions"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<SellerTransactionDto>>> getTransactions(
            Authentication authentication,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "10") int size
    ) {
        User seller = resolveSeller(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerTransactions(seller, pageable)));
    }

    @GetMapping("/transactions/summary")
    @Operation(summary = "Synthèse financière des gains et séquestre", description = "Total brut, total commissions versées, net versé et montant actuellement séquestré.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Synthèse financière calculée"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<SellerTransactionSummaryDto>> getTransactionSummary(
            Authentication authentication
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerTransactionSummary(seller)));
    }

    // ==========================================
    // 6. ÉVALUATIONS REÇUES ET SIGNALEMENT D'ABUS
    // ==========================================
    @GetMapping("/reviews")
    @Operation(summary = "Avis et évaluations reçus", description = "Consulter les notes (1 à 5) et commentaires laissés par les acheteurs.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste paginée des avis"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<ReviewDto>>> getReviews(
            Authentication authentication,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "10") int size
    ) {
        User seller = resolveSeller(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerReviews(seller, pageable)));
    }

    @PostMapping("/reviews/{id}/report")
    @Operation(summary = "Signaler un avis abusif", description = "Transmet le litige à l'administration de ReVibe FliP pour modération.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Avis signalé aux modérateurs"),
            @ApiResponse(responseCode = "403", description = "Action non autorisée sur cet avis")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> reportReview(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReportReviewRequest request
    ) {
        User seller = resolveSeller(authentication);
        sellerService.reportReview(seller, id, request);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null, "L'évaluation a été signalée aux modérateurs de la plateforme."));
    }

    // ==========================================
    // 7. MESSAGERIE TEMPS RÉEL ACHETEUR-VENDEUR
    // ==========================================
    @GetMapping("/conversations")
    @Operation(summary = "Mes conversations de vente", description = "Liste des discussions avec les acheteurs et l'annonce associée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des conversations"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<List<ConversationSummaryDto>>> getConversations(
            Authentication authentication
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getSellerConversations(seller)));
    }

    @GetMapping("/conversations/{id}/messages")
    @Operation(summary = "Consulter les messages d'une conversation", description = "Retourne l'historique et marque les messages entrants comme lus.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Messages de la discussion"),
            @ApiResponse(responseCode = "403", description = "Non participant"),
            @ApiResponse(responseCode = "404", description = "Conversation introuvable")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<List<ChatMessageDto>>> getConversationMessages(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User seller = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getConversationMessages(seller, id)));
    }

    @PostMapping("/conversations/{id}/messages")
    @Operation(summary = "Envoyer un message dans une conversation", description = "Enregistre le message et le diffuse en temps réel via WebSocket + STOMP.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Message envoyé et diffusé"),
            @ApiResponse(responseCode = "403", description = "Compte suspendu ou non participant")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<ChatMessageDto>> sendMessage(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) SendMessageRequest request
    ) {
        User seller = resolveSeller(authentication);
        String text = (request != null && request.getContent() != null) ? request.getContent() : "";
        ChatMessageDto sent = sellerService.sendMessage(seller, id, text);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sent, "Message envoyé avec succès."));
    }

    // ==========================================
    // 8. NOTIFICATIONS
    // ==========================================
    @GetMapping("/notifications")
    @Operation(summary = "Liste des notifications reçues", description = "Commandes, messages, livraisons et avis.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notifications paginées"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<com.revibeflip.dto.ApiResponse<PageResponseDto<NotificationDto>>> getNotifications(
            Authentication authentication,
            @Parameter(description = "Numéro de page") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de page") @RequestParam(defaultValue = "15") int size
    ) {
        User user = resolveSeller(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getUserNotifications(user, pageable)));
    }

    @GetMapping("/notifications/unread-count")
    @Operation(summary = "Compteur de notifications non lues", description = "Pour le badge de la cloche en temps réel.")
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Long>> getUnreadCount(
            Authentication authentication
    ) {
        User user = resolveSeller(authentication);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(sellerService.getUnreadNotificationsCount(user)));
    }

    @PutMapping("/notifications/{id}/read")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> markNotificationAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = resolveSeller(authentication);
        sellerService.markNotificationAsRead(user, id);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null));
    }

    @PutMapping("/notifications/read-all")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    public ResponseEntity<com.revibeflip.dto.ApiResponse<Void>> markAllAsRead(
            Authentication authentication
    ) {
        User user = resolveSeller(authentication);
        sellerService.markAllNotificationsAsRead(user);
        return ResponseEntity.ok(com.revibeflip.dto.ApiResponse.ok(null, "Toutes les notifications sont marquées comme lues."));
    }
}
