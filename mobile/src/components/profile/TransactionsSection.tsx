/**
 * Section « Mes commandes / Mes transactions » ReVibe FliP Mobile (US-19)
 *
 * Permet à l'utilisateur de suivre ses achats (côté acheteur) et ses ventes / revenus
 * encaissés (côté vendeur), et d'ouvrir OrderDetailScreen au toucher d'une ligne.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshCw, ShoppingBag, Store, Wallet } from 'lucide-react-native';
import { Order } from '../../types';
import { orderService } from '../../services';
import { colors, formatPrice } from '../../theme/colors';
import { TransactionRowCard } from './TransactionRowCard';

interface TransactionsSectionProps {
  navigation: any;
  mode?: 'both' | 'sellerOnly';
  initialRole?: 'buyer' | 'seller';
  refreshKey?: number;
}

const INACTIVE_ORDER_STATUSES = new Set(['CANCELLED', 'EXPIRED']);

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  navigation,
  mode = 'both',
  initialRole = 'buyer',
  refreshKey = 0,
}) => {
  const [roleTab, setRoleTab] = useState<'buyer' | 'seller'>(
    mode === 'sellerOnly' ? 'seller' : initialRole
  );
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'sellerOnly') {
        const sales = await orderService.getSellerOrders();
        setSellerOrders(sales);
      } else {
        const [purchases, sales] = await Promise.all([
          orderService.getBuyerOrders(),
          orderService.getSellerOrders(),
        ]);
        setBuyerOrders(purchases);
        setSellerOrders(sales);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Impossible de charger vos commandes et transactions.'
      );
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders, refreshKey])
  );

  const activeRole: 'buyer' | 'seller' =
    mode === 'sellerOnly' ? 'seller' : roleTab;
  const activeOrders = activeRole === 'buyer' ? buyerOrders : sellerOrders;

  const summary = useMemo(() => {
    if (activeRole === 'buyer') {
      const validOrders = buyerOrders.filter(
        (o) =>
          !INACTIVE_ORDER_STATUSES.has(o.status) &&
          o.payment?.status !== 'REFUNDED' &&
          o.payment?.escrowStatus !== 'REFUNDED_TO_BUYER'
      );
      const inProgressCount = buyerOrders.filter(
        (o) =>
          o.status === 'PAID_ESCROW_LOCKED' ||
          o.status === 'SHIPPED' ||
          o.status === 'DELIVERED'
      ).length;
      const totalSpent = validOrders.reduce(
        (sum, o) => sum + (Number(o.totalAmount) || 0),
        0
      );
      return {
        firstLabel: 'Achats',
        firstValue: String(buyerOrders.length),
        secondLabel: 'En cours',
        secondValue: String(inProgressCount),
        thirdLabel: 'Total payé',
        thirdValue: formatPrice(totalSpent),
      };
    }

    const releasedAmount = sellerOrders
      .filter(
        (o) =>
          o.payment?.escrowStatus === 'RELEASED_TO_SELLER' ||
          o.status === 'COMPLETED'
      )
      .reduce((sum, o) => sum + (Number(o.sellerPayout) || 0), 0);

    const lockedAmount = sellerOrders
      .filter(
        (o) =>
          !INACTIVE_ORDER_STATUSES.has(o.status) &&
          o.status !== 'COMPLETED' &&
          (o.payment?.escrowStatus === 'LOCKED' ||
            o.status === 'PAID_ESCROW_LOCKED' ||
            o.status === 'SHIPPED' ||
            o.status === 'DELIVERED' ||
            o.status === 'DISPUTED')
      )
      .reduce((sum, o) => sum + (Number(o.sellerPayout) || 0), 0);

    return {
      firstLabel: 'Ventes',
      firstValue: String(sellerOrders.length),
      secondLabel: 'Revenus encaissés',
      secondValue: formatPrice(releasedAmount),
      thirdLabel: 'En séquestre',
      thirdValue: formatPrice(lockedAmount),
    };
  }, [activeRole, buyerOrders, sellerOrders]);

  const handleOpenOrder = (order: Order) => {
    navigation.navigate('OrderDetail', { orderId: order.id, order });
  };

  return (
    <View style={styles.container}>
      {/* En-tête de section */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Wallet size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Mes commandes / Mes transactions</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Actualiser mes transactions"
          style={styles.refreshBtn}
          onPress={loadOrders}
          disabled={loading}
        >
          <RefreshCw size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sélecteur Acheteur / Vendeur (sur ProfileScreen) */}
      {mode === 'both' && (
        <View style={styles.tabsRow}>
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: activeRole === 'buyer' }}
            style={[styles.tabBtn, activeRole === 'buyer' && styles.tabBtnActive]}
            onPress={() => setRoleTab('buyer')}
            activeOpacity={0.8}
          >
            <ShoppingBag
              size={15}
              color={activeRole === 'buyer' ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeRole === 'buyer' && styles.tabBtnTextActive,
              ]}
            >
              Acheteur ({buyerOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: activeRole === 'seller' }}
            style={[styles.tabBtn, activeRole === 'seller' && styles.tabBtnActive]}
            onPress={() => setRoleTab('seller')}
            activeOpacity={0.8}
          >
            <Store
              size={15}
              color={activeRole === 'seller' ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeRole === 'seller' && styles.tabBtnTextActive,
              ]}
            >
              Vendeur ({sellerOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bandeau résumé financier */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summary.firstLabel}</Text>
          <Text style={styles.summaryValue}>{summary.firstValue}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summary.secondLabel}</Text>
          <Text
            style={[
              styles.summaryValue,
              activeRole === 'seller' && { color: colors.success },
            ]}
            numberOfLines={1}
          >
            {summary.secondValue}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summary.thirdLabel}</Text>
          <Text
            style={[styles.summaryValue, { color: colors.primary }]}
            numberOfLines={1}
          >
            {summary.thirdValue}
          </Text>
        </View>
      </View>

      {/* Contenu : chargement, erreur, vide ou liste */}
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Chargement de vos transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadOrders}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : activeOrders.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyTitle}>
            {activeRole === 'buyer'
              ? 'Aucun achat enregistré'
              : 'Aucune vente enregistrée'}
          </Text>
          <Text style={styles.stateText}>
            {activeRole === 'buyer'
              ? 'Vos commandes et paiements Mobile Money apparaîtront ici.'
              : 'Vos ventes et revenus nets apparaîtront ici dès votre première commande.'}
          </Text>
        </View>
      ) : (
        <View>
          {activeOrders.map((order) => (
            <TransactionRowCard
              key={`${activeRole}-${order.id}`}
              order={order}
              role={activeRole}
              onPress={handleOpenOrder}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stateBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stateText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default TransactionsSection;
