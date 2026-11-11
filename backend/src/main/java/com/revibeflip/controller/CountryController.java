package com.revibeflip.controller;

import com.revibeflip.dto.ApiResponse;
import com.revibeflip.entity.Country;
import com.revibeflip.repository.CountryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Contrôleur REST des pays africains desservis.
 * Indique les indicatifs téléphoniques (+221, etc.) et devises supportées (FCFA).
 */
@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
@Tag(name = "Pays", description = "Liste des pays africains pour l'inscription et les devises")
public class CountryController {

    private final CountryRepository countryRepository;

    @GetMapping
    @Operation(summary = "Lister les pays africains actifs")
    public ResponseEntity<ApiResponse<List<Country>>> getActiveCountries() {
        return ResponseEntity.ok(ApiResponse.ok(countryRepository.findByActiveTrueOrderByNameAsc()));
    }
}
