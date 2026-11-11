package com.revibeflip.dto;

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
public class CartDto {
    private Long id;
    private Long sellerId;
    private String sellerName;
    private List<CartItemDto> items;
    private BigDecimal subtotal;
    private BigDecimal validationFee;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private int totalCount;
    private boolean hasUnavailableItems;

    public int getItemCount() {
        return totalCount;
    }
}
