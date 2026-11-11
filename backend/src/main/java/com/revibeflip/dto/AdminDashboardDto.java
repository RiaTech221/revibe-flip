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
public class AdminDashboardDto {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;

    private long totalProducts;
    private long activeProducts;
    private long soldProducts;
    private long inactiveProducts;

    private long totalOrders;
    private long totalTransactions;
    private BigDecimal totalTransactionsAmount;
    private BigDecimal totalCommissions; // 20% platform commission on completed sales
    private BigDecimal totalValidationFees; // 1% escrow fee
    private long pendingReports;

    private List<CategoryStatDto> topCategories;
    private List<PaymentDistributionDto> paymentDistributions;
    private List<SalesTrendDto> salesTrends;
}
