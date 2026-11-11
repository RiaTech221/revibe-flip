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

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

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

    List<Order> findByStatusAndReservationExpiresAtBefore(OrderStatus status, java.time.LocalDateTime now);
}
