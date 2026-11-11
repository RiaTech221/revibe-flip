package com.revibeflip.dto;

import lombok.*;

import java.util.Map;

/**
 * DTO de requête pour l'opération UpdateFooterConfigRequest.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFooterConfigRequest {
    private String catchphrase;
    private String copyright;
    private String supportEmail;
    private String supportPhone;
    private String supportAddress;
    private String supportHours;
    private Boolean demoMode;
    private String logoDarkBgUrl;
    private String logoLightBgUrl;
    private Map<String, String> socialLinks;
}
