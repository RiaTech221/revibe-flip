package com.revibeflip.dto;

import com.revibeflip.entity.OrderItem;
import com.revibeflip.entity.ProductImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String title;
    private BigDecimal price;
    private String imageUrl;

    public static OrderItemDto fromEntity(OrderItem item) {
        if (item == null) return null;
        String img = item.getImageUrl();
        if (img == null && item.getProduct() != null && item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
            img = item.getProduct().getImages().get(0).getImageUrl();
        }
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .title(item.getTitle())
                .price(item.getPrice())
                .imageUrl(img)
                .build();
    }
}
