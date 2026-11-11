package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String email;
    private String countryCode;
    private String countryName;
    private String city;
    private String address;
    private String profilePicture;
    private String bio;
    private boolean isSuspended;
    private boolean isVerified;
    private LocalDateTime memberSince;

    // Statistiques vendeur
    private long totalListings;
    private long activeListings;
    private long soldListings;
    private long totalSalesCount;
    private BigDecimal totalTurnover;
    private Double averageRating;
    private long reviewCount;
}
