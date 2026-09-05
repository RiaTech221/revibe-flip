package com.revibeflip.dto;

import com.revibeflip.entity.enums.ProductCondition;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Le titre de l'annonce est obligatoire")
    @Size(max = 150)
    private String title;

    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "100.0", message = "Le prix minimum est de 100 FCFA")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private String brand;

    private String size;

    private String color;

    @NotNull(message = "L'état de l'article est obligatoire")
    private ProductCondition condition;

    @NotNull(message = "La catégorie est obligatoire")
    private Long categoryId;

    private String locationCity; // e.g. Dakar

    private List<String> imageUrls;
}
