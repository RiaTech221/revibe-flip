package com.revibeflip.dto;

import com.revibeflip.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private Long orderId;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerAvatar;
    private Long targetUserId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static ReviewDto fromEntity(Review review) {
        if (review == null) return null;
        return ReviewDto.builder()
                .id(review.getId())
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .reviewerName(review.getReviewer() != null ? review.getReviewer().getFullName() : null)
                .reviewerAvatar(review.getReviewer() != null ? review.getReviewer().getProfilePicture() : null)
                .targetUserId(review.getTargetUser() != null ? review.getTargetUser().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
