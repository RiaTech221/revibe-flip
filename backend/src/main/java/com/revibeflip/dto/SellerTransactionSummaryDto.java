package com.revibeflip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Objet de transfert de données (DTO) pour SellerTransactionSummaryDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerTransactionSummaryDto {
    private BigDecimal totalGrossSales; // CA total brut des articles vendus
    private BigDecimal totalCommissionPaid; // Total des commissions 20%
    private BigDecimal totalNetPaid; // Total net déjà versé / libéré au vendeur
    private BigDecimal pendingEscrow; // Total net actuellement sous séquestre
    private long totalTransactionsCount;
    private long lockedTransactionsCount;
    private long releasedTransactionsCount;
}
