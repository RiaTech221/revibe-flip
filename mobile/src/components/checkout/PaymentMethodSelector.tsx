import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { PaymentMethod } from '../../types';
import { colors } from '../../theme/colors';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  badge: string;
  badgeColor: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'WAVE', name: 'Wave Mobile Money', badge: 'Sans frais', badgeColor: '#00D1FF' },
  { id: 'ORANGE_MONEY', name: 'Orange Money', badge: 'Rapide', badgeColor: '#FF7900' },
  { id: 'FREE_MONEY', name: 'Free Money', badge: 'Disponible', badgeColor: '#CD1224' },
  { id: 'CARD', name: 'Carte Bancaire (Visa/Mastercard)', badge: '3D Secure', badgeColor: '#2563EB' },
];

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moyen de paiement sécurisé</Text>
      <View style={styles.list}>
        {PAYMENT_OPTIONS.map((opt) => {
          const isSelected = selectedMethod === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radio}>
                {isSelected && <View style={styles.radioInner} />}
              </View>

              <View style={styles.infoCol}>
                <Text style={[styles.name, isSelected && styles.nameSelected]}>
                  {opt.name}
                </Text>
                <View style={[styles.badge, { backgroundColor: `${opt.badgeColor}15` }]}>
                  <Text style={[styles.badgeText, { color: opt.badgeColor }]}>
                    {opt.badge}
                  </Text>
                </View>
              </View>

              {isSelected && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  infoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PaymentMethodSelector;
