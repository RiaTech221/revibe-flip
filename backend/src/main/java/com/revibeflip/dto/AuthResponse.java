package com.revibeflip.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse encapsulant les données de AuthResponse.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String refreshToken;

    private String tokenType;
    private UserDto user;
}
