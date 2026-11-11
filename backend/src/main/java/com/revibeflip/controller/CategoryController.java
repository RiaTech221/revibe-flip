package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.entity.Category;
import com.revibeflip.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Contrôleur REST du catalogue de catégories et rayons.
 * Expose les catégories disponibles et permet l'administration des rayons de seconde main.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Catégories", description = "Catégories d'articles de seconde main")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Lister les catégories actives")
    public ResponseEntity<ApiResponse<List<Category>>> getActiveCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepository.findByActiveTrueOrderByDisplayOrderAsc()));
    }
}
