package com.revibeflip.repository;

import com.revibeflip.entity.PageVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PageVersionRepository extends JpaRepository<PageVersion, Long> {

    List<PageVersion> findByPageIdOrderByVersionNumberDesc(Long pageId);

    Optional<PageVersion> findByPageIdAndVersionNumber(Long pageId, Integer versionNumber);
}
