package com.revibeflip.repository;

import com.revibeflip.entity.LedgerEntry;
import com.revibeflip.entity.enums.LedgerEntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Dépôt JPA en lecture/ajout uniquement pour le grand livre immuable des fonds.
 */
@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    List<LedgerEntry> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    boolean existsByOrderIdAndEntryType(Long orderId, LedgerEntryType entryType);

    Page<LedgerEntry> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<LedgerEntry> findAllByOrderByCreatedAtDesc();

    List<LedgerEntry> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM LedgerEntry l WHERE l.entryType = :type")
    BigDecimal sumAmountByType(@Param("type") LedgerEntryType type);
}
