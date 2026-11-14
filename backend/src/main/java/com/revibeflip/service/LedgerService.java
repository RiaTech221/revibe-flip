package com.revibeflip.service;

import com.revibeflip.entity.LedgerEntry;
import com.revibeflip.entity.Order;
import com.revibeflip.entity.enums.LedgerEntryType;
import com.revibeflip.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service de gestion du grand livre immuable des fonds (ledger).
 * Toutes les écritures sont en ajout seul et les soldes sont calculés depuis le grand livre.
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional
    public void recordPaymentReceived(Order order, String paymentReference) {
        recordIfAbsent(
                order.getId(),
                order.getOrderNumber(),
                paymentReference,
                LedgerEntryType.PAYMENT_RECEIVED,
                order.getTotalAmount(),
                order.getBuyer() != null ? order.getBuyer().getId() : null,
                "Paiement reçu pour la commande " + order.getOrderNumber()
        );
        if (order.getValidationFee() != null && order.getValidationFee().compareTo(BigDecimal.ZERO) > 0) {
            recordIfAbsent(
                    order.getId(),
                    order.getOrderNumber(),
                    paymentReference,
                    LedgerEntryType.VALIDATION_FEE,
                    order.getValidationFee(),
                    order.getBuyer() != null ? order.getBuyer().getId() : null,
                    "Frais de validation commande " + order.getOrderNumber()
            );
        }
    }

    @Transactional
    public void recordReleaseToSeller(Order order, String paymentReference) {
        if (order.getPlatformCommission() != null && order.getPlatformCommission().compareTo(BigDecimal.ZERO) > 0) {
            recordIfAbsent(
                    order.getId(),
                    order.getOrderNumber(),
                    paymentReference,
                    LedgerEntryType.PLATFORM_COMMISSION,
                    order.getPlatformCommission(),
                    order.getSeller() != null ? order.getSeller().getId() : null,
                    "Commission plateforme commande " + order.getOrderNumber()
            );
        }
        recordIfAbsent(
                order.getId(),
                order.getOrderNumber(),
                paymentReference,
                LedgerEntryType.SELLER_PAYOUT,
                order.getSellerPayout(),
                order.getSeller() != null ? order.getSeller().getId() : null,
                "Versement net vendeur commande " + order.getOrderNumber()
        );
    }

    @Transactional
    public void recordRefund(Order order, String paymentReference, BigDecimal amount) {
        recordIfAbsent(
                order.getId(),
                order.getOrderNumber(),
                paymentReference,
                LedgerEntryType.REFUND,
                amount,
                order.getBuyer() != null ? order.getBuyer().getId() : null,
                "Remboursement commande " + order.getOrderNumber()
        );
    }

    private void recordIfAbsent(
            Long orderId,
            String orderNumber,
            String paymentReference,
            LedgerEntryType type,
            BigDecimal amount,
            Long userId,
            String description
    ) {
        if (ledgerEntryRepository.existsByOrderIdAndEntryType(orderId, type)) {
            return;
        }
        ledgerEntryRepository.save(LedgerEntry.builder()
                .orderId(orderId)
                .orderNumber(orderNumber)
                .paymentReference(paymentReference)
                .entryType(type)
                .amount(amount)
                .currency("XOF")
                .userId(userId)
                .description(description)
                .build());
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getBalancesFromLedger() {
        BigDecimal received = ledgerEntryRepository.sumAmountByType(LedgerEntryType.PAYMENT_RECEIVED);
        BigDecimal validationFees = ledgerEntryRepository.sumAmountByType(LedgerEntryType.VALIDATION_FEE);
        BigDecimal commissions = ledgerEntryRepository.sumAmountByType(LedgerEntryType.PLATFORM_COMMISSION);
        BigDecimal payouts = ledgerEntryRepository.sumAmountByType(LedgerEntryType.SELLER_PAYOUT);
        BigDecimal refunds = ledgerEntryRepository.sumAmountByType(LedgerEntryType.REFUND);
        BigDecimal heldFunds = received.subtract(validationFees).subtract(commissions).subtract(payouts).subtract(refunds);

        Map<String, BigDecimal> balances = new LinkedHashMap<>();
        balances.put("totalReceived", received);
        balances.put("totalValidationFees", validationFees);
        balances.put("totalCommissions", commissions);
        balances.put("totalSellerPayouts", payouts);
        balances.put("totalRefunds", refunds);
        balances.put("currentlyHeldFunds", heldFunds.max(BigDecimal.ZERO));
        return balances;
    }

    @Transactional(readOnly = true)
    public Page<LedgerEntry> getEntries(Pageable pageable) {
        return ledgerEntryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public String exportCsv() {
        List<LedgerEntry> entries = ledgerEntryRepository.findAllByOrderByCreatedAtDesc();
        StringBuilder sb = new StringBuilder("id,order_id,order_number,payment_reference,entry_type,amount,currency,user_id,description,created_at\n");
        for (LedgerEntry entry : entries) {
            sb.append(entry.getId()).append(',')
              .append(entry.getOrderId()).append(',')
              .append(escapeCsv(entry.getOrderNumber())).append(',')
              .append(escapeCsv(entry.getPaymentReference())).append(',')
              .append(entry.getEntryType().name()).append(',')
              .append(entry.getAmount()).append(',')
              .append(escapeCsv(entry.getCurrency())).append(',')
              .append(entry.getUserId() != null ? entry.getUserId() : "").append(',')
              .append(escapeCsv(entry.getDescription())).append(',')
              .append(entry.getCreatedAt()).append('\n');
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        String escaped = val.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
