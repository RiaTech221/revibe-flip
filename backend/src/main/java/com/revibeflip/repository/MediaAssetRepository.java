package com.revibeflip.repository;

import com.revibeflip.entity.MediaAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {

    Optional<MediaAsset> findByFilename(String filename);

    Page<MediaAsset> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
