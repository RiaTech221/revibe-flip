/**
 * Bulle de Message du Chat ReVibe FliP Mobile
 * 
 * Composant d'affichage d'un message individuel avec alignement différencié (expéditeur / destinataire) et horodatage.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { Message } from '../../types';
import { colors } from '../../theme/colors';

interface ChatMessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isMyMessage }) => {
  const hasProductCard = Boolean(message.productTitle || message.productId);
  const cardImage = message.productImageUrl || message.imageUrl;

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isMyMessage ? styles.myBubbleWrapper : styles.otherBubbleWrapper,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMyMessage ? styles.myBubble : styles.otherBubble,
        ]}
      >
        {hasProductCard && (
          <View style={[styles.productCard, isMyMessage ? styles.myProductCard : styles.otherProductCard]}>
            {cardImage ? (
              <Image source={{ uri: cardImage }} style={styles.productThumb} resizeMode="cover" />
            ) : null}
            <View style={styles.productInfo}>
              <Text style={[styles.productBadge, isMyMessage ? styles.myProductBadge : styles.otherProductBadge]}>
                Article concerné
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.productTitle, isMyMessage ? styles.myBubbleText : styles.otherBubbleText]}
              >
                {message.productTitle || 'Article'}
              </Text>
            </View>
          </View>
        )}
        <Text style={[styles.bubbleText, isMyMessage ? styles.myBubbleText : styles.otherBubbleText]}>
          {message.content}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.timestamp}>
          {(message.sentAt || message.createdAt)
            ? new Date(message.sentAt || message.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </Text>
        {isMyMessage && (
          (message.isRead ?? message.read) ? (
            <CheckCheck size={14} color={colors.primary} />
          ) : (
            <Check size={14} color="#94a3b8" />
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherBubbleWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#ffffff',
  },
  otherBubbleText: {
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginHorizontal: 4,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  myProductCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  otherProductCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productBadge: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  myProductBadge: {
    color: '#e9d5ff',
  },
  otherProductBadge: {
    color: colors.primary,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default ChatMessageBubble;
