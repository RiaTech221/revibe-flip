package com.revibeflip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de requête pour l'opération StartConversationRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartConversationRequest {

    private Long productId;

    private java.util.List<Long> productIds;

    private String initialMessage;
}
