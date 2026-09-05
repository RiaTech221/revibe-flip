package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.dto.CreateProductRequest;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.UpdateProductRequest;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Annonces & Marketplace", description = "Recherche, catalogue, publication et gestion des articles")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Rechercher et filtrer les articles du catalogue")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ProductCondition condition,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String countryCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Page<ProductDto> results = productService.searchProducts(
                query, categoryId, condition, minPrice, maxPrice, size, city, countryCode, page, limit, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le détail d'un article")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @PostMapping
    @Operation(summary = "Publier une nouvelle annonce")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal User user
    ) {
        ProductDto created = productService.createProduct(request, user);
        return ResponseEntity.ok(ApiResponse.ok(created, "Annonce publiée avec succès !"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une annonce existante")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long id,
            @RequestBody UpdateProductRequest request,
            @AuthenticationPrincipal User user
    ) {
        ProductDto updated = productService.updateProduct(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Annonce mise à jour avec succès."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une annonce")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        productService.deleteProduct(id, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Annonce supprimée avec succès."));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Lister les annonces d'un vendeur")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getSellerProducts(@PathVariable Long sellerId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getSellerProducts(sellerId)));
    }
}
