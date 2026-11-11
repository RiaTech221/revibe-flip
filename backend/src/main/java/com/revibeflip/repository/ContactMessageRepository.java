package com.revibeflip.repository;

import com.revibeflip.entity.ContactMessage;
import com.revibeflip.entity.enums.ContactMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Interface Spring Data JPA pour les messages du formulaire de contact.
 */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    long countByIpAddressAndCreatedAtAfter(String ipAddress, LocalDateTime after);

    Page<ContactMessage> findByStatusOrderByCreatedAtDesc(ContactMessageStatus status, Pageable pageable);

    Page<ContactMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(ContactMessageStatus status);
}
