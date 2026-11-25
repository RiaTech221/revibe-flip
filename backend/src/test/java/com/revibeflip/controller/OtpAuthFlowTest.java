package com.revibeflip.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.AccountStatus;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.UserRepository;
import com.revibeflip.sms.SmsProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration US-01 & US-02 :
 * - Inscription par numéro seul (statut PENDING_OTP) + envoi OTP SMS
 * - Refus d'un numéro déjà inscrit (409 Conflict)
 * - Validation OTP valide -> passage à ACTIVE + JWT
 * - Refus code erroné / expiré (400) et blocage après 3 échecs (429)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class OtpAuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private SmsProvider smsProvider;

    @MockitoBean
    private PaymentGateway paymentGateway;

    @Test
    @DisplayName("US-01 & US-02 : Inscription par numéro seul -> PENDING_OTP, doublon 409, OTP valide -> ACTIVE")
    void registerPhoneOnly_duplicate409_andValidOtp() throws Exception {
        String phone = "+221779990001";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        User created = userRepository.findByPhone(phone).orElseThrow();
        assertThat(created.getStatus()).isEqualTo(AccountStatus.PENDING_OTP);
        assertThat(created.getIsVerified()).isFalse();

        ArgumentCaptor<String> smsCaptor = ArgumentCaptor.forClass(String.class);
        verify(smsProvider, atLeastOnce()).sendSms(eq(phone), smsCaptor.capture());
        Matcher matcher = Pattern.compile("(\\d{6})").matcher(smsCaptor.getValue());
        assertThat(matcher.find()).isTrue();
        String otpCode = matcher.group(1);

        // Doublon -> 409 Conflict
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone))))
                .andExpect(status().isConflict());

        // Validation OTP valide -> 200 + ACTIVE + JWT
        var verifyResult = mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "otpCode", otpCode))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        String jwtToken = objectMapper.readTree(verifyResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        User verified = userRepository.findByPhone(phone).orElseThrow();
        assertThat(verified.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(verified.getIsVerified()).isTrue();

        // Option B : Création du mot de passe après OTP -> puis connexion via /api/auth/login
        mockMvc.perform(post("/api/auth/set-password")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("password", "Pass1234!"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("identifier", phone, "password", "Pass1234!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("US-02 : Code OTP erroné -> 400 puis blocage 429 après 3 échecs")
    void verifyOtp_blocksWith429After3Failures() throws Exception {
        String phone = "+221779990002";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone))))
                .andExpect(status().isOk());

        // 1er échec -> 400
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "otpCode", "000000"))))
                .andExpect(status().isBadRequest());

        // 2e échec -> 400
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "otpCode", "000000"))))
                .andExpect(status().isBadRequest());

        // 3e échec -> 429 Too Many Requests
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "otpCode", "000000"))))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("US-02 : Code OTP expiré -> 400 Bad Request")
    void verifyOtp_expiredReturns400() throws Exception {
        String phone = "+221779990003";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone))))
                .andExpect(status().isOk());

        User user = userRepository.findByPhone(phone).orElseThrow();
        user.setOtpExpiresAt(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "otpCode", "123456"))))
                .andExpect(status().isBadRequest());
    }
}
