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
    List<Report> findAllByOrderByCreatedAtDesc();
}
