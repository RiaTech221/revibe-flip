package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private UserDto user;
    private List<ProductDto> products;
    private List<OrderDto> purchases;
    private List<OrderDto> sales;
    private List<ReviewDto> reviews;
    private BigDecimal totalSpent;
    private BigDecimal totalEarned;
    private Double averageRating;
    private long totalReviews;
}
