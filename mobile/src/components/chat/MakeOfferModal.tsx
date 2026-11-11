import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Tag } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface MakeOfferModalProps {
  visible: boolean;
  onClose: () => void;
  priceInput: string;
  onChangePrice: (text: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  visible,
  onClose,
  priceInput,
  onChangePrice,
  onSubmit,
  loading = false,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Tag size={20} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Proposer un prix</Text>
          </View>

          <Text style={styles.modalSub}>
            Le vendeur pourra accepter ou refuser votre offre. En cas d'accord, votre paiement restera sécurisé sous séquestre.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 12000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={priceInput}
              onChangeText={onChangePrice}
              autoFocus
            />
            <Text style={styles.currencyBadge}>FCFA</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.submitBtn, (!priceInput.trim() || loading) && styles.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={!priceInput.trim() || loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Envoi...' : 'Envoyer l’offre'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currencyBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: colors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default MakeOfferModal;
