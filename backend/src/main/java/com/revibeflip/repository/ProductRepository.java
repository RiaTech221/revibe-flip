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

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

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

    @Query("SELECT p FROM Product p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> adminSearch(@Param("query") String query);
}
