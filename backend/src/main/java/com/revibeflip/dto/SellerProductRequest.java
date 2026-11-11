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

/**
 * DTO de requête pour l'opération SellerProductRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductRequest {

    @NotBlank(message = "Le titre de l'annonce est obligatoire")
    @Size(min = 3, max = 150, message = "Le titre doit comporter entre 3 et 150 caractères")
    private String title;

    @NotNull(message = "La catégorie est obligatoire")
    private Long categoryId;

    @NotNull(message = "Le prix de l'article est obligatoire")
    @DecimalMin(value = "100.0", message = "Le prix minimum est de 100 FCFA")
    private BigDecimal price;

    private BigDecimal originalPrice;

    @NotNull(message = "L'état de l'article est obligatoire")
    private ProductCondition condition;

    @NotBlank(message = "La description de l'article est obligatoire")
    @Size(min = 10, max = 2500, message = "La description doit comporter au moins 10 caractères")
    private String description;

    private String brand;
    private String size;
    private String color;
    private String defects;
    private String measurements;

    private String locationCity;
    private String countryCode;

    // Photos multiples (obligatoire au moins une pour publier en ACTIVE)
    private List<String> images;

    // true = enregistrer en brouillon (DRAFT), false = publier immédiatement (ACTIVE)
    @Builder.Default
    private Boolean isDraft = false;
}
