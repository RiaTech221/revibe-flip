package com.revibeflip.service;

import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service centralisant les règles de sécurité et d'intégrité métier pour la modification d'annonces (SEC-07 / US-08).
 * Appliqué de manière uniforme à tous les canaux (API REST public, Espace Vendeur, Back-Office Admin).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductModificationPolicyService {

    private final OrderRepository orderRepository;

    /**
     * Statuts de commande considérés comme actifs (en cours de traitement ou de litige).
     */
    public static final List<OrderStatus> ACTIVE_ORDER_STATUSES = List.of(
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.AWAITING_PAYMENT,
            OrderStatus.PAID_ESCROW_LOCKED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.DISPUTED
    );

    /**
     * Valide qu'un utilisateur est autorisé à modifier une annonce et que l'annonce est dans un état modifiable.
     *
     * @param product       L'annonce existante en base
     * @param currentUser   L'utilisateur qui tente la modification
     * @param newPrice      Nouveau prix (ou null si inchangé)
     * @param newTitle      Nouveau titre (ou null si inchangé)
     * @param newCategoryId Nouvel identifiant de catégorie (ou null si inchangé)
     * @param newCondition  Nouvel état du produit (ou null si inchangé)
     * @throws AccessDeniedException si l'utilisateur n'est ni propriétaire de l'annonce ni administrateur
     * @throws IllegalStateException si l'annonce est SOLD ou RESERVED, ou si un champ clé est modifié sous commande active
     */
    public void validateProductModification(
            Product product,
            User currentUser,
            BigDecimal newPrice,
            String newTitle,
            Long newCategoryId,
            ProductCondition newCondition
    ) {
        // 1. Contrôle d'accès : propriétaire légitime ou administrateur Back-Office
        boolean isOwner = product.getSeller() != null && product.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            log.warn("Tentative de modification non autorisée de l'article #{} par l'utilisateur #{}", product.getId(), currentUser.getId());
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier cette annonce.");
        }

        // 2. Statuts modifiables : seuls DRAFT, ACTIVE et INACTIVE sont acceptés
        // Si l'annonce est SOLD ou RESERVED -> refus strict (HTTP 409 Conflict)
        if (product.getStatus() == ProductStatus.SOLD || product.getStatus() == ProductStatus.RESERVED) {
            log.warn("Tentative de modification refusée pour l'annonce #{} car statut = {}", product.getId(), product.getStatus());
            throw new IllegalStateException("Impossible de modifier une annonce au statut " + product.getStatus() + ".");
        }

        // 3. Commandes en cours : le prix et les champs clés ne peuvent pas être modifiés
        boolean hasActiveOrders = orderRepository.existsByProductIdAndStatusIn(product.getId(), ACTIVE_ORDER_STATUSES);
        if (hasActiveOrders) {
            // Protection du prix
            if (newPrice != null && product.getPrice() != null && newPrice.compareTo(product.getPrice()) != 0) {
                log.warn("Tentative de modification du prix sous commande active pour l'article #{}", product.getId());
                throw new IllegalStateException("Impossible de modifier le prix d'une annonce faisant l'objet d'une commande en cours.");
            }

            // Protection du titre
            if (newTitle != null && product.getTitle() != null && !newTitle.trim().equalsIgnoreCase(product.getTitle().trim())) {
                log.warn("Tentative de modification du titre sous commande active pour l'article #{}", product.getId());
                throw new IllegalStateException("Impossible de modifier le titre d'une annonce faisant l'objet d'une commande en cours.");
            }

            // Protection de la catégorie
            if (newCategoryId != null && (product.getCategory() == null || !newCategoryId.equals(product.getCategory().getId()))) {
                log.warn("Tentative de modification de la catégorie sous commande active pour l'article #{}", product.getId());
                throw new IllegalStateException("Impossible de modifier la catégorie d'une annonce faisant l'objet d'une commande en cours.");
            }

            // Protection de l'état / condition
            if (newCondition != null && product.getCondition() != null && newCondition != product.getCondition()) {
                log.warn("Tentative de modification de l'état sous commande active pour l'article #{}", product.getId());
                throw new IllegalStateException("Impossible de modifier l'état d'une annonce faisant l'objet d'une commande en cours.");
            }
        }
    }

    /**
     * Valide qu'un utilisateur est autorisé à modifier le statut d'une annonce.
     *
     * @param product     L'annonce existante
     * @param currentUser L'utilisateur qui demande le changement
     * @param newStatus   Le nouveau statut souhaité
     * @throws AccessDeniedException si l'utilisateur n'est ni propriétaire ni administrateur
     * @throws IllegalStateException si l'annonce est SOLD ou RESERVED, ou si une commande est en cours
     */
    public void validateStatusChange(Product product, User currentUser, ProductStatus newStatus) {
        boolean isOwner = product.getSeller() != null && product.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier le statut de cette annonce.");
        }

        if (newStatus == null) {
            throw new IllegalArgumentException("Le statut cible de l'annonce est obligatoire.");
        }

        if (product.getStatus() == ProductStatus.SOLD || product.getStatus() == ProductStatus.RESERVED) {
            throw new IllegalStateException("Une annonce vendue ou réservée ne peut pas changer de statut.");
        }

        // SEC-18 : Un vendeur ne peut choisir que DRAFT, ACTIVE ou INACTIVE (jamais SOLD ou RESERVED)
        if (!isAdmin && (newStatus == ProductStatus.SOLD || newStatus == ProductStatus.RESERVED)) {
            throw new IllegalStateException("Un vendeur ne peut pas définir manuellement le statut " + newStatus + ".");
        }

        if (orderRepository.existsByProductIdAndStatusIn(product.getId(), ACTIVE_ORDER_STATUSES)) {
            throw new IllegalStateException("Impossible de modifier le statut d'une annonce ayant une commande en cours.");
        }
    }

    /**
     * Valide qu'un utilisateur est autorisé à supprimer une annonce.
     *
     * @param product     L'annonce existante
     * @param currentUser L'utilisateur qui demande la suppression
     * @throws AccessDeniedException si l'utilisateur n'est ni propriétaire ni administrateur
     * @throws IllegalStateException si une commande est en cours sur l'annonce
     */
    public void validateProductDeletion(Product product, User currentUser) {
        boolean isOwner = product.getSeller() != null && product.getSeller().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer cette annonce.");
        }

        if (orderRepository.existsByProductIdAndStatusIn(product.getId(), ACTIVE_ORDER_STATUSES)) {
            throw new IllegalStateException("Action impossible : cette annonce est rattachée à une commande en cours de traitement.");
        }
    }
}
