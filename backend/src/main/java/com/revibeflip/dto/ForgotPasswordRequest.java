package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Size(max = 30)
    private String phone;
}
