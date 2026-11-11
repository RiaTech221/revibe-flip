package com.revibeflip.repository;

import com.revibeflip.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    List<Review> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);

    Optional<Review> findByOrderId(Long orderId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetUser.id = :targetUserId")
    Double calculateAverageRating(@Param("targetUserId") Long targetUserId);

    long countByTargetUserId(Long targetUserId);

    org.springframework.data.domain.Page<Review> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId, org.springframework.data.domain.Pageable pageable);
}
