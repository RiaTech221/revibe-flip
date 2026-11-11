/**
 * Carte d'Information Séquestre ReVibe Shield Mobile
 * 
 * Encadré explicatif rappelant à l'acheteur que son argent est séquestré en sécurité et ne sera remis au vendeur qu'après validation.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Lock, RotateCcw } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export const EscrowGuaranteeCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ShieldCheck size={20} color={colors.primary} />
        <Text style={styles.title}>Garantie Séquestre ReVibe</Text>
      </View>

      <View style={styles.item}>
        <Lock size={15} color={colors.textSecondary} />
        <Text style={styles.desc}>
          Vos fonds sont bloqués sur un compte tiers certifié jusqu'à livraison.
        </Text>
      </View>

      <View style={styles.item}>
        <RotateCcw size={15} color={colors.textSecondary} />
        <Text style={styles.desc}>
          Remboursement intégral garanti en cas d'article non conforme ou non expédié.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  desc: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#15803D',
  },
});

export default EscrowGuaranteeCard;
