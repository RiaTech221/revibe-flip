import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Order } from '../../types';
import { colors, formatPrice } from '../../theme/colors';

interface OrderFinancialSummaryProps {
  order: Order;
}

export const OrderFinancialSummary: React.FC<OrderFinancialSummaryProps> = ({ order }) => {
  const itemPrice = order.agreedPrice || order.totalAmount || 0;
  const buyerFee = Math.round(itemPrice * 0.05); // 5% buyer protection
  const deliveryFee = 1500;
  const total = itemPrice + buyerFee + deliveryFee;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Détail financier</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Prix de l'article</Text>
        <Text style={styles.value}>{formatPrice(itemPrice)}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelWithIcon}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={styles.label}>Protection Acheteur (5%)</Text>
        </View>
        <Text style={styles.value}>{formatPrice(buyerFee)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Frais de livraison estimés</Text>
        <Text style={styles.value}>{formatPrice(deliveryFee)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Séquestré</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      <View style={styles.escrowNotice}>
        <ShieldCheck size={16} color={colors.primary} />
        <Text style={styles.escrowNoticeText}>
          Vos fonds sont consignés sur un compte séquestre certifié. Le vendeur ne reçoit son virement qu'après votre confirmation de réception.
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
    marginBottom: 10,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
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
    marginTop: 14,
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
