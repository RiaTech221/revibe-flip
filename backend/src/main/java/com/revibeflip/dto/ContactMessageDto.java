package com.revibeflip.dto;

import com.revibeflip.entity.enums.ContactMessageStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private String ipAddress;
    private ContactMessageStatus status;
    private String adminNotes;
    private String handledByName;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
