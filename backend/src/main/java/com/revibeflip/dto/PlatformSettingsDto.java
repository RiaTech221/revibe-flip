package com.revibeflip.dto;

import com.revibeflip.entity.PlatformSetting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Objet de transfert de données (DTO) pour PlatformSettingsDto dans l'écosystème ReVibe FliP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSettingsDto {
    private Long id;
    private BigDecimal commissionRate; // 20.0
    private BigDecimal validationFeeRate; // 1.0
    private String platformName;
    private String supportEmail;
    private String supportPhone;
    private String currency;
    private Integer offerValidityHours;
    private Integer reservationDurationHours;
    private Boolean demoMode;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public static PlatformSettingsDto fromEntity(PlatformSetting setting) {
        if (setting == null) return null;
        return PlatformSettingsDto.builder()
                .id(setting.getId())
                .commissionRate(setting.getCommissionRate())
                .validationFeeRate(setting.getValidationFeeRate())
                .platformName(setting.getPlatformName())
                .supportEmail(setting.getSupportEmail())
                .supportPhone(setting.getSupportPhone())
                .currency(setting.getCurrency())
                .offerValidityHours(setting.getOfferValidityHours() != null ? setting.getOfferValidityHours() : 24)
                .reservationDurationHours(setting.getReservationDurationHours() != null ? setting.getReservationDurationHours() : 24)
                .demoMode(setting.getDemoMode() != null ? setting.getDemoMode() : true)
                .updatedBy(setting.getUpdatedBy() != null ? setting.getUpdatedBy().getFullName() : "Admin Système")
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
