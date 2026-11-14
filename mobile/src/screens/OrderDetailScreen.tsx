/**
 * Écran Suivi de Commande (OrderDetailScreen) ReVibe FliP Mobile
 * 
 * Suivi transparent du cycle de vie d'une commande passée ou vendue :
 *  * - Timeline visuelle du statut de livraison (En attente, Payée, Expédiée, Livrée, Clôturée)
 *  * - Détails du montant consigné sous séquestre bancaire
 *  * - Bouton de confirmation de conformité débloquant instantanément les fonds du vendeur
 *  * - Possibilité d'ouvrir un litige en cas de réclamation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Order } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { DeliveryTimeline, OrderFinancialSummary } from '../components/order';
import { orderService } from '../services';
import { ShieldCheck, Truck } from 'lucide-react-native';

export const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(route.params.order || null);
  const [loading, setLoading] = useState(!route.params.order);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    orderService
      .getOrderById(orderId)
      .then((data) => {
        if (data) setOrder(data);
      })
      .catch((err) => console.warn('Error loading order', err))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleConfirmReceipt = async () => {
    Alert.alert(
      'Confirmer la réception',
      'Avez-vous bien reçu et vérifié votre article ? Cette action déclenchera le versement au vendeur.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, libérer les fonds',
          onPress: async () => {
            setConfirming(true);
            try {
              const updated = await orderService.confirmReceipt(orderId);
              if (updated) setOrder(updated);
              Alert.alert('Succès', 'Merci ! La commande est finalisée et le vendeur a reçu son paiement.');
            } catch (err: any) {
              Alert.alert('Erreur', err.response?.data?.message || 'Impossible de confirmer la réception.');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack onBack={() => navigation.goBack()} title="Détail Commande" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isDelivered = order.deliveryStatus === 'DELIVERED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        title={`Commande #${order.id}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Header Card */}
        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <View style={styles.orderIdBadge}>
              <Truck size={14} color={colors.primary} />
              <Text style={styles.orderIdText}>N° {order.id}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>

          <Text style={styles.productTitle}>
            {order.product?.title || 'Article commandé'}
          </Text>
          <Text style={styles.addressText}>
            Livraison à : {order.deliveryAddress || 'Dakar'}, {order.deliveryCity || 'Sénégal'}
          </Text>
        </View>

        {/* Delivery Progress Timeline */}
        <DeliveryTimeline status={order.deliveryStatus || 'PENDING'} />

        {/* Financial Escrow Breakdown */}
        <OrderFinancialSummary order={order} />

        {/* Buyer Escrow Action Button */}
        {!isDelivered ? (
          <TouchableOpacity
            style={[styles.confirmBtn, confirming && styles.btnDisabled]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            <ShieldCheck size={20} color="#ffffff" />
            <Text style={styles.confirmBtnText}>
              {confirming ? 'Validation...' : 'Confirmer la réception & Libérer les fonds'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBanner}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.completedText}>
              Fonds transférés au vendeur avec succès. Merci d'avoir choisi ReVibe !
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completedText: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default OrderDetailScreen;
