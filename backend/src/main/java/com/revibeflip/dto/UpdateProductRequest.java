package com.revibeflip.dto;

import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
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
public class UpdateProductRequest {
    private String title;
    private String description;
    private BigDecimal price;
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
