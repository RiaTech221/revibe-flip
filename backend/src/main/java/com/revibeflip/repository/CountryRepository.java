package com.revibeflip.repository;

import com.revibeflip.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface Spring Data JPA pour les pays africains et devises.
 */
@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByCode(String code);
    List<Country> findByActiveTrueOrderByNameAsc();
}
