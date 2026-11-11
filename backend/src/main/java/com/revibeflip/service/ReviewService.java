package com.revibeflip.service;

import com.revibeflip.dto.CreateReviewRequest;
import com.revibeflip.dto.ReviewDto;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.Review;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.OrderStatus;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ReviewRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion des avis clients vérifiés et calcul automatique de la note moyenne vendeur.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReviewDto createReview(CreateReviewRequest request, User reviewer) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Commande non trouvée."));

        if (!order.getBuyer().getId().equals(reviewer.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Seul l'acheteur peut laisser un avis.");
        }

        if (!OrderStatus.COMPLETED.equals(order.getStatus())) {
            throw new IllegalStateException("Vous ne pouvez noter le vendeur qu'une fois la commande terminée.");
        }

        if (reviewRepository.findByOrderId(order.getId()).isPresent()) {
            throw new IllegalStateException("Vous avez déjà laissé un avis pour cette commande.");
        }

        User seller = order.getSeller();

        Review review = Review.builder()
                .order(order)
                .reviewer(reviewer)
                .targetUser(seller)
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : "")
                .build();

        Review saved = reviewRepository.save(review);

        // Update seller average rating and review count
        Double avgRating = reviewRepository.calculateAverageRating(seller.getId());
        long count = reviewRepository.countByTargetUserId(seller.getId());
        seller.setRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP).doubleValue() : 5.0);
        seller.setReviewCount((int) count);

        // Calculate trust score boost for seller
        double trust = Math.min(100.0, 70.0 + (seller.getRating() * 6.0));
        seller.setTrustScore(trust);
        userRepository.save(seller);

        notificationService.createNotification(
                seller,
                "Nouvel avis reçu (" + request.getRating() + "/5 étoiles) !",
                reviewer.getFullName() + " vous a évalué : " + (request.getComment() != null ? request.getComment() : ""),
                NotificationType.NEW_REVIEW,
                "/users/" + seller.getId()
        );

        return ReviewDto.fromEntity(saved);
    }

    public List<ReviewDto> getUserReviews(Long userId) {
        return reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getMyReviews(User reviewer) {
        return reviewRepository.findByReviewerIdOrderByCreatedAtDesc(reviewer.getId())
                .stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
    }
}
