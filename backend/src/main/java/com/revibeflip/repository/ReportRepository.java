package com.revibeflip.repository;

import com.revibeflip.entity.Report;
import com.revibeflip.entity.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);
    long countByStatus(ReportStatus status);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByStatusAndCreatedAtBetween(ReportStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);
    java.util.List<Report> findTop5ByOrderByCreatedAtDesc();
    List<Report> findAllByOrderByCreatedAtDesc();
    org.springframework.data.domain.Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Report> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}
