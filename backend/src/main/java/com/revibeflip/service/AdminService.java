package com.revibeflip.service;

import com.revibeflip.dto.AdminDashboardDto;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.UserDto;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.ReportStatus;
import com.revibeflip.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReportRepository reportRepository;
    private final CategoryRepository categoryRepository;

    public AdminDashboardDto getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByStatus(ProductStatus.ACTIVE);
        long totalOrders = orderRepository.count();
        BigDecimal totalTransactions = orderRepository.sumTotalTransactions();
        BigDecimal totalCommissions = orderRepository.sumTotalCommissions();
        BigDecimal totalValidationFees = orderRepository.sumTotalValidationFees();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .totalOrders(totalOrders)
                .totalTransactionsAmount(totalTransactions != null ? totalTransactions : BigDecimal.ZERO)
                .totalCommissions(totalCommissions != null ? totalCommissions : BigDecimal.ZERO)
                .totalValidationFees(totalValidationFees != null ? totalValidationFees : BigDecimal.ZERO)
                .pendingReports(pendingReports)
                .build();
    }

    public List<UserDto> searchUsers(String query) {
        List<User> users = (query != null && !query.isBlank())
                ? userRepository.searchUsers(query.trim())
                : userRepository.findAll();
        return users.stream().map(UserDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public UserDto toggleUserSuspension(Long userId, boolean suspend) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
        user.setIsSuspended(suspend);
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    public List<ProductDto> adminSearchProducts(String query) {
        List<Product> products = (query != null && !query.isBlank())
                ? productRepository.adminSearch(query.trim())
                : productRepository.findAll();
        return products.stream().map(ProductDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public ProductDto setProductStatus(Long productId, ProductStatus status) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));
        product.setStatus(status);
        Product saved = productRepository.save(product);
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public Category createCategory(String name, String slug, String icon, String description) {
        Category category = Category.builder()
                .name(name)
                .slug(slug)
                .icon(icon)
                .description(description)
                .displayOrder(0)
                .active(true)
                .build();
        return categoryRepository.save(category);
    }
}
