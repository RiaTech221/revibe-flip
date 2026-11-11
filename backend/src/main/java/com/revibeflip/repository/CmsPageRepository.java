package com.revibeflip.repository;

import com.revibeflip.entity.CmsPage;
import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Interface Spring Data JPA pour les pages éditoriales CMS.
 */
@Repository
public interface CmsPageRepository extends JpaRepository<CmsPage, Long> {

    Optional<CmsPage> findBySlug(String slug);

    Optional<CmsPage> findBySlugAndStatus(String slug, PageStatus status);

    boolean existsBySlug(String slug);

    List<CmsPage> findByStatusOrderBySortOrderAscTitleAsc(PageStatus status);

    List<CmsPage> findByShowInFooterTrueAndStatusOrderBySortOrderAscTitleAsc(PageStatus status);

    List<CmsPage> findByShowInFooterTrueAndStatusAndFooterColumnOrderBySortOrderAscTitleAsc(PageStatus status, FooterColumn footerColumn);

    Page<CmsPage> findByTitleContainingIgnoreCaseOrSlugContainingIgnoreCase(String title, String slug, Pageable pageable);

    Page<CmsPage> findByStatusAndTitleContainingIgnoreCase(PageStatus status, String title, Pageable pageable);
}
