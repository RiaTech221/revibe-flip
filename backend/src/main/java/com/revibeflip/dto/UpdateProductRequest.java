package com.revibeflip.dto;

import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO de requête pour l'opération UpdateProductRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {
    @Size(min = 3, max = 120, message = "Le titre doit contenir entre 3 et 120 caractères.")
    private String title;

    @Size(max = 3000, message = "La description ne peut pas dépasser 3000 caractères.")
    private String description;

    @DecimalMin(value = "100.0", message = "Le prix doit être d'au moins 100 FCFA.")
    @DecimalMax(value = "100000000.0", message = "Le prix dépasse le plafond autorisé.")
    private BigDecimal price;

    @DecimalMin(value = "0.0", message = "Le prix d'origine ne peut pas être négatif.")
    @DecimalMax(value = "100000000.0", message = "Le prix d'origine dépasse le plafond autorisé.")
    private BigDecimal originalPrice;

    private String brand;
    private String size;
    private String color;
    private ProductCondition condition;
    private ProductStatus status;
    private Long categoryId;
    private String locationCity;
    private List<String> imageUrls;
}
