package com.revibeflip.repository;

import com.revibeflip.entity.FaqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqItemRepository extends JpaRepository<FaqItem, Long> {

    List<FaqItem> findByIsPublishedTrueOrderBySortOrderAscIdAsc();

    List<FaqItem> findAllByOrderBySortOrderAscIdAsc();

    List<FaqItem> findByCategoryAndIsPublishedTrueOrderBySortOrderAscIdAsc(String category);
}
