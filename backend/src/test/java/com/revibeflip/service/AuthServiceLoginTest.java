package com.revibeflip.service;

import com.revibeflip.dto.AuthResponse;
import com.revibeflip.dto.LoginRequest;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.payment.PaymentGateway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class AuthServiceLoginTest {

    @MockitoBean
    private PaymentGateway paymentGateway;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Dev : connexion admin réussie par téléphone, email (insensible à la casse) et alias 'admin'")
    void testAdminLoginIdentifiersInDevProfile() {
        AuthResponse byPhone = authService.login(new LoginRequest("+221770000000", "Admin1234!"));
        assertNotNull(byPhone.getToken());
        assertEquals(Role.ROLE_ADMIN.name(), byPhone.getUser().getRole());

        AuthResponse byEmail = authService.login(new LoginRequest("Admin@revibeflip.com", "Admin1234!"));
        assertNotNull(byEmail.getToken());
        assertEquals(Role.ROLE_ADMIN.name(), byEmail.getUser().getRole());

        AuthResponse byAlias = authService.login(new LoginRequest("admin", "Admin1234!"));
        assertNotNull(byAlias.getToken());
        assertEquals(Role.ROLE_ADMIN.name(), byAlias.getUser().getRole());
    }

    @Test
    @DisplayName("Dev : connexion admin refusée si le mot de passe est incorrect")
    void testAdminLoginWrongPasswordRejected() {
        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("admin", "MauvaisMotDePasse!")));
    }
}
