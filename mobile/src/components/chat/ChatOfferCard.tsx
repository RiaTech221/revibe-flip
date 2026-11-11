import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tag, Check, X, ShieldCheck } from 'lucide-react-native';
import { ChatOffer } from '../../types';
import { colors, formatPrice } from '../../theme/colors';

interface ChatOfferCardProps {
  offer: ChatOffer;
  isSeller: boolean;
  onAccept: (offerId: number) => void;
  onReject: (offerId: number) => void;
  onPayEscrow: (price: number) => void;
}

export const ChatOfferCard: React.FC<ChatOfferCardProps> = ({
  offer,
  isSeller,
  onAccept,
  onReject,
  onPayEscrow,
}) => {
  const isPending = offer.status === 'PENDING';
  const isAccepted = offer.status === 'ACCEPTED';
  const isRejected = offer.status === 'REJECTED';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Tag size={18} color={colors.primary} />
          <Text style={styles.title}>Offre de prix</Text>
        </View>
        <View
          style={[
            styles.badge,
            isAccepted ? styles.badgeSuccess : isRejected ? styles.badgeDanger : styles.badgeWarning,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isAccepted ? styles.badgeSuccessText : isRejected ? styles.badgeDangerText : styles.badgeWarningText,
            ]}
          >
            {isPending ? 'En attente' : isAccepted ? 'Acceptée' : 'Refusée'}
          </Text>
        </View>
      </View>

      <Text style={styles.price}>{formatPrice(offer.offeredPrice)}</Text>

      {isPending && isSeller && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => onReject(offer.id)}
          >
            <X size={16} color={colors.danger} />
            <Text style={styles.rejectBtnText}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => onAccept(offer.id)}
          >
            <Check size={16} color="#ffffff" />
            <Text style={styles.acceptBtnText}>Accepter</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAccepted && !isSeller && (
        <TouchableOpacity
          style={styles.payEscrowBtn}
          onPress={() => onPayEscrow(offer.offeredPrice)}
        >
          <ShieldCheck size={18} color="#ffffff" />
          <Text style={styles.payEscrowBtnText}>
            Payer {formatPrice(offer.offeredPrice)} avec Séquestre Garanti
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeWarningText: {
    color: '#D97706',
  },
  badgeSuccessText: {
    color: colors.success,
  },
  badgeDangerText: {
    color: colors.danger,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  payEscrowBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
  },
  payEscrowBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ChatOfferCard;
