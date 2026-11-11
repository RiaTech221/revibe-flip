package com.revibeflip.dto;

import com.revibeflip.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private Long id;
    private String title;
    private String recipientName;
    private String phone;
    private String city;
    private String addressLine;
    private Boolean isDefault;
    private LocalDateTime createdAt;

    public static AddressDto fromEntity(Address address) {
        if (address == null) return null;
        return AddressDto.builder()
                .id(address.getId())
                .title(address.getTitle())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .city(address.getCity())
                .addressLine(address.getAddressLine())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
