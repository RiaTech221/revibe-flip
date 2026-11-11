package com.revibeflip.repository;

import com.revibeflip.entity.AdminActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    List<AdminActionLog> findTop20ByOrderByCreatedAtDesc();
    Page<AdminActionLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
