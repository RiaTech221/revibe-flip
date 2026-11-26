/**
 * Ligne de Commande / Transaction Mobile ReVibe FliP
 *
 * Affiche le numéro de transaction, le produit, les montants (total, frais 1%, net vendeur),
 * le statut de paiement et les dates. Ouvre OrderDetailScreen au toucher.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ChevronRight, ShieldCheck, Calendar, Tag } from 'lucide-react-native';
import { Order } from '../../types';
import { colors, formatPrice } from '../../theme/colors';
import { formatImageUrl } from '../../utils/imageUrl';

interface TransactionRowCardProps {
  order: Order;
  role: 'buyer' | 'seller';
  onPress: (order: Order) => void;
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolvePaymentBadge(order: Order): {
  label: string;
  bg: string;
  text: string;
} {
  const payStatus = order.payment?.status || order.paymentStatus;
  const escrowStatus = order.payment?.escrowStatus || order.escrowStatus;
  const orderStatus = order.status;

  if (orderStatus === 'CANCELLED' || payStatus === 'FAILED') {
    return {
      label: payStatus === 'FAILED' ? 'Paiement échoué' : 'Annulée',
      bg: colors.dangerLight,
      text: colors.danger,
    };
  }
  if (orderStatus === 'EXPIRED') {
    return { label: 'Expirée', bg: '#F1F5F9', text: colors.textSecondary };
  }
  if (payStatus === 'REFUNDED' || escrowStatus === 'REFUNDED_TO_BUYER') {
    return { label: 'Remboursé', bg: colors.primaryLight, text: colors.primary };
  }
  if (escrowStatus === 'RELEASED_TO_SELLER' || orderStatus === 'COMPLETED') {
    return { label: 'Libéré au vendeur', bg: colors.successLight, text: '#047857' };
  }
  if (
    payStatus === 'SUCCESS' ||
    orderStatus === 'PAID_ESCROW_LOCKED' ||
    orderStatus === 'SHIPPED' ||
    orderStatus === 'DELIVERED' ||
    orderStatus === 'DISPUTED'
  ) {
    return { label: 'Payé (Séquestre)', bg: '#EEF2FF', text: colors.primary };
  }
  return { label: 'En attente', bg: colors.warningLight, text: '#B45309' };
}

export const TransactionRowCard: React.FC<TransactionRowCardProps> = ({
  order,
  role,
  onPress,
}) => {
  const txNumber = order.payment?.transactionReference || order.orderNumber;
  const firstItem = order.items?.[0];
  const baseTitle =
    order.productTitle ||
    order.product?.title ||
    firstItem?.title ||
    firstItem?.productTitle ||
    'Article ReVibe';
  const extraCount = order.itemCount && order.itemCount > 1 ? ` (+${order.itemCount - 1})` : '';
  const productTitle = `${baseTitle}${extraCount}`;
  const rawImg =
    order.productImageUrl ||
    order.product?.primaryImage ||
    firstItem?.imageUrl ||
    firstItem?.productImageUrl;
  const imgUrl = formatImageUrl(rawImg);
  const badge = resolvePaymentBadge(order);
  const methodName = order.payment?.paymentMethodName || order.payment?.paymentMethod || order.paymentMethod;
  const paymentDate = order.payment?.paymentDate;
  const releasedDate = order.payment?.escrowReleasedDate;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(order)}
      activeOpacity={0.75}
    >
      {/* En-tête : N° transaction + Statut paiement */}
      <View style={styles.headerRow}>
        <View style={styles.refRow}>
          <Tag size={13} color={colors.primary} />
          <Text style={styles.txRef} numberOfLines={1}>
            {txNumber}
          </Text>
          {methodName ? (
            <View style={styles.methodPill}>
              <Text style={styles.methodPillText}>{methodName}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Produit */}
      <View style={styles.productRow}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <ShieldCheck size={18} color={colors.primary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {productTitle}
          </Text>
          <Text style={styles.orderSub}>
            Commande {order.orderNumber} • {role === 'buyer' ? `Vendeur : ${order.seller?.fullName || '—'}` : `Acheteur : ${order.buyer?.fullName || '—'}`}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textSecondary} />
      </View>

      {/* Montants : Total, Frais 1 %, Net vendeur */}
      <View style={styles.amountsBox}>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{formatPrice(order.totalAmount)}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Frais 1 %</Text>
          <Text style={styles.amountValue}>{formatPrice(order.validationFee)}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Net vendeur</Text>
          <Text style={[styles.amountValue, styles.netValue]}>
            {formatPrice(order.sellerPayout)}
          </Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.datesRow}>
        <View style={styles.dateItem}>
          <Calendar size={12} color={colors.textSecondary} />
          <Text style={styles.dateText}>Créée : {formatDateTime(order.createdAt)}</Text>
        </View>
        {paymentDate ? (
          <Text style={styles.dateText}>Payée : {formatDateTime(paymentDate)}</Text>
        ) : null}
        {releasedDate ? (
          <Text style={styles.dateText}>Libérée : {formatDateTime(releasedDate)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  refRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txRef: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  methodPill: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
  },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountsBox: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  netValue: {
    color: colors.success,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default TransactionRowCard;
