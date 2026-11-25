package com.revibeflip.repository;

import com.revibeflip.entity.RateLimitEntry;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RateLimitEntryRepository extends JpaRepository<RateLimitEntry, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RateLimitEntry r WHERE r.bucketKey = :bucketKey")
    Optional<RateLimitEntry> findLockedByBucketKey(@Param("bucketKey") String bucketKey);

    Optional<RateLimitEntry> findByBucketKey(String bucketKey);

    @Modifying
    @Query("DELETE FROM RateLimitEntry r WHERE r.updatedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
