package com.revibeflip.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

/**
 * Objet de transfert de données (DTO) pour FooterConfigDto dans l'écosystème ReVibe FliP.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FooterConfigDto {
    private String platformName;
    private String catchphrase;
    private String copyright;
    private String supportEmail;
    private String supportPhone;
    private String supportAddress;
    private String supportHours;
    private String logoDarkBgUrl;
    private String logoLightBgUrl;

    // Social links (key: provider, value: url)
    private Map<String, String> socialLinks;

    // Custom links by column (Help, Legal)
    private List<CmsPageDto> helpPages;
    private List<CmsPageDto> legalPages;
}
