package com.revibeflip.repository;

import com.revibeflip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.phone = :identifier OR u.email = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isSuspended = true")
    long countSuspendedUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isSuspended = false OR u.isSuspended IS NULL")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ROLE_ADMIN' AND (u.isSuspended = false OR u.isSuspended IS NULL)")
    long countActiveAdmins();

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    java.util.List<User> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT u FROM User u WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR u.phone LIKE CONCAT('%', :query, '%') " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchUsers(@Param("query") String query);

    @Query("SELECT u FROM User u WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "u.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isSuspended IS NULL OR u.isSuspended = :isSuspended)")
    org.springframework.data.domain.Page<User> searchUsersPage(
            @Param("query") String query,
            @Param("role") com.revibeflip.entity.enums.Role role,
            @Param("isSuspended") Boolean isSuspended,
            org.springframework.data.domain.Pageable pageable
    );
}
