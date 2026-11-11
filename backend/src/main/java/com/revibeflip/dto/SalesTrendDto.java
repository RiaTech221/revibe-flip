package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesTrendDto {
    private String label; // e.g. "Lun", "Mar", or "08 Nov"
    private BigDecimal amount;
    private long orderCount;
}
