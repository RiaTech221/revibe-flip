package com.revibeflip.dto;

import com.revibeflip.entity.CartItem;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long id;
    private Long productId;
    private String title;
    private BigDecimal price;
    private String imageUrl;
    private Long sellerId;
    private String sellerName;
    private String status;
    private boolean isAvailable;

    public static CartItemDto fromEntity(CartItem cartItem, boolean lockedInAnotherOrder) {
        if (cartItem == null) return null;
        Product p = cartItem.getProduct();
        String img = (p.getImages() != null && !p.getImages().isEmpty())
                ? p.getImages().get(0).getImageUrl()
                : null;

        boolean available = ProductStatus.ACTIVE.equals(p.getStatus()) && !lockedInAnotherOrder;

        return CartItemDto.builder()
                .id(cartItem.getId())
                .productId(p.getId())
                .title(p.getTitle())
                .price(p.getPrice())
                .imageUrl(img)
                .sellerId(p.getSeller() != null ? p.getSeller().getId() : null)
                .sellerName(p.getSeller() != null ? p.getSeller().getFullName() : null)
                .status(p.getStatus() != null ? p.getStatus().name() : "INACTIVE")
                .isAvailable(available)
                .build();
    }
}
