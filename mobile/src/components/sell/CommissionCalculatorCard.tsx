/**
 * Calculatrice de Commission Vendeur en Direct ReVibe FliP Mobile
 * 
 * Composant interactif calculant en temps réel la commission de service et le montant net exact que touchera le vendeur via Mobile Money.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info, ShieldCheck } from 'lucide-react-native';
import { colors, formatPrice } from '../../theme/colors';

interface CommissionCalculatorCardProps {
  price: number;
}

export const CommissionCalculatorCard: React.FC<CommissionCalculatorCardProps> = ({ price }) => {
  const commission = Math.round(price * 0.2); // 20% platform commission
  const payout = Math.max(0, price - commission);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ShieldCheck size={18} color={colors.primary} />
        <Text style={styles.title}>Estimation de vos gains nets</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Prix affiché aux acheteurs</Text>
        <Text style={styles.value}>{formatPrice(price)}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelWithInfo}>
          <Text style={styles.label}>Commission ReVibe (20%)</Text>
          <Info size={13} color={colors.textSecondary} />
        </View>
        <Text style={styles.commissionValue}>- {formatPrice(commission)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.payoutRow}>
        <Text style={styles.payoutLabel}>Ce que vous recevez</Text>
        <Text style={styles.payoutValue}>{formatPrice(payout)}</Text>
      </View>

      <Text style={styles.payoutNote}>
        Les fonds sont versés instantanément sur votre compte Wave / Orange Money dès que l'acheteur valide la réception de son colis.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commissionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  payoutValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.success,
  },
  payoutNote: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 10,
  },
});

export default CommissionCalculatorCard;
