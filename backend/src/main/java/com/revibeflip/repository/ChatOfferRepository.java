package com.revibeflip.repository;

import com.revibeflip.entity.ChatOffer;
import com.revibeflip.entity.enums.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatOfferRepository extends JpaRepository<ChatOffer, Long> {

    List<ChatOffer> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    Optional<ChatOffer> findFirstByConversationIdAndStatusOrderByCreatedAtDesc(Long conversationId, OfferStatus status);

    List<ChatOffer> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, OfferStatus status);

    List<ChatOffer> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<ChatOffer> findByBuyerIdAndStatusOrderByCreatedAtDesc(Long buyerId, OfferStatus status);

    List<ChatOffer> findByStatusAndExpiresAtBefore(OfferStatus status, LocalDateTime now);

    boolean existsByProductIdAndStatus(Long productId, OfferStatus status);

    Optional<ChatOffer> findByOrderId(Long orderId);

    @Query("SELECT o FROM ChatOffer o WHERE o.status = 'OFFER_SENT' AND o.expiresAt BETWEEN :now AND :soon")
    List<ChatOffer> findOffersExpiringSoon(@Param("now") LocalDateTime now, @Param("soon") LocalDateTime soon);
}
