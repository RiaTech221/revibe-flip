package com.revibeflip.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    @NotNull(message = "L'ID de l'article est requis")
    private Long productId;

    @Builder.Default
    private Boolean forceReplaceSeller = false;
}
