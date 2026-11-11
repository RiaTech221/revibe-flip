import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Send, Tag } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface ChatInputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onOpenOfferModal?: () => void;
  canMakeOffer?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  onChangeText,
  onSend,
  onOpenOfferModal,
  canMakeOffer = true,
}) => {
  return (
    <View style={styles.inputContainer}>
      {canMakeOffer && onOpenOfferModal && (
        <TouchableOpacity
          style={styles.offerIconBtn}
          onPress={onOpenOfferModal}
          accessibilityLabel="Faire une offre"
        >
          <Tag size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        placeholder="Écrivez un message..."
        placeholderTextColor={colors.textSecondary}
        value={inputText}
        onChangeText={onChangeText}
        multiline
      />

      <TouchableOpacity
        style={[
          styles.sendBtn,
          !inputText.trim() && styles.sendBtnDisabled,
        ]}
        onPress={onSend}
        disabled={!inputText.trim()}
      >
        <Send size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  offerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
});

export default ChatInputBar;
