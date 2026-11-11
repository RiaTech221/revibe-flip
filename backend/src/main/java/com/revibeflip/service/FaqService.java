package com.revibeflip.service;

import com.revibeflip.dto.FaqItemDto;
import com.revibeflip.dto.FaqItemRequest;
import com.revibeflip.entity.FaqItem;
import com.revibeflip.entity.User;
import com.revibeflip.repository.FaqItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaqService {

    private final FaqItemRepository faqItemRepository;

    @Transactional(readOnly = true)
    public List<FaqItemDto> getPublishedFaqItems() {
        return faqItemRepository.findByIsPublishedTrueOrderBySortOrderAscIdAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FaqItemDto> adminGetAllFaqItems() {
        return faqItemRepository.findAllByOrderBySortOrderAscIdAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public FaqItemDto adminCreateFaqItem(FaqItemRequest request, User admin) {
        FaqItem item = FaqItem.builder()
                .question(request.getQuestion().trim())
                .answer(request.getAnswer().trim())
                .category(request.getCategory() != null && !request.getCategory().isBlank()
                        ? request.getCategory().trim() : "Général")
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toDto(faqItemRepository.save(item));
    }

    @Transactional
    public FaqItemDto adminUpdateFaqItem(Long id, FaqItemRequest request, User admin) {
        FaqItem item = faqItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question FAQ introuvable."));

        item.setQuestion(request.getQuestion().trim());
        item.setAnswer(request.getAnswer().trim());
        if (request.getCategory() != null) item.setCategory(request.getCategory().trim());
        if (request.getSortOrder() != null) item.setSortOrder(request.getSortOrder());
        if (request.getIsPublished() != null) item.setIsPublished(request.getIsPublished());
        item.setUpdatedAt(LocalDateTime.now());

        return toDto(faqItemRepository.save(item));
    }

    @Transactional
    public void adminDeleteFaqItem(Long id, User admin) {
        faqItemRepository.deleteById(id);
    }

    private FaqItemDto toDto(FaqItem f) {
        return FaqItemDto.builder()
                .id(f.getId())
                .question(f.getQuestion())
                .answer(f.getAnswer())
                .category(f.getCategory())
                .sortOrder(f.getSortOrder())
                .isPublished(f.getIsPublished())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
