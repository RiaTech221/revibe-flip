/**
 * Récapitulatif Financier de Commande ReVibe FliP Mobile
 * 
 * Composant détaillant les lignes tarifaires : montant de l'article, frais de séquestre (1%), coût de livraison et total à payer.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { colors, formatPrice } from '../../theme/colors';

interface OrderSummaryBoxProps {
  product: Product;
  agreedPrice?: number;
  deliveryFee: number;
}

export const OrderSummaryBox: React.FC<OrderSummaryBoxProps> = ({
  product,
  agreedPrice,
  deliveryFee,
}) => {
  const itemPrice = agreedPrice || product.price;
  const buyerFee = Math.round(itemPrice * 0.05);
  const total = itemPrice + buyerFee + deliveryFee;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Récapitulatif de la commande</Text>

      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={styles.value}>{formatPrice(itemPrice)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Protection acheteur (5%)</Text>
        <Text style={styles.value}>{formatPrice(buyerFee)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Frais de livraison</Text>
        <Text style={styles.value}>{formatPrice(deliveryFee)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total à payer</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    paddingRight: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
});

export default OrderSummaryBox;
