package com.revibeflip.dto;

import com.revibeflip.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour UserDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String countryCode;
    private String countryName;
    private String flagEmoji;
    private Boolean isVerified;
    private String profilePicture;
    private String address;
    private String city;
    private Double trustScore;
    private Double rating;
    private Integer reviewCount;
    private Boolean isSuspended;
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(user.getRole().name())
                .countryCode(user.getCountry() != null ? user.getCountry().getCode() : null)
                .countryName(user.getCountry() != null ? user.getCountry().getName() : null)
                .flagEmoji(user.getCountry() != null ? user.getCountry().getFlagEmoji() : null)
                .isVerified(user.getIsVerified())
                .profilePicture(user.getProfilePicture())
                .address(user.getAddress())
                .city(user.getCity())
                .trustScore(user.getTrustScore())
                .rating(user.getRating())
                .reviewCount(user.getReviewCount() != null ? user.getReviewCount() : 0)
                .isSuspended(Boolean.TRUE.equals(user.getIsSuspended()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
