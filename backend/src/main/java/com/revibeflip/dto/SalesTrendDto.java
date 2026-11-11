package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Objet de transfert de données (DTO) pour SalesTrendDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesTrendDto {
    private String date; // e.g. "2026-11-05"
    private String label; // e.g. "05/11"
    private BigDecimal amount;
    private long orderCount;

    public SalesTrendDto(String label, BigDecimal amount, long orderCount) {
        this.date = label;
        this.label = label;
        this.amount = amount;
        this.orderCount = orderCount;
    }
}
