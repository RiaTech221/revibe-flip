package com.revibeflip.dto;

import com.revibeflip.entity.Product;
import com.revibeflip.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String brand;
    private String size;
    private String color;
    private String condition;
    private String conditionLabel;
    private String status;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private String locationCity;
    private String countryCode;
    private String countryName;
    private String currency;
    private Integer viewCount;
    private UserDto seller;
    private List<String> images;
    private String primaryImage;
    private LocalDateTime createdAt;

    public static ProductDto fromEntity(Product product) {
        if (product == null) return null;

        List<String> imgUrls = product.getImages() != null ?
                product.getImages().stream().map(ProductImage::getImageUrl).collect(Collectors.toList()) :
                Collections.emptyList();

        return ProductDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .brand(product.getBrand())
                .size(product.getSize())
                .color(product.getColor())
                .condition(product.getCondition().name())
                .conditionLabel(product.getCondition().getLabel())
                .status(product.getStatus().name())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .locationCity(product.getLocationCity())
                .countryCode(product.getCountry() != null ? product.getCountry().getCode() : "SN")
                .countryName(product.getCountry() != null ? product.getCountry().getName() : "Sénégal")
                .currency(product.getCountry() != null ? product.getCountry().getCurrency() : "XOF")
                .viewCount(product.getViewCount())
                .seller(UserDto.fromEntity(product.getSeller()))
                .images(imgUrls)
                .primaryImage(product.getPrimaryImageUrl())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
