package com.revibeflip.service;

import com.revibeflip.entity.Payment;
import com.revibeflip.entity.enums.PaymentStatus;
import com.revibeflip.payment.PaymentGateway;
import com.revibeflip.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Tâches planifiées de vérification des paiements en attente (IPN tardif/perdu)
 * et de réconciliation quotidienne du grand livre.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentReconciliationScheduler {

    private final PaymentRepository paymentRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentService paymentService;
    private final LedgerService ledgerService;

    /**
     * Interroge PayTech toutes les 5 minutes pour les paiements INITIATED depuis plus de 5 minutes.
     */
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void pollStalePendingPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);
        List<Payment> pendingPayments = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.INITIATED, threshold);
        for (Payment payment : pendingPayments) {
            if (payment.getPaytechToken() == null || payment.getPaytechToken().isBlank()) {
                continue;
            }
            try {
                PaymentGateway.PaymentStatusResult result = paymentGateway.getPaymentStatus(payment.getPaytechToken());
                if (result.found() && result.status() != null) {
                    String st = result.status().toLowerCase();
                    if ("complete".equals(st) || "completed".equals(st) || "paid".equals(st) || "success".equals(st)) {
                        if (result.amount() == null || result.amount().compareTo(payment.getOrder().getTotalAmount()) == 0) {
                            paymentService.finalizePaidOrder(payment.getOrder(), payment, payment.getPaytechToken());
                        }
                    } else if ("canceled".equals(st) || "cancelled".equals(st) || "failed".equals(st) || "expired".equals(st)) {
                        payment.setStatus(PaymentStatus.FAILED);
                        paymentRepository.save(payment);
                    }
                }
            } catch (Exception e) {
                log.warn("Échec de vérification différée PayTech pour commande {}: {}",
                        payment.getOrder().getOrderNumber(), e.getMessage());
            }
        }
    }

    /**
     * Réconciliation quotidienne à 02h00 comparant les paiements réussis au grand livre immuable.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional(readOnly = true)
    public void dailyLedgerReconciliation() {
        List<Payment> successfulPayments = paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS || p.getStatus() == PaymentStatus.REFUNDED)
                .toList();

        BigDecimal paymentsTotal = successfulPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> balances = ledgerService.getBalancesFromLedger();
        BigDecimal ledgerReceived = balances.getOrDefault("totalReceived", BigDecimal.ZERO);

        if (paymentsTotal.compareTo(ledgerReceived) != 0) {
            log.error("ALERTE RÉCONCILIATION : écart détecté entre paiements ({} XOF) et grand livre ({} XOF).",
                    paymentsTotal, ledgerReceived);
        } else {
            log.info("Réconciliation quotidienne OK : {} XOF alignés entre paiements et grand livre.", paymentsTotal);
        }
    }
}
