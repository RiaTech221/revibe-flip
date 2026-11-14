package com.revibeflip.repository;

import com.revibeflip.entity.Product;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Interface Spring Data JPA pour les annonces du catalogue, recherches et modération.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    java.util.Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true)
    @Query("UPDATE Product p SET p.status = com.revibeflip.entity.enums.ProductStatus.SOLD WHERE p.id = :id AND p.status <> com.revibeflip.entity.enums.ProductStatus.SOLD")
    int markSoldIfNotSold(@Param("id") Long id);

    List<Product> findByStatusOrderByCreatedAtDesc(ProductStatus status);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND (" +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:condition IS NULL OR p.condition = :condition) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:size IS NULL OR LOWER(p.size) = LOWER(:size)) AND " +
           "(:city IS NULL OR LOWER(p.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:countryCode IS NULL OR p.country.code = :countryCode) AND " +
           "(:query IS NULL OR (LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "                    LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "                    LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           ")")
    Page<Product> searchProducts(
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("condition") ProductCondition condition,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("size") String size,
            @Param("city") String city,
            @Param("countryCode") String countryCode,
            Pageable pageable
    );

    long countByStatus(ProductStatus status);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    java.util.List<Product> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> adminSearch(@Param("query") String query);

    @Query("SELECT p FROM Product p WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:sellerId IS NULL OR p.seller.id = :sellerId)")
    Page<Product> adminSearchPage(
            @Param("query") String query,
            @Param("status") ProductStatus status,
            @Param("categoryId") Long categoryId,
            @Param("sellerId") Long sellerId,
            Pageable pageable
    );

    long countBySellerId(Long sellerId);

    long countBySellerIdAndStatus(Long sellerId, ProductStatus status);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND " +
           "(:query IS NULL OR :query = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Product> searchSellerProducts(
            @Param("sellerId") Long sellerId,
            @Param("query") String query,
            @Param("status") ProductStatus status,
            Pageable pageable
    );

    long countBySellerIdAndCreatedAtBetween(Long sellerId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countBySellerIdAndDeactivationReasonIsNotNull(Long sellerId);

    List<Product> findBySellerIdAndDeactivationReasonIsNotNullOrderByUpdatedAtDesc(Long sellerId);

    List<Product> findBySellerIdAndStatusOrderByViewCountAscCreatedAtAsc(Long sellerId, ProductStatus status, Pageable pageable);

    List<Product> findBySellerIdAndStatusOrderByCreatedAtAsc(Long sellerId, ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.status = 'ACTIVE' AND SIZE(p.images) <= 1")
    List<Product> findSingleImageProducts(@Param("sellerId") Long sellerId);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.status = 'ACTIVE' AND p.createdAt <= :cutoff")
    List<Product> findOlderActiveProducts(@Param("sellerId") Long sellerId, @Param("cutoff") java.time.LocalDateTime cutoff);
}
