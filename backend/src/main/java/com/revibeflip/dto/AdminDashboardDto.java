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
public class AdminDashboardDto {
    private long totalUsers;
    private long totalProducts;
    private long activeProducts;
    private long totalOrders;
    private BigDecimal totalTransactionsAmount;
    private BigDecimal totalCommissions; // 20% commission on completed sales
    private BigDecimal totalValidationFees; // 1% escrow fee
    private long pendingReports;
}
