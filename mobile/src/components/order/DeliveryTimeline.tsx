/**
 * Frise Chronologique de Livraison ReVibe FliP Mobile
 * 
 * Composant visuel représentant les étapes successives d'une commande (Création, Paiement sous séquestre, Expédition, Réception, Clôture).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, Truck } from 'lucide-react-native';
import { DeliveryStatus } from '../../types';
import { colors } from '../../theme/colors';

interface DeliveryTimelineProps {
  status: DeliveryStatus;
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({ status }) => {
  const steps: { label: string; key: DeliveryStatus; desc: string }[] = [
    { label: 'Commande validée', key: 'PENDING', desc: 'Fonds sécurisés sous séquestre' },
    { label: 'En préparation', key: 'DISPATCHED', desc: 'Le vendeur a emballé le colis' },
    { label: 'En cours de livraison', key: 'IN_TRANSIT', desc: 'Pris en charge par le transporteur' },
    { label: 'Livré & vérifié', key: 'DELIVERED', desc: 'Fonds libérés au vendeur' },
  ];

  const getStatusIndex = (current: DeliveryStatus) => {
    switch (current) {
      case 'PENDING':
        return 0;
      case 'DISPATCHED':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStatusIndex(status);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Suivi d'expédition</Text>
      <View style={styles.timeline}>
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.circle,
                    isDone ? styles.circleDone : styles.circlePending,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} color="#ffffff" />
                  ) : (
                    <Clock size={14} color={colors.textSecondary} />
                  )}
                </View>
                {idx < steps.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      idx < currentIndex ? styles.connectorDone : styles.connectorPending,
                    ]}
                  />
                )}
              </View>

              <View style={styles.contentCol}>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone ? styles.stepLabelDone : styles.stepLabelPending,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 30,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.success,
  },
  circlePending: {
    backgroundColor: '#E5E7EB',
  },
  circleCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  connectorDone: {
    backgroundColor: colors.success,
  },
  connectorPending: {
    backgroundColor: '#E5E7EB',
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabelDone: {
    color: colors.textPrimary,
  },
  stepLabelPending: {
    color: colors.textSecondary,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default DeliveryTimeline;
