package com.revibeflip.service;

import com.revibeflip.dto.ContactMessageDto;
import com.revibeflip.dto.ContactMessageRequest;
import com.revibeflip.dto.UpdateContactMessageStatusRequest;
import com.revibeflip.entity.ContactMessage;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ContactMessageStatus;
import com.revibeflip.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;

    private static final int MAX_MESSAGES_PER_WINDOW = 5;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 10;

    @Transactional
    public ContactMessageDto submitMessage(ContactMessageRequest request, String ipAddress) {
        // Validation anti-spam par IP
        if (ipAddress != null && !ipAddress.isBlank()) {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
            long count = contactMessageRepository.countByIpAddressAndCreatedAtAfter(ipAddress, threshold);
            if (count >= MAX_MESSAGES_PER_WINDOW) {
                log.warn("Tentative de flood de contact détectée depuis l'IP {}", ipAddress);
                throw new IllegalStateException("Vous avez envoyé trop de messages en peu de temps. Veuillez patienter quelques minutes avant de réessayer.");
            }
        }

        // Validation qu'au moins l'email ou le téléphone est renseigné
        boolean hasEmail = request.getEmail() != null && !request.getEmail().isBlank();
        boolean hasPhone = request.getPhone() != null && !request.getPhone().isBlank();
        if (!hasEmail && !hasPhone) {
            throw new IllegalArgumentException("Veuillez fournir au moins une adresse email ou un numéro de téléphone pour que nous puissions vous recontacter.");
        }

        ContactMessage msg = ContactMessage.builder()
                .fullName(request.getFullName().trim())
                .email(hasEmail ? request.getEmail().trim() : null)
                .phone(hasPhone ? request.getPhone().trim() : null)
                .subject(request.getSubject().trim())
                .message(request.getMessage().trim())
                .ipAddress(ipAddress)
                .status(ContactMessageStatus.NEW)
                .createdAt(LocalDateTime.now())
                .build();

        ContactMessage saved = contactMessageRepository.save(msg);
        log.info("Nouveau message de contact #{} reçu de {} ({})", saved.getId(), saved.getFullName(), ipAddress);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<ContactMessageDto> adminGetMessages(ContactMessageStatus status, Pageable pageable) {
        Page<ContactMessage> page = (status != null)
                ? contactMessageRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : contactMessageRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toDto);
    }

    @Transactional
    public ContactMessageDto adminUpdateStatus(Long id, UpdateContactMessageStatusRequest request, User admin) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Message de contact introuvable."));

        msg.setStatus(request.getStatus());
        if (request.getAdminNotes() != null) {
            msg.setAdminNotes(request.getAdminNotes().trim());
        }
        msg.setHandledBy(admin);

        if (ContactMessageStatus.RESOLVED.equals(request.getStatus())) {
            msg.setResolvedAt(LocalDateTime.now());
        }

        return toDto(contactMessageRepository.save(msg));
    }

    private ContactMessageDto toDto(ContactMessage m) {
        return ContactMessageDto.builder()
                .id(m.getId())
                .fullName(m.getFullName())
                .email(m.getEmail())
                .phone(m.getPhone())
                .subject(m.getSubject())
                .message(m.getMessage())
                .ipAddress(m.getIpAddress())
                .status(m.getStatus())
                .adminNotes(m.getAdminNotes())
                .handledByName(m.getHandledBy() != null ? m.getHandledBy().getFullName() : null)
                .createdAt(m.getCreatedAt())
                .resolvedAt(m.getResolvedAt())
                .build();
    }
}
