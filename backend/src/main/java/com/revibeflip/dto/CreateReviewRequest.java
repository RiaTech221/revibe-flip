package com.revibeflip.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotNull(message = "L'ID de la commande est obligatoire")
    private Long orderId;

    @NotNull(message = "La note est obligatoire")
    @Min(value = 1, message = "La note minimum est de 1 étoile")
    @Max(value = 5, message = "La note maximum est de 5 étoiles")
    private Integer rating;

    private String comment;
}
