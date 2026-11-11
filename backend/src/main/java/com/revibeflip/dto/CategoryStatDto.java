package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStatDto {
    private String name;
    private long productCount;
    private long orderCount;
    private java.math.BigDecimal totalAmount;
    private int percentage;

    public java.math.BigDecimal getTotalSales() {
        return totalAmount != null ? totalAmount : java.math.BigDecimal.ZERO;
    }
}
