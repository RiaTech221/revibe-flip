package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.Country;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.NotificationType;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CountryRepository;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.security.JwtUtil;
import com.revibeflip.sms.OtpRateLimiter;
import com.revibeflip.sms.SmsProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Service métier d'authentification, inscription, validation OTP par SMS et réinitialisation de mot de passe.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int OTP_TTL_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final SmsProvider smsProvider;
    private final OtpRateLimiter otpRateLimiter;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request, String clientIp) {
        String cleanPhone = cleanPhoneNumber(request.getPhone());
        validatePasswordStrength(request.getPassword());

        if (userRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Ce numéro de téléphone est déjà utilisé.");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
                throw new IllegalArgumentException("Cette adresse email est déjà utilisée.");
            }
        }

        otpRateLimiter.checkAndRecordSend(cleanPhone, clientIp);

        String countryCode = request.getCountryCode() != null && !request.getCountryCode().isBlank()
                ? request.getCountryCode().toUpperCase()
                : "SN";

        Country country = countryRepository.findByCode(countryCode)
                .orElseGet(() -> countryRepository.findByCode("SN").orElse(null));

        String rawOtp = generateOtp();

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(cleanPhone)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim().toLowerCase() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .country(country)
                .isVerified(false)
                .otpCode(passwordEncoder.encode(rawOtp))
                .otpExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES))
                .otpAttempts(0)
                .otpLastSentAt(LocalDateTime.now())
                .city(country != null && "SN".equalsIgnoreCase(country.getCode()) ? "Dakar" : "")
                .trustScore(100.0)
                .rating(5.0)
                .reviewCount(0)
                .isSuspended(false)
                .build();

        User savedUser = userRepository.save(user);
        smsProvider.sendSms(cleanPhone, "Votre code de vérification ReVibe FliP est : " + rawOtp + ". Valable 10 minutes.");

        return AuthResponse.builder()
                .token(null)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String cleanPhone = cleanPhoneNumber(request.getPhone());

        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("Code OTP invalide ou expiré."));

        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            throw new IllegalArgumentException("Aucun code OTP actif. Veuillez en demander un nouveau.");
        }

        if (user.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            clearVerificationOtp(user);
            userRepository.save(user);
            throw new IllegalArgumentException("Le code OTP a expiré. Veuillez en demander un nouveau.");
        }

        int attempts = user.getOtpAttempts() != null ? user.getOtpAttempts() : 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            clearVerificationOtp(user);
            userRepository.save(user);
            throw new IllegalArgumentException("Nombre maximal de tentatives atteint. Veuillez demander un nouveau code.");
        }

        String candidate = request.getOtpCode() != null ? request.getOtpCode().trim() : "";
        if (!passwordEncoder.matches(candidate, user.getOtpCode())) {
            user.setOtpAttempts(attempts + 1);
            if (user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
                clearVerificationOtp(user);
            }
            userRepository.save(user);
            throw new IllegalArgumentException("Code OTP invalide ou expiré.");
        }

        user.setIsVerified(true);
        clearVerificationOtp(user);
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

    /**
     * Réponse identique que le numéro existe ou non (anti-énumération).
     */
    @Transactional
    public void resendOtp(String phone, String clientIp) {
        String cleanPhone = cleanPhoneNumber(phone);
        otpRateLimiter.checkAndRecordSend(cleanPhone, clientIp);

        userRepository.findByPhone(cleanPhone).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getIsVerified())) {
                return;
            }
            String rawOtp = generateOtp();
            user.setOtpCode(passwordEncoder.encode(rawOtp));
            user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
            user.setOtpAttempts(0);
            user.setOtpLastSentAt(LocalDateTime.now());
            userRepository.save(user);

            smsProvider.sendSms(cleanPhone, "Votre nouveau code de vérification ReVibe FliP est : " + rawOtp + ". Valable 10 minutes.");
        });
    }

    /**
     * Mot de passe oublié : envoie un OTP à 6 chiffres par SMS, réponse identique que le numéro existe ou non.
     */
    @Transactional
    public void forgotPassword(String phone, String clientIp) {
        String cleanPhone = cleanPhoneNumber(phone);
        otpRateLimiter.checkAndRecordSend(cleanPhone, clientIp);

        userRepository.findByPhone(cleanPhone).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getIsSuspended())) {
                return;
            }
            String rawOtp = generateOtp();
            user.setResetOtpCode(passwordEncoder.encode(rawOtp));
            user.setResetOtpExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
            user.setResetOtpAttempts(0);
            user.setResetOtpLastSentAt(LocalDateTime.now());
            userRepository.save(user);

            smsProvider.sendSms(cleanPhone, "Code de réinitialisation ReVibe FliP : " + rawOtp + ". Valable 10 minutes.");
        });
    }

    /**
     * Réinitialisation du mot de passe via OTP SMS (usage unique, max 5 tentatives, 10 min).
     */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void resetPassword(ResetPasswordRequest request) {
        String cleanPhone = cleanPhoneNumber(request.getPhone());
        validatePasswordStrength(request.getNewPassword());

        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("Code OTP invalide ou expiré."));

        if (user.getResetOtpCode() == null || user.getResetOtpExpiresAt() == null) {
            throw new IllegalArgumentException("Aucune demande de réinitialisation active.");
        }

        if (user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            clearResetOtp(user);
            userRepository.save(user);
            throw new IllegalArgumentException("Le code OTP a expiré. Veuillez en demander un nouveau.");
        }

        int attempts = user.getResetOtpAttempts() != null ? user.getResetOtpAttempts() : 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            clearResetOtp(user);
            userRepository.save(user);
            throw new IllegalArgumentException("Nombre maximal de tentatives atteint. Demandez un nouveau code.");
        }

        String candidate = request.getOtpCode() != null ? request.getOtpCode().trim() : "";
        if (!passwordEncoder.matches(candidate, user.getResetOtpCode())) {
            user.setResetOtpAttempts(attempts + 1);
            if (user.getResetOtpAttempts() >= MAX_OTP_ATTEMPTS) {
                clearResetOtp(user);
            }
            userRepository.save(user);
            throw new IllegalArgumentException("Code OTP invalide ou expiré.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        clearResetOtp(user);
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();

        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByIdentifier(cleanPhoneNumber(identifier)))
                .orElseThrow(() -> new BadCredentialsException("Numéro de téléphone ou mot de passe incorrect."));

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            throw new IllegalStateException("Ce compte a été suspendu par l'administration. Veuillez contacter le support.");
        }

        boolean isMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!isMatch) {
            throw new BadCredentialsException("Numéro de téléphone ou mot de passe incorrect.");
        }

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            String rawOtp = generateOtp();
            user.setOtpCode(passwordEncoder.encode(rawOtp));
            user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
            user.setOtpAttempts(0);
            user.setOtpLastSentAt(LocalDateTime.now());
            userRepository.save(user);

            smsProvider.sendSms(user.getPhone(), "Votre code de vérification ReVibe FliP est : " + rawOtp + ". Valable 10 minutes.");

            return AuthResponse.builder()
                    .token(null)
                    .user(UserDto.fromEntity(user))
                    .build();
        }

        String token = jwtUtil.generateToken(user, user.getId(), user.getRole().name(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(user))
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", 100000 + secureRandom.nextInt(900000));
    }

    private void clearVerificationOtp(User user) {
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        user.setOtpAttempts(0);
    }

    private void clearResetOtp(User user) {
        user.setResetOtpCode(null);
        user.setResetOtpExpiresAt(null);
        user.setResetOtpAttempts(0);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*")) {
            throw new IllegalArgumentException(
                    "Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre."
            );
        }
    }

    private String cleanPhoneNumber(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[\\s\\-\\(\\)]", "");
    }
}
