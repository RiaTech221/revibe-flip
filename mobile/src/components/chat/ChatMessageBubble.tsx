/**
 * Bulle de Message du Chat ReVibe FliP Mobile
 * 
 * Composant d'affichage d'un message individuel avec alignement différencié (expéditeur / destinataire) et horodatage.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types';
import { colors } from '../../theme/colors';

interface ChatMessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isMyMessage }) => {
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
        <Text style={[styles.bubbleText, isMyMessage ? styles.myBubbleText : styles.otherBubbleText]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </Text>
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
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    marginHorizontal: 4,
  },
});

export default ChatMessageBubble;
