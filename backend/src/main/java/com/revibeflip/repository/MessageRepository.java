package com.revibeflip.repository;

import com.revibeflip.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Interface Spring Data JPA pour les messages individuels des conversations.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    long countByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long senderId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id IN " +
           "(SELECT c.id FROM Conversation c WHERE c.buyer.id = :userId OR c.seller.id = :userId) " +
           "AND m.sender.id <> :userId AND m.isRead = false")
    long countTotalUnreadForUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT m.conversation.id) FROM Message m WHERE m.conversation.id IN " +
           "(SELECT c.id FROM Conversation c WHERE c.buyer.id = :userId OR c.seller.id = :userId) " +
           "AND m.sender.id <> :userId AND m.isRead = false")
    long countConversationsWithUnreadForUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.sender.id <> :userId")
    void markAsReadForUser(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
