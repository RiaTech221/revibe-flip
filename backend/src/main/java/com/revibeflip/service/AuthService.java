package com.revibeflip.service;

import com.revibeflip.dto.AuthResponse;
import com.revibeflip.dto.LoginRequest;
import com.revibeflip.dto.RegisterRequest;
import com.revibeflip.dto.UserDto;
import com.revibeflip.dto.VerifyOtpRequest;
import com.revibeflip.entity.Country;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CountryRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    private final Random random = new Random();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanPhone = cleanPhoneNumber(request.getPhone());

        if (userRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Ce numéro de téléphone est déjà utilisé.");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
                throw new IllegalArgumentException("Cette adresse email est déjà utilisée.");
            }
        }

        String countryCode = request.getCountryCode() != null && !request.getCountryCode().isBlank()
                ? request.getCountryCode().toUpperCase()
                : "SN";

        Country country = countryRepository.findByCode(countryCode)
                .orElseGet(() -> countryRepository.findByCode("SN").orElse(null));

        String otp = String.format("%06d", 100000 + random.nextInt(900000));

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(cleanPhone)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim().toLowerCase() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .country(country)
                .isVerified(false)
                .otpCode(otp)
                .otpExpiresAt(LocalDateTime.now().plusMinutes(15))
                .city(country != null && "SN".equalsIgnoreCase(country.getCode()) ? "Dakar" : "")
                .trustScore(100.0)
                .rating(5.0)
                .reviewCount(0)
                .isSuspended(false)
                .build();

        User savedUser = userRepository.save(user);

        log.info("Code OTP généré pour {}: {}", savedUser.getPhone(), otp);

        return AuthResponse.builder()
                .token(null) // Token provided after OTP validation
                .tokenType("Bearer")
                .user(UserDto.fromEntity(savedUser))
                .otpDemoCode(otp) // Displayed in development/demo for testing convenience
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String cleanPhone = cleanPhoneNumber(request.getPhone());

        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec ce numéro de téléphone."));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode().trim())) {
            throw new IllegalArgumentException("Code OTP invalide.");
        }

        if (user.getOtpExpiresAt() != null && user.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Le code OTP a expiré. Veuillez en demander un nouveau.");
        }

        user.setIsVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        User verifiedUser = userRepository.save(user);

        notificationService.createNotification(
                verifiedUser,
                "Bienvenue sur ReVibe FliP !",
                "Votre compte a été validé avec succès. Découvrez nos articles ou publiez votre première annonce.",
                NotificationType.OTP,
                "/catalog"
        );

        String token = jwtUtil.generateToken(verifiedUser, verifiedUser.getId(), verifiedUser.getRole().name(), verifiedUser.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(verifiedUser))
                .build();
    }

    @Transactional
    public String resendOtp(String phone) {
        String cleanPhone = cleanPhoneNumber(phone);
        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        String newOtp = String.format("%06d", 100000 + random.nextInt(900000));
        user.setOtpCode(newOtp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        log.info("Nouveau code OTP envoyé à {}: {}", cleanPhone, newOtp);
        return newOtp;
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();

        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByIdentifier(cleanPhoneNumber(identifier)))
                .orElseThrow(() -> new BadCredentialsException("Numéro de téléphone ou mot de passe incorrect."));

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            throw new IllegalStateException("Ce compte a été suspendu par l'administration. Veuillez contacter le support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Numéro de téléphone ou mot de passe incorrect.");
        }

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            // Re-generate OTP code so user can complete verification
            String otp = String.format("%06d", 100000 + random.nextInt(900000));
            user.setOtpCode(otp);
            user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            return AuthResponse.builder()
                    .token(null)
                    .user(UserDto.fromEntity(user))
                    .otpDemoCode(otp)
                    .build();
        }

        String token = jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(user))
                .build();
    }

    private String cleanPhoneNumber(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[\\s\\-\\(\\)]", "");
    }
}
