package com.revibeflip.service;

import com.revibeflip.dto.*;
import com.revibeflip.entity.PlatformSetting;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentSettingService {

    private final PlatformSettingRepository platformSettingRepository;
    private final CmsPageService cmsPageService;

    @Transactional(readOnly = true)
    public FooterConfigDto getFooterConfig() {
        PlatformSetting s = getOrCreateSettings();

        Map<String, String> socials = new LinkedHashMap<>();
        if (s.getSocialInstagram() != null && !s.getSocialInstagram().isBlank()) socials.put("instagram", s.getSocialInstagram());
        if (s.getSocialFacebook() != null && !s.getSocialFacebook().isBlank()) socials.put("facebook", s.getSocialFacebook());
        if (s.getSocialTiktok() != null && !s.getSocialTiktok().isBlank()) socials.put("tiktok", s.getSocialTiktok());
        if (s.getSocialWhatsapp() != null && !s.getSocialWhatsapp().isBlank()) socials.put("whatsapp", s.getSocialWhatsapp());
        if (s.getSocialX() != null && !s.getSocialX().isBlank()) socials.put("x", s.getSocialX());
        if (s.getSocialYoutube() != null && !s.getSocialYoutube().isBlank()) socials.put("youtube", s.getSocialYoutube());
        if (s.getSocialLinkedin() != null && !s.getSocialLinkedin().isBlank()) socials.put("linkedin", s.getSocialLinkedin());

        return FooterConfigDto.builder()
                .platformName(s.getPlatformName())
                .catchphrase(s.getFooterCatchphrase())
                .copyright(s.getFooterCopyright())
                .supportEmail(s.getSupportEmail())
                .supportPhone(s.getSupportPhone())
                .supportAddress(s.getSupportAddress())
                .supportHours(s.getSupportHours())
                .demoMode(s.getDemoMode())
                .logoDarkBgUrl(s.getLogoDarkBgUrl())
                .logoLightBgUrl(s.getLogoLightBgUrl())
                .socialLinks(socials)
                .helpPages(cmsPageService.getPublishedPagesForFooter(FooterColumn.HELP))
                .legalPages(cmsPageService.getPublishedPagesForFooter(FooterColumn.LEGAL))
                .build();
    }

    @Transactional
    public FooterConfigDto adminUpdateFooterConfig(UpdateFooterConfigRequest request, User admin) {
        PlatformSetting s = getOrCreateSettings();

        if (request.getCatchphrase() != null) s.setFooterCatchphrase(request.getCatchphrase().trim());
        if (request.getCopyright() != null) s.setFooterCopyright(request.getCopyright().trim());
        if (request.getSupportEmail() != null) s.setSupportEmail(request.getSupportEmail().trim());
        if (request.getSupportPhone() != null) s.setSupportPhone(request.getSupportPhone().trim());
        if (request.getSupportAddress() != null) s.setSupportAddress(request.getSupportAddress().trim());
        if (request.getSupportHours() != null) s.setSupportHours(request.getSupportHours().trim());
        if (request.getDemoMode() != null) s.setDemoMode(request.getDemoMode());
        if (request.getLogoDarkBgUrl() != null) s.setLogoDarkBgUrl(request.getLogoDarkBgUrl().trim());
        if (request.getLogoLightBgUrl() != null) s.setLogoLightBgUrl(request.getLogoLightBgUrl().trim());

        if (request.getSocialLinks() != null) {
            Map<String, String> m = request.getSocialLinks();
            s.setSocialInstagram(m.get("instagram"));
            s.setSocialFacebook(m.get("facebook"));
            s.setSocialTiktok(m.get("tiktok"));
            s.setSocialWhatsapp(m.get("whatsapp"));
            s.setSocialX(m.get("x"));
            s.setSocialYoutube(m.get("youtube"));
            s.setSocialLinkedin(m.get("linkedin"));
        }

        s.setUpdatedBy(admin);
        s.setUpdatedAt(LocalDateTime.now());
        platformSettingRepository.save(s);

        return getFooterConfig();
    }

    @Transactional(readOnly = true)
    public AnnouncementBannerDto getAnnouncementBanner() {
        PlatformSetting s = getOrCreateSettings();
        boolean isActive = Boolean.TRUE.equals(s.getAnnouncementEnabled());
        LocalDateTime now = LocalDateTime.now();

        if (isActive && s.getAnnouncementStartDate() != null && now.isBefore(s.getAnnouncementStartDate())) {
            isActive = false;
        }
        if (isActive && s.getAnnouncementEndDate() != null && now.isAfter(s.getAnnouncementEndDate())) {
            isActive = false;
        }

        return AnnouncementBannerDto.builder()
                .enabled(s.getAnnouncementEnabled())
                .message(s.getAnnouncementMessage())
                .link(s.getAnnouncementLink())
                .startDate(s.getAnnouncementStartDate())
                .endDate(s.getAnnouncementEndDate())
                .isCurrentlyActive(isActive)
                .build();
    }

    @Transactional
    public AnnouncementBannerDto adminUpdateAnnouncement(UpdateAnnouncementRequest request, User admin) {
        PlatformSetting s = getOrCreateSettings();
        if (request.getEnabled() != null) s.setAnnouncementEnabled(request.getEnabled());
        if (request.getMessage() != null) s.setAnnouncementMessage(request.getMessage().trim());
        s.setAnnouncementLink(request.getLink() != null ? request.getLink().trim() : null);
        s.setAnnouncementStartDate(request.getStartDate());
        s.setAnnouncementEndDate(request.getEndDate());
        s.setUpdatedBy(admin);
        s.setUpdatedAt(LocalDateTime.now());
        platformSettingRepository.save(s);

        return getAnnouncementBanner();
    }

    private PlatformSetting getOrCreateSettings() {
        return platformSettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> platformSettingRepository.save(PlatformSetting.builder().build()));
    }
}
