import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProductCondition } from '../../types';
import { colors } from '../../theme/colors';

interface ConditionOption {
  value: ProductCondition;
  label: string;
  desc: string;
}

const CONDITIONS: ConditionOption[] = [
  { value: 'NEW_WITH_TAG', label: 'Neuf avec étiquette', desc: 'Jamais porté, emballage d’origine' },
  { value: 'NEW_WITHOUT_TAG', label: 'Neuf sans étiquette', desc: 'Jamais porté mais sans étiquette' },
  { value: 'VERY_GOOD', label: 'Très bon état', desc: 'Peu porté, aucun défaut visible' },
  { value: 'GOOD', label: 'Bon état', desc: 'Quelques marques d’usage légères' },
  { value: 'FAIR', label: 'État satisfaisant', desc: 'Traces d’usure normales du vêtement' },
];

interface ConditionSelectorProps {
  selectedCondition: ProductCondition;
  onSelect: (condition: ProductCondition) => void;
}

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  selectedCondition,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>État de l'article *</Text>
      <View style={styles.list}>
        {CONDITIONS.map((c) => {
          const isSelected = selectedCondition === c.value;
          return (
            <TouchableOpacity
              key={c.value}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelect(c.value)}
              activeOpacity={0.7}
            >
              <View style={styles.radio}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.textCol}>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {c.label}
                </Text>
                <Text style={styles.desc}>{c.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFF',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  desc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default ConditionSelector;
