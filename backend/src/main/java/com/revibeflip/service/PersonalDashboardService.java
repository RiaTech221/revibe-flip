package com.revibeflip.service;

import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.PageResponseDto;
import com.revibeflip.dto.PersonalDashboardDto;
import com.revibeflip.dto.ProductDto;
import com.revibeflip.dto.ReviewDto;
import com.revibeflip.entity.User;
import com.revibeflip.repository.OrderRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.ReviewRepository;
import com.revibeflip.security.PaginationValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service métier du tableau de bord personnel (US-06).
 * Distingue automatiquement un vendeur (ayant au moins une annonce, une vente ou un avis reçu)
 * d'un simple acheteur afin de n'exposer les données vendeur qu'aux vendeurs.
 */
@Service
@RequiredArgsConstructor
public class PersonalDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public PersonalDashboardDto getPersonalDashboard(
            User user,
            int purchasesPage,
            int salesPage,
            int listingsPage,
            int reviewsPage,
            int size
    ) {
        Long userId = user.getId();

        Pageable purchasesPageable = PaginationValidator.validateAndCreate(
                purchasesPage, size, "createdAt", "desc",
                PaginationValidator.ORDER_SORT_FIELDS, "createdAt", Sort.Direction.DESC
        );
        Page<OrderDto> purchases = orderRepository
                .searchBuyerOrdersPage(userId, null, purchasesPageable)
                .map(OrderDto::fromEntity);

        long listingsCount = productRepository.countBySellerId(userId);
        long salesCount = orderRepository.countBySellerId(userId);
        long reviewCount = reviewRepository.countByTargetUserId(userId);

        boolean isSeller = listingsCount > 0 || salesCount > 0 || reviewCount > 0;

        PersonalDashboardDto.PersonalDashboardDtoBuilder builder = PersonalDashboardDto.builder()
                .isSeller(isSeller)
                .purchasesCount(purchases.getTotalElements())
                .purchases(PageResponseDto.fromPage(purchases));

        if (!isSeller) {
            return builder.build();
        }

        Pageable salesPageable = PaginationValidator.validateAndCreate(
                salesPage, size, "createdAt", "desc",
                PaginationValidator.ORDER_SORT_FIELDS, "createdAt", Sort.Direction.DESC
        );
        Page<OrderDto> sales = orderRepository
                .searchSellerOrdersPage(userId, null, null, salesPageable)
                .map(OrderDto::fromEntity);

        Pageable listingsPageable = PaginationValidator.validateAndCreate(
                listingsPage, size, "createdAt", "desc",
                PaginationValidator.PRODUCT_SORT_FIELDS, "createdAt", Sort.Direction.DESC
        );
        Page<ProductDto> listings = productRepository
                .searchSellerProducts(userId, null, null, listingsPageable)
                .map(ProductDto::fromEntity);

        Pageable reviewsPageable = PaginationValidator.validateAndCreate(
                reviewsPage, size, "createdAt", "desc",
                PaginationValidator.REVIEW_SORT_FIELDS, "createdAt", Sort.Direction.DESC
        );
        Page<ReviewDto> reviews = reviewRepository
                .findByTargetUserIdOrderByCreatedAtDesc(userId, reviewsPageable)
                .map(ReviewDto::fromEntity);

        Double rawAverage = reviewCount > 0 ? reviewRepository.calculateAverageRating(userId) : null;
        double averageRating = rawAverage != null ? Math.round(rawAverage * 10.0) / 10.0 : 0.0;

        return builder
                .salesCount(salesCount)
                .sales(PageResponseDto.fromPage(sales))
                .listingsCount(listingsCount)
                .listings(PageResponseDto.fromPage(listings))
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .reviews(PageResponseDto.fromPage(reviews))
                .build();
    }
}
