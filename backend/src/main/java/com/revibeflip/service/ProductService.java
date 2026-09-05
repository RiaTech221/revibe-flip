package com.revibeflip.service;

import com.revibeflip.dto.CreateProductRequest;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.UpdateProductRequest;
import com.revibeflip.entity.Category;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.ProductImage;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductDto> searchProducts(
            String query,
            Long categoryId,
            ProductCondition condition,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String size,
            String city,
            String countryCode,
            int page,
            int sizeLimit,
            String sortBy,
            String sortDirection
    ) {
        Sort sort = Sort.by("asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy != null ? sortBy : "createdAt");
        Pageable pageable = PageRequest.of(page, sizeLimit, sort);

        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanSize = (size != null && !size.trim().isEmpty()) ? size.trim() : null;
        String cleanCity = (city != null && !city.trim().isEmpty()) ? city.trim() : null;
        String cleanCountry = (countryCode != null && !countryCode.trim().isEmpty()) ? countryCode.trim() : null;

        Page<Product> productPage = productRepository.searchProducts(
                cleanQuery, categoryId, condition, minPrice, maxPrice, cleanSize, cleanCity, cleanCountry, pageable);

        return productPage.map(ProductDto::fromEntity);
    }

    @Transactional
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé avec l'identifiant " + id));

        // Increment view count
        product.setViewCount(product.getViewCount() + 1);
        productRepository.save(product);

        return ProductDto.fromEntity(product);
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request, User seller) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Catégorie non trouvée."));

        Product product = Product.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .brand(request.getBrand() != null ? request.getBrand().trim() : null)
                .size(request.getSize() != null ? request.getSize().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .condition(request.getCondition())
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .category(category)
                .country(seller.getCountry())
                .locationCity(request.getLocationCity() != null && !request.getLocationCity().isBlank() ?
                        request.getLocationCity().trim() : seller.getCity())
                .viewCount(0)
                .images(new ArrayList<>())
                .build();

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            int order = 0;
            for (String url : request.getImageUrls()) {
                if (url != null && !url.isBlank()) {
                    ProductImage img = ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isPrimary(order == 0)
                            .displayOrder(order++)
                            .build();
                    product.getImages().add(img);
                }
            }
        }

        Product saved = productRepository.save(product);
        return ProductDto.fromEntity(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, UpdateProductRequest request, User user) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (!product.getSeller().getId().equals(user.getId()) && !user.getRole().name().equals("ROLE_ADMIN")) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à modifier cet article.");
        }

        if (request.getTitle() != null) product.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) product.setDescription(request.getDescription().trim());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getOriginalPrice() != null) product.setOriginalPrice(request.getOriginalPrice());
        if (request.getBrand() != null) product.setBrand(request.getBrand().trim());
        if (request.getSize() != null) product.setSize(request.getSize().trim());
        if (request.getColor() != null) product.setColor(request.getColor().trim());
        if (request.getCondition() != null) product.setCondition(request.getCondition());
        if (request.getStatus() != null) product.setStatus(request.getStatus());
        if (request.getLocationCity() != null) product.setLocationCity(request.getLocationCity().trim());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Catégorie non trouvée."));
            product.setCategory(category);
        }

        if (request.getImageUrls() != null) {
            product.getImages().clear();
            int order = 0;
            for (String url : request.getImageUrls()) {
                if (url != null && !url.isBlank()) {
                    ProductImage img = ProductImage.builder()
                            .product(product)
                            .imageUrl(url.trim())
                            .isPrimary(order == 0)
                            .displayOrder(order++)
                            .build();
                    product.getImages().add(img);
                }
            }
        }

        Product updated = productRepository.save(product);
        return ProductDto.fromEntity(updated);
    }

    @Transactional
    public void deleteProduct(Long id, User user) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé."));

        if (!product.getSeller().getId().equals(user.getId()) && !user.getRole().name().equals("ROLE_ADMIN")) {
            throw new org.springframework.security.access.AccessDeniedException("Vous n'êtes pas autorisé à supprimer cet article.");
        }

        productRepository.delete(product);
    }

    public List<ProductDto> getSellerProducts(Long sellerId) {
        return productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }
}
