package com.revibeflip.repository;

import com.revibeflip.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface Spring Data JPA pour les évaluations vérifiées et avis acheteurs.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    List<Review> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);

    Optional<Review> findByOrderId(Long orderId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetUser.id = :targetUserId")
    Double calculateAverageRating(@Param("targetUserId") Long targetUserId);

    long countByTargetUserId(Long targetUserId);

    long countByTargetUserIdAndRating(Long targetUserId, Integer rating);

    long countByTargetUserIdAndCreatedAtBetween(Long targetUserId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    org.springframework.data.domain.Page<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId, org.springframework.data.domain.Pageable pageable);
}
