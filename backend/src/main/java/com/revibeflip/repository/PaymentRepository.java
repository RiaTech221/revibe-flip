package com.revibeflip.repository;

import com.revibeflip.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Interface Spring Data JPA pour les transactions de paiement mobile et le séquestre.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByTransactionReference(String transactionReference);
    Optional<Payment> findByPaytechToken(String paytechToken);
    Optional<Payment> findByPayoutReference(String payoutReference);
    java.util.List<Payment> findByStatusAndCreatedAtBefore(
            com.revibeflip.entity.enums.PaymentStatus status,
            java.time.LocalDateTime before
    );
    java.util.List<Payment> findAllByOrderByCreatedAtDesc();

    long countByStatus(com.revibeflip.entity.enums.PaymentStatus status);

    long countByStatusAndCreatedAtBetween(
            com.revibeflip.entity.enums.PaymentStatus status,
            java.time.LocalDateTime start,
            java.time.LocalDateTime end
    );

    java.util.List<Payment> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    java.util.List<Payment> findByEscrowStatus(com.revibeflip.entity.enums.EscrowStatus escrowStatus);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.order.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.order.buyer.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.order.buyer.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.order.seller.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.order.seller.lastName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:method IS NULL OR p.paymentMethod = :method)")
    org.springframework.data.domain.Page<Payment> searchPaymentsPage(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("method") com.revibeflip.entity.enums.PaymentMethod method,
            org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE p.order.seller.id = :sellerId ORDER BY p.createdAt DESC")
    org.springframework.data.domain.Page<Payment> findBySellerId(
            @org.springframework.data.repository.query.Param("sellerId") Long sellerId,
            org.springframework.data.domain.Pageable pageable
    );
}
