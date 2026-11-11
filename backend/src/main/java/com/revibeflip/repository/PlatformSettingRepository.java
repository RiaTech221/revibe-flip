package com.revibeflip.repository;

import com.revibeflip.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Interface Spring Data JPA pour les paramètres globaux (commission, frais de validation).
 */
@Repository
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, Long> {
    Optional<PlatformSetting> findFirstByOrderByIdAsc();
}
