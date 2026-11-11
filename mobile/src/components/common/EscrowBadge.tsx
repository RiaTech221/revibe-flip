/**
 * Badge Visuel Séquestre Garanti ReVibe Shield Mobile
 * 
 * Badge de confiance attestant que la transaction bénéficie de la protection séquestre ReVibe Shield.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface EscrowBadgeProps {
  compact?: boolean;
}

export const EscrowBadge: React.FC<EscrowBadgeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ShieldCheck size={14} color={colors.primary} />
        <Text style={styles.compactText}>Séquestre 1%</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.iconCircle}>
        <ShieldCheck size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Protection Acheteur & Vendeur (1%)</Text>
        <Text style={styles.description}>
          Les fonds sont sécurisés sous séquestre Wave/Orange Money jusqu'à confirmation de la livraison.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginVertical: 10,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
