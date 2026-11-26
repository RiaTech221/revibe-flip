/**
 * Écran Suivi de Commande (OrderDetailScreen) ReVibe FliP Mobile
 * 
 * Suivi transparent du cycle de vie d'une commande ou transaction passée/vendue :
 *  * - Informations produit, rôle (Achat / Vente), acheteur/vendeur et livraison
 *  * - Frise chronologique du statut d'expédition
 *  * - Détails financiers complets : N° transaction, montants (total, frais 1 %, commission, net vendeur), statuts et dates
 *  * - Vérification paiement et confirmation de conformité débloquant le séquestre
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Order } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { DeliveryTimeline, OrderFinancialSummary } from '../components/order';
import { orderService, paymentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatImageUrl } from '../utils/imageUrl';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  XCircle,
  User as UserIcon,
  MapPin,
  Package,
} from 'lucide-react-native';

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING_PAYMENT':
    case 'AWAITING_PAYMENT':
      return 'En attente de paiement';
    case 'PAID_ESCROW_LOCKED':
      return 'Payée (Séquestre)';
    case 'SHIPPED':
      return 'Expédiée';
    case 'DELIVERED':
      return 'Livrée';
    case 'COMPLETED':
      return 'Finalisée';
    case 'DISPUTED':
      return 'Litige en cours';
    case 'CANCELLED':
      return 'Annulée';
    case 'EXPIRED':
      return 'Expirée';
    default:
      return status;
  }
}

export const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId, order: initialOrder } = route.params || {};
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(
    async (isRefresh = false) => {
      if (!orderId) return;
      if (isRefresh) {
        setRefreshing(true);
      } else if (!order) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const data = await orderService.getOrderById(orderId);
        if (data) setOrder(data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          'Impossible de charger les détails de cette transaction.';
        if (!order) {
          setLoadError(msg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

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
              Alert.alert(
                'Succès',
                'Merci ! La commande est finalisée et le vendeur a reçu son paiement.'
              );
            } catch (err: any) {
              Alert.alert(
                'Erreur',
                err.response?.data?.message ||
                  'Impossible de confirmer la réception.'
              );
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleVerifyPayment = async () => {
    setActionLoading(true);
    try {
      await paymentService.verifyPaymentStatus(orderId);
      await loadOrder(true);
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.response?.data?.message || 'Vérification impossible.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          showBack
          onBack={() => navigation.goBack()}
          title="Détail Transaction"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          showBack
          onBack={() => navigation.goBack()}
          title="Détail Transaction"
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {loadError || 'Transaction introuvable.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadOrder()}
          >
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isBuyer = user?.id === order.buyer?.id;
  const isSeller = user?.id === order.seller?.id;
  const isPendingPayment =
    order.status === 'PENDING_PAYMENT' || order.status === 'AWAITING_PAYMENT';
  const isCancelled =
    order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const isCompleted = order.status === 'COMPLETED';
  const currentDeliveryStatus =
    order.delivery?.status || order.deliveryStatus || 'PENDING';
  const canConfirmReceipt =
    isBuyer &&
    (order.status === 'DELIVERED' || currentDeliveryStatus === 'DELIVERED') &&
    !isCompleted;

  const firstItem = order.items?.[0];
  const productTitle =
    order.productTitle ||
    order.product?.title ||
    firstItem?.title ||
    firstItem?.productTitle ||
    'Article commandé';
  const productImage = formatImageUrl(
    order.productImageUrl ||
      order.product?.primaryImage ||
      firstItem?.imageUrl ||
      firstItem?.productImageUrl
  );
  const counterparty = isSeller ? order.buyer : order.seller;
  const counterpartyLabel = isSeller ? 'Acheteur' : 'Vendeur';
  const deliveryModeLabel =
    order.deliveryModeLabel ||
    order.delivery?.modeLabel ||
    (order.deliveryMode === 'DIRECT_HANDOVER'
      ? 'Remise en main propre'
      : 'Livraison à domicile');

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        title={order.orderNumber || `Commande #${order.id}`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrder(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Order & Product Header Card */}
        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeGroup}>
              <View style={styles.orderIdBadge}>
                <Truck size={14} color={colors.primary} />
                <Text style={styles.orderIdText}>
                  {order.orderNumber || `N° ${order.id}`}
                </Text>
              </View>
              {(isBuyer || isSeller) && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {isSeller ? 'Votre vente' : 'Votre achat'}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                isCancelled && { backgroundColor: colors.dangerLight },
                isPendingPayment && { backgroundColor: colors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isCancelled && { color: colors.danger },
                  isPendingPayment && { color: '#B45309' },
                ]}
              >
                {formatOrderStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.productHeaderRow}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productThumb} />
            ) : (
              <View style={styles.productThumbPlaceholder}>
                <Package size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.productTitleCol}>
              <Text style={styles.productTitle}>{productTitle}</Text>
              {order.itemCount && order.itemCount > 1 ? (
                <Text style={styles.multiItemText}>
                  {order.itemCount} articles dans cette commande
                </Text>
              ) : null}
            </View>
          </View>

          {order.items && order.items.length > 1 ? (
            <View style={styles.itemsListBox}>
              {order.items.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.itemLine}>
                  <Text style={styles.itemLineTitle} numberOfLines={1}>
                    • {item.title || item.productTitle || `Article #${item.productId}`}
                  </Text>
                  <Text style={styles.itemLinePrice}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.metaList}>
            {counterparty ? (
              <View style={styles.metaRow}>
                <UserIcon size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {counterpartyLabel} :{' '}
                  <Text style={styles.metaStrong}>
                    {counterparty.fullName || counterparty.phone || '—'}
                  </Text>
                  {counterparty.phone ? ` (${counterparty.phone})` : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {deliveryModeLabel}
                {order.deliveryAddress || order.deliveryCity
                  ? ` — ${[order.deliveryAddress, order.deliveryCity].filter(Boolean).join(', ')}`
                  : ''}
              </Text>
            </View>

            {order.delivery?.trackingNumber ? (
              <View style={styles.metaRow}>
                <Truck size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  Suivi :{' '}
                  <Text style={styles.metaStrong}>
                    {order.delivery.trackingNumber}
                  </Text>
                  {order.delivery.carrierName
                    ? ` (${order.delivery.carrierName})`
                    : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Delivery Progress Timeline */}
        <DeliveryTimeline status={currentDeliveryStatus} />

        {/* Financial Escrow Breakdown */}
        <OrderFinancialSummary order={order} />

        {/* Actions selon l'état de la commande */}
        {isCancelled ? (
          <View
            style={[
              styles.completedBanner,
              { backgroundColor: colors.dangerLight, borderColor: '#FECACA' },
            ]}
          >
            <XCircle size={18} color={colors.danger} />
            <Text style={[styles.completedText, { color: colors.danger }]}>
              Paiement échoué, expiré ou commande annulée. L'annonce a été remise en vente.
            </Text>
          </View>
        ) : isPendingPayment && isBuyer ? (
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: colors.primary },
              actionLoading && styles.btnDisabled,
            ]}
            onPress={handleVerifyPayment}
            disabled={actionLoading}
          >
            <RefreshCw size={18} color="#ffffff" />
            <Text style={styles.confirmBtnText}>
              {actionLoading
                ? 'Vérification...'
                : 'Vérifier le statut du paiement'}
            </Text>
          </TouchableOpacity>
        ) : canConfirmReceipt ? (
          <TouchableOpacity
            style={[styles.confirmBtn, confirming && styles.btnDisabled]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            <ShieldCheck size={20} color="#ffffff" />
            <Text style={styles.confirmBtnText}>
              {confirming
                ? 'Validation...'
                : 'Confirmer la réception & Libérer les fonds'}
            </Text>
          </TouchableOpacity>
        ) : isCompleted ? (
          <View style={styles.completedBanner}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.completedText}>
              Fonds transférés au vendeur avec succès. Merci d'avoir choisi ReVibe !
            </Text>
          </View>
        ) : null}
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
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  roleBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  productThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitleCol: {
    flex: 1,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  multiItemText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  itemsListBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemLineTitle: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
  },
  itemLinePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaList: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaStrong: {
    color: colors.textPrimary,
    fontWeight: '700',
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
