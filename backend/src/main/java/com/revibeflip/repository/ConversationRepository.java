package com.revibeflip.repository;

import com.revibeflip.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE c.buyer.id = :userId OR c.seller.id = :userId ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findByUser(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE c.product.id = :productId AND ((c.buyer.id = :u1 AND c.seller.id = :u2) OR (c.buyer.id = :u2 AND c.seller.id = :u1))")
    Optional<Conversation> findByProductAndUsers(@Param("productId") Long productId, @Param("u1") Long u1, @Param("u2") Long u2);
}
