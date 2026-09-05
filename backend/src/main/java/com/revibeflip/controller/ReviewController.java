package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateReviewRequest;
import com.revibeflip.dto.ReviewDto;
import com.revibeflip.entity.User;
import com.revibeflip.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Avis & Évaluations", description = "Système de notation 1 à 5 étoiles et commentaires après transaction")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Laisser un avis (1 à 5 étoiles) sur le vendeur après livraison")
    public ResponseEntity<ApiResponse<ReviewDto>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal User reviewer
    ) {
        ReviewDto review = reviewService.createReview(request, reviewer);
        return ResponseEntity.ok(ApiResponse.ok(review, "Avis et note enregistrés avec succès."));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Consulter les avis reçus par un utilisateur")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getUserReviews(userId)));
    }
}
