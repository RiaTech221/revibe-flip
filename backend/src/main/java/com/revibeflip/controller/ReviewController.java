package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateReviewRequest;
import com.revibeflip.dto.ReviewDto;
import com.revibeflip.entity.User;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST des avis et évaluations de confiance post-livraison.
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Avis & Évaluations", description = "Système de notation 1 à 5 étoiles et commentaires après transaction")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentification requise");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Utilisateur non trouvé"));
    }

    @PostMapping
    @Operation(summary = "Laisser un avis (1 à 5 étoiles) sur le vendeur après livraison")
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        User reviewer = resolveUser(authentication);
        ReviewDto review = reviewService.createReview(request, reviewer);
        return ResponseEntity.ok(ApiResponse.ok(review, "Avis et note enregistrés avec succès."));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Consulter les avis reçus par un utilisateur")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getUserReviews(userId)));
    }

    @GetMapping("/my-reviews")
    @Operation(summary = "Consulter les avis que j'ai laissés")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getMyReviews(Authentication authentication) {
        User reviewer = resolveUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getMyReviews(reviewer)));
    }
}
