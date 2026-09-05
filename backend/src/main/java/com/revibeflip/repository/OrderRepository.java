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

    @Query("SELECT SUM(o.platformCommission) FROM Order o WHERE o.status = 'COMPLETED'")
    BigDecimal sumTotalCommissions();

    @Query("SELECT SUM(o.validationFee) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal sumTotalValidationFees();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal sumTotalTransactions();

    long countByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Order> searchOrders(@Param("query") String query);
}
