package com.revibeflip.repository;

import com.revibeflip.entity.Order;
import com.revibeflip.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Interface Spring Data JPA pour les commandes d'articles, calculs financiers et statistiques vendeur/admin.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    long countByOrderNumberStartingWith(String prefix);

    void deleteByOrderNumberStartingWith(String prefix);

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Order> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT SUM(o.platformCommission) FROM Order o WHERE o.status = 'COMPLETED'")
    BigDecimal sumTotalCommissions();

    @Query("SELECT SUM(o.validationFee) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal sumTotalValidationFees();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal sumTotalTransactions();

    long countByStatus(OrderStatus status);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    long countByDeliveryStatusAndStatus(com.revibeflip.entity.enums.DeliveryStatus deliveryStatus, OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdAt BETWEEN :start AND :end")
    long countByStatusAndCreatedAtBetween(@Param("status") OrderStatus status, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT o FROM Order o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Order> searchOrders(@Param("query") String query);

    @Query("SELECT o FROM Order o WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.buyer.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.buyer.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.seller.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.seller.lastName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR o.status = :status)")
    org.springframework.data.domain.Page<Order> searchOrdersPage(
            @Param("query") String query,
            @Param("status") OrderStatus status,
            org.springframework.data.domain.Pageable pageable
    );

    long countBySellerId(Long sellerId);

    long countBySellerIdAndStatus(Long sellerId, OrderStatus status);

    @Query("SELECT COUNT(o) > 0 FROM Order o WHERE o.product.id = :productId AND o.status IN :statuses")
    boolean existsByProductIdAndStatusIn(@Param("productId") Long productId, @Param("statuses") java.util.Collection<OrderStatus> statuses);

    @Query("SELECT o FROM Order o WHERE o.buyer.id = :buyerId AND (:status IS NULL OR o.status = :status) ORDER BY o.createdAt DESC")
    org.springframework.data.domain.Page<Order> searchBuyerOrdersPage(
            @Param("buyerId") Long buyerId,
            @Param("status") OrderStatus status,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT o FROM Order o WHERE o.seller.id = :sellerId AND " +
           "(:query IS NULL OR :query = '' OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.buyer.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(o.buyer.lastName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR o.status = :status)")
    org.springframework.data.domain.Page<Order> searchSellerOrdersPage(
            @Param("sellerId") Long sellerId,
            @Param("query") String query,
            @Param("status") OrderStatus status,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.seller.id = :sellerId AND o.status = 'COMPLETED'")
    BigDecimal sumSellerCompletedTurnover(@Param("sellerId") Long sellerId);

    @Query("SELECT SUM(o.platformCommission) FROM Order o WHERE o.seller.id = :sellerId AND o.status = 'COMPLETED'")
    BigDecimal sumSellerCommissionPaid(@Param("sellerId") Long sellerId);

    @Query("SELECT SUM(o.sellerPayout) FROM Order o WHERE o.seller.id = :sellerId AND o.status = 'COMPLETED'")
    BigDecimal sumSellerCompletedPayout(@Param("sellerId") Long sellerId);

    @Query("SELECT SUM(o.sellerPayout) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN ('PAID_ESCROW_LOCKED', 'SHIPPED', 'DELIVERED')")
    BigDecimal sumSellerPendingEscrow(@Param("sellerId") Long sellerId);

    long countBySellerIdAndCreatedAtBetween(Long sellerId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countBySellerIdAndStatusAndCreatedAtBetween(Long sellerId, OrderStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findBySellerIdAndCreatedAtBetween(Long sellerId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Order> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, OrderStatus status, org.springframework.data.domain.Pageable pageable);

    List<Order> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.agreedPrice), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN ('PAID_ESCROW_LOCKED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTED') AND o.createdAt BETWEEN :start AND :end")
    BigDecimal sumSellerPaidTurnoverBetween(@Param("sellerId") Long sellerId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.sellerPayout), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN ('PAID_ESCROW_LOCKED', 'SHIPPED', 'DELIVERED', 'DISPUTED')")
    BigDecimal sumSellerPendingEscrowTotal(@Param("sellerId") Long sellerId);

    @Query("SELECT COALESCE(SUM(o.sellerPayout), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN ('PAID_ESCROW_LOCKED', 'SHIPPED', 'DELIVERED', 'DISPUTED') AND o.createdAt BETWEEN :start AND :end")
    BigDecimal sumSellerPendingEscrowBetween(@Param("sellerId") Long sellerId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.sellerPayout), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status = 'COMPLETED' AND o.updatedAt BETWEEN :start AND :end")
    BigDecimal sumSellerReleasedPayoutBetween(@Param("sellerId") Long sellerId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.platformCommission), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status = 'COMPLETED' AND o.updatedAt BETWEEN :start AND :end")
    BigDecimal sumSellerCommissionPaidBetween(@Param("sellerId") Long sellerId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT o.product.id, o.product.title, COUNT(o), SUM(o.agreedPrice) FROM Order o WHERE o.seller.id = :sellerId AND o.status IN ('PAID_ESCROW_LOCKED', 'SHIPPED', 'DELIVERED', 'COMPLETED') GROUP BY o.product.id, o.product.title ORDER BY SUM(o.agreedPrice) DESC")
    List<Object[]> findSellerTopProducts(@Param("sellerId") Long sellerId, org.springframework.data.domain.Pageable pageable);

    List<Order> findByStatusAndReservationExpiresAtBefore(OrderStatus status, java.time.LocalDateTime now);
}
