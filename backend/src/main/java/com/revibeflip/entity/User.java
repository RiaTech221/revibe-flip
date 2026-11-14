package com.revibeflip.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.revibeflip.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Entité JPA représentant un utilisateur inscrit (acheteur, vendeur, administrateur).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String firstName;

    @Column(nullable = false, length = 60)
    private String lastName;

    @Column(nullable = false, unique = true, length = 30)
    private String phone; // E.g. +221771234567

    @Column(unique = true, length = 120)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.ROLE_USER;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id")
    private Country country;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @JsonIgnore
    @Column(length = 120)
    private String otpCode;

    @JsonIgnore
    private LocalDateTime otpExpiresAt;

    @JsonIgnore
    @Column(nullable = false)
    @Builder.Default
    private Integer otpAttempts = 0;

    @JsonIgnore
    private LocalDateTime otpLastSentAt;

    @JsonIgnore
    @Column(length = 120)
    private String resetOtpCode;

    @JsonIgnore
    private LocalDateTime resetOtpExpiresAt;

    @JsonIgnore
    @Column(nullable = false)
    @Builder.Default
    private Integer resetOtpAttempts = 0;

    @JsonIgnore
    private LocalDateTime resetOtpLastSentAt;

    @Column(length = 255)
    private String profilePicture;

    @Column(length = 200)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(nullable = false)
    @Builder.Default
    private Double trustScore = 100.0; // Trust score

    @Column(nullable = false)
    @Builder.Default
    private Double rating = 5.0; // Average rating

    @Column(nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isSuspended = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean mustChangePassword = false;

    @JsonIgnore
    @Column(nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @JsonIgnore
    private LocalDateTime lockedUntil;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    // --- UserDetails implementation ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        return phone != null && !phone.isBlank() ? phone : email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !Boolean.TRUE.equals(isSuspended);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(isVerified) && !Boolean.TRUE.equals(isSuspended);
    }
}
