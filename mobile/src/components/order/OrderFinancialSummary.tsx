/**
 * Tableau Financier Séquestre de Commande ReVibe FliP Mobile
 * 
 * Affiche la décomposition des sommes consignées sous séquestre, le statut de paiement,
 * les dates clés et le mode de règlement utilisé.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Order } from '../../types';
import { colors, formatPrice } from '../../theme/colors';

interface OrderFinancialSummaryProps {
  order: Order;
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

function formatPaymentStatusLabel(order: Order): string {
  const payStatus = order.payment?.status || order.paymentStatus;
  if (payStatus === 'SUCCESS') return 'Payé';
  if (payStatus === 'FAILED') return 'Échoué';
  if (payStatus === 'REFUNDED') return 'Remboursé';
  if (payStatus === 'INITIATED') return 'En attente de confirmation';
  if (order.status === 'CANCELLED') return 'Annulée';
  if (order.status === 'EXPIRED') return 'Expirée';
  return 'En attente';
}

function formatEscrowStatusLabel(order: Order): string {
  const escrow = order.payment?.escrowStatus || order.escrowStatus;
  if (escrow === 'RELEASED_TO_SELLER' || order.status === 'COMPLETED') {
    return 'Libéré au vendeur';
  }
  if (escrow === 'REFUNDED_TO_BUYER') return "Remboursé à l'acheteur";
  if (escrow === 'LOCKED') return 'Séquestre bloqué (protégé)';
  return '—';
}

export const OrderFinancialSummary: React.FC<OrderFinancialSummaryProps> = ({ order }) => {
  const itemPrice = order.itemPrice ?? order.agreedPrice ?? 0;
  const buyerFee = order.validationFee ?? Math.round(itemPrice * 0.01);
  const deliveryFee = order.deliveryFee ?? 0;
  const commission = order.platformCommission ?? 0;
  const total = order.totalAmount ?? itemPrice + buyerFee + deliveryFee;
  const sellerPayout = order.sellerPayout ?? Math.max(0, itemPrice - commission);
  const txRef = order.payment?.transactionReference || order.orderNumber;
  const methodLabel =
    order.payment?.paymentMethodName ||
    order.payment?.paymentMethod ||
    order.paymentMethod ||
    'Mobile Money';
  const paymentStatusLabel = formatPaymentStatusLabel(order);
  const escrowStatusLabel = formatEscrowStatusLabel(order);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Détail financier & Transaction</Text>

      <View style={styles.row}>
        <Text style={styles.label}>N° Transaction</Text>
        <Text style={styles.value} numberOfLines={1}>
          {txRef}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>N° Commande</Text>
        <Text style={styles.value}>{order.orderNumber}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Moyen de paiement</Text>
        <Text style={styles.value}>{methodLabel}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Statut paiement</Text>
        <Text style={styles.value}>{paymentStatusLabel}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Statut séquestre</Text>
        <Text style={styles.value}>{escrowStatusLabel}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Prix article(s)</Text>
        <Text style={styles.value}>{formatPrice(itemPrice)}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelWithIcon}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={styles.label}>Frais de validation (1%)</Text>
        </View>
        <Text style={styles.value}>{formatPrice(buyerFee)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Frais de livraison</Text>
        <Text style={styles.value}>
          {deliveryFee > 0 ? formatPrice(deliveryFee) : 'Gratuit (0 FCFA)'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Commission plateforme (20%)</Text>
        <Text style={styles.value}>{formatPrice(commission)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Net vendeur</Text>
        <Text style={[styles.value, { color: colors.success }]}>
          {formatPrice(sellerPayout)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Date de création</Text>
        <Text style={styles.dateValue}>{formatDateTime(order.createdAt)}</Text>
      </View>

      {order.payment?.paymentDate ? (
        <View style={styles.row}>
          <Text style={styles.label}>Date de paiement</Text>
          <Text style={styles.dateValue}>
            {formatDateTime(order.payment.paymentDate)}
          </Text>
        </View>
      ) : null}

      {order.payment?.escrowReleasedDate ? (
        <View style={styles.row}>
          <Text style={styles.label}>Date de libération</Text>
          <Text style={styles.dateValue}>
            {formatDateTime(order.payment.escrowReleasedDate)}
          </Text>
        </View>
      ) : null}

      <View style={styles.escrowNotice}>
        <ShieldCheck size={16} color={colors.primary} />
        <Text style={styles.escrowNoticeText}>
          Vos fonds sont consignés sur un compte séquestre certifié. Le vendeur ne reçoit son virement qu'après confirmation de réception.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  escrowNotice: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },
});

export default OrderFinancialSummary;
